#!/usr/bin/env python3
"""Create a local Remotion project without installing packages or authoring a film."""

from __future__ import annotations

import argparse
from decimal import Decimal, InvalidOperation, ROUND_CEILING, ROUND_HALF_UP
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


SKILL_ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = SKILL_ROOT / "assets" / "remotion-template"
ASPECTS = {"9:16": (1080, 1920), "16:9": (1920, 1080), "1:1": (1080, 1080)}
AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".aac", ".ogg", ".opus", ".flac", ".aif", ".aiff", ".webm", ".mp4"}


class WorkflowError(ValueError):
    """An actionable input or environment error."""


def decimal_seconds(value: object, label: str, *, positive: bool = False) -> Decimal:
    if isinstance(value, bool):
        raise WorkflowError(f"{label} must be a finite number.")
    try:
        number = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise WorkflowError(f"{label} must be a finite number.") from None
    if not number.is_finite() or number < 0 or not math.isfinite(float(number)) or (positive and float(number) == 0):
        qualifier = "positive" if positive else "non-negative"
        raise WorkflowError(f"{label} must be finite and {qualifier}.")
    return number


def input_file(value: str | Path, label: str) -> Path:
    try:
        path = Path(value).expanduser().resolve(strict=True)
    except (OSError, RuntimeError) as exc:
        raise WorkflowError(f"Cannot read {label}: {exc}") from exc
    if not path.is_file():
        raise WorkflowError(f"{label} must be a regular file: {path}")
    return path


def probe_audio_duration(audio: Path) -> Decimal:
    """Verify an audio stream and preserve the full stream/container duration."""
    executable = shutil.which("ffprobe")
    if not executable:
        raise WorkflowError("ffprobe is required with --audio. Install FFmpeg, then retry; no packages were installed.")
    command = [executable, "-v", "error", "-select_streams", "a:0", "-show_entries",
               "stream=codec_type,duration:format=duration", "-of", "json", str(audio)]
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=False, timeout=60)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise WorkflowError(f"ffprobe could not inspect the narration: {exc}") from exc
    if result.returncode:
        detail = result.stderr.strip()[:500] or "unsupported or unreadable media"
        raise WorkflowError(f"ffprobe rejected the narration: {detail}")
    try:
        data = json.loads(result.stdout)
    except (json.JSONDecodeError, TypeError) as exc:
        raise WorkflowError("ffprobe returned malformed JSON.") from exc
    if not isinstance(data, dict):
        raise WorkflowError("ffprobe returned an unexpected result.")
    streams = data.get("streams")
    if not isinstance(streams, list) or not streams or not isinstance(streams[0], dict) or streams[0].get("codec_type") != "audio":
        raise WorkflowError("The supplied media has no audio stream.")
    container = data.get("format", {})
    candidates = [streams[0].get("duration"), container.get("duration") if isinstance(container, dict) else None]
    durations = [decimal_seconds(value, "Narration duration reported by ffprobe", positive=True)
                 for value in candidates if value not in (None, "N/A")]
    if not durations:
        raise WorkflowError("ffprobe did not report a usable narration duration.")
    return max(durations)


def load_object(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise WorkflowError(f"Cannot read template data {path.name}: {exc}") from exc
    if not isinstance(data, dict):
        raise WorkflowError(f"Template {path.name} must contain a JSON object.")
    return data


def write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False, allow_nan=False) + "\n", encoding="utf-8")


def create_project(target: str | Path, *, title: str | None = None,
                   audio: str | Path | None = None, context: str | Path | None = None,
                   aspect: str = "9:16", fps: int = 30, end_hold: object = "1.2",
                   template: Path | None = None) -> Path:
    """Copy a template into a new directory; leave existing paths untouched."""
    if aspect not in ASPECTS:
        raise WorkflowError(f"Unsupported aspect ratio: {aspect}")
    if isinstance(fps, bool) or not isinstance(fps, int) or fps <= 0:
        raise WorkflowError("fps must be a positive integer.")
    hold = decimal_seconds(end_hold, "End hold")
    raw_target = Path(target).expanduser().absolute()
    if os.path.lexists(raw_target):
        raise WorkflowError(f"Refusing to overwrite existing target: {raw_target}")
    destination = raw_target.resolve()
    distribution = SKILL_ROOT.resolve()
    if destination == distribution or distribution in destination.parents:
        raise WorkflowError("The new project must be outside the installed skill directory.")
    source = (template or TEMPLATE).resolve()
    if not source.is_dir():
        raise WorkflowError(f"Bundled Remotion template is missing: {source}")
    if destination == source or source in destination.parents:
        raise WorkflowError("The new project must be outside the bundled template directory.")
    audio_path = input_file(audio, "audio") if audio is not None else None
    if audio_path and audio_path.suffix.lower() not in AUDIO_EXTENSIONS:
        raise WorkflowError("Use a supported audio/media extension: " + ", ".join(sorted(AUDIO_EXTENSIONS)))
    context_path = input_file(context, "context") if context is not None else None
    if context_path:
        try:
            context_path.read_text(encoding="utf-8-sig")
        except (OSError, UnicodeError) as exc:
            raise WorkflowError("--context must be a readable UTF-8 text or Markdown file.") from exc
    duration = probe_audio_duration(audio_path) if audio_path else None
    project = load_object(source / "project.json")
    original_fps = project.get("fps")
    project.update(title=title if title is not None else destination.name,
                   width=ASPECTS[aspect][0], height=ASPECTS[aspect][1], fps=fps)
    if not isinstance(project["title"], str) or not project["title"].strip():
        raise WorkflowError("Title must be a non-empty string.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=f".{destination.name}-", dir=destination.parent))
    reserved = False
    try:
        shutil.copytree(source, staging, dirs_exist_ok=True,
                        ignore=shutil.ignore_patterns("node_modules", ".git", "out", ".DS_Store", ".cache"))
        if audio_path is not None and duration is not None:
            frames = int(((duration + hold) * fps).to_integral_value(rounding=ROUND_CEILING))
            relative_audio = "audio/narration" + audio_path.suffix.lower()
            project.update(durationInFrames=frames, audio=relative_audio, audioDuration=float(duration),
                           endHold=float(hold), mode="production", authored=False)
            (staging / "public" / "audio").mkdir(parents=True, exist_ok=True)
            shutil.copy2(audio_path, staging / "public" / relative_audio)
            write_json(staging / "shots.json", {"shots": [{"id": "unplanned", "startFrame": 0,
                       "endFrameExclusive": frames, "action": "Author a topic-specific sequence"}]})
            write_json(staging / "captions.json", {"captions": []})
        else:
            # Demo timing remains eighteen seconds when a different frame rate is requested.
            if isinstance(original_fps, bool) or not isinstance(original_fps, int) or original_fps <= 0:
                raise WorkflowError("Template fps must be a positive integer.")
            if project.get("durationInFrames") != 18 * original_fps:
                raise WorkflowError("The bundled demonstration must be exactly eighteen seconds.")
            shots = load_object(staging / "shots.json")
            if not isinstance(shots.get("shots"), list) or not shots["shots"]:
                raise WorkflowError("Template shots.json must contain a non-empty shots array.")
            for shot in shots["shots"]:
                for key in ("startFrame", "endFrameExclusive"):
                    value = shot.get(key) if isinstance(shot, dict) else None
                    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
                        raise WorkflowError(f"Invalid demo shot {key}.")
                    shot[key] = int((Decimal(value) * fps / original_fps).to_integral_value(rounding=ROUND_HALF_UP))
            project.update(durationInFrames=18 * fps, audio=None, mode="demo", authored=True)
            project.pop("audioDuration", None)
            project.pop("endHold", None)
            write_json(staging / "shots.json", shots)
        if context_path:
            (staging / "media").mkdir(exist_ok=True)
            shutil.copy2(context_path, staging / "media" / "context.md")
        write_json(staging / "project.json", project)
        # mkdir is an atomic no-overwrite reservation, including if another process won the race.
        destination.mkdir()
        reserved = True
        # Windows cannot replace an existing directory with os.replace. Move each staged
        # entry into our newly reserved directory instead; every destination is new.
        # This publishes entries incrementally, with rollback on a normal I/O failure.
        for entry in staging.iterdir():
            entry.rename(destination / entry.name)
        reserved = False
    except FileExistsError as exc:
        raise WorkflowError(f"Refusing to overwrite existing target: {destination}") from exc
    finally:
        if staging.exists():
            shutil.rmtree(staging)
        if reserved:
            shutil.rmtree(destination)  # Only the new project reserved by this invocation.
    return destination


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", help="New, nonexistent project directory")
    parser.add_argument("--title", help="Film title (defaults to target directory name)")
    parser.add_argument("--audio", help="Local narration file; requires ffprobe")
    parser.add_argument("--context", help="Local UTF-8 context; copied only into the new project's media/context.md")
    parser.add_argument("--aspect", choices=ASPECTS, default="9:16")
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--end-hold", default="1.2", help="Seconds after narration (production only; default: 1.2)")
    args = parser.parse_args(argv)
    try:
        result = create_project(args.target, title=args.title, audio=args.audio, context=args.context,
                                aspect=args.aspect, fps=args.fps, end_hold=args.end_hold)
    except (WorkflowError, OSError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    print(f"Created {result}")
    if args.audio:
        print("Production scaffold: authored=false. Replace src/Film.tsx with the topic-specific film, "
              "author shots.json and captions.json, then set authored=true before export. "
              "This flag records completed authoring; it does not request user approval.")
    else:
        print(f"Created the authored eighteen-second demonstration ({18 * args.fps} frames at {args.fps} fps).")
    print("No npm commands, package installation, or network requests were run.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
