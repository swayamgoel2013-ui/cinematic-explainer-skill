#!/usr/bin/env python3
"""Import real Whisper timestamps or SRT phrases without inventing word timings."""

from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path
import re
import sys


class CaptionError(ValueError):
    """Invalid timing or unsupported transcript data."""


def time_value(value: object, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise CaptionError(f"{label} must be a finite number of seconds.")
    try:
        number = float(value)
    except (ValueError, OverflowError):
        raise CaptionError(f"{label} must be a finite number of seconds.") from None
    if not math.isfinite(number) or number < 0:
        raise CaptionError(f"{label} must be finite and non-negative.")
    return number


def interval(item: dict, label: str) -> tuple[float, float]:
    start = time_value(item.get("start"), f"{label} start")
    end = time_value(item.get("end"), f"{label} end")
    if end <= start:
        raise CaptionError(f"{label} must end after it starts. For zero-duration word tokens, supply genuine segment/phrase timestamps instead.")
    return start, end


def word_captions(raw_words: object, label: str) -> list[dict]:
    if not isinstance(raw_words, list) or not raw_words:
        raise CaptionError(f"{label} must be a non-empty words array.")
    words: list[dict] = []
    previous_end = -1.0
    for index, raw in enumerate(raw_words, 1):
        location = f"{label}, word {index}"
        if not isinstance(raw, dict):
            raise CaptionError(f"{location} must be an object.")
        text = raw.get("word", raw.get("text"))
        if not isinstance(text, str) or not text.strip():
            raise CaptionError(f"{location} needs non-empty word/text content.")
        start, end = interval(raw, location)
        if start < previous_end:
            raise CaptionError(f"{location} overlaps or precedes the previous word. Correct the source timing; it will not be reordered or clamped.")
        words.append({"text": text, "start": start, "end": end})
        previous_end = end
    # Only presentation grouping changes; each original token and timestamp is preserved.
    groups: list[list[dict]] = []
    current: list[dict] = []
    for word in words:
        if current and (len(current) >= 7 or word["end"] - current[0]["start"] > 3.5 or word["start"] - current[-1]["end"] > 0.75):
            groups.append(current)
            current = []
        current.append(word)
    if current:
        groups.append(current)
    return [{"start": group[0]["start"], "end": group[-1]["end"], "words": group,
             "timingMode": "word"} for group in groups]


def validate_captions(captions: list[dict]) -> list[dict]:
    if not captions:
        raise CaptionError("No timed captions found. Untimed transcript text cannot supply caption or word timestamps.")
    previous_end = -1.0
    for index, cue in enumerate(captions, 1):
        start, end = interval(cue, f"Caption {index}")
        if start < previous_end:
            raise CaptionError(f"Caption {index} overlaps or precedes the previous caption. Correct the source; import does not reorder or alter timings.")
        previous_end = end
    return captions


def parse_whisper(data: object) -> list[dict]:
    if not isinstance(data, dict):
        raise CaptionError("Whisper JSON must contain an object with words or timed segments.")
    if "words" in data and data["words"]:
        return validate_captions(word_captions(data["words"], "Top-level words"))
    if "words" in data and not isinstance(data["words"], list):
        raise CaptionError("Top-level words must be an array.")
    segments = data.get("segments")
    if not isinstance(segments, list):
        raise CaptionError("Whisper JSON needs timestamped words or segments. A transcript string has no usable timing.")
    captions: list[dict] = []
    for index, segment in enumerate(segments, 1):
        label = f"Segment {index}"
        if not isinstance(segment, dict):
            raise CaptionError(f"{label} must be an object.")
        if "words" in segment and not isinstance(segment["words"], list):
            raise CaptionError(f"{label} words must be an array.")
        if segment.get("words"):
            captions.extend(word_captions(segment["words"], label))
        else:
            text = segment.get("text")
            if not isinstance(text, str) or not text.strip():
                raise CaptionError(f"{label} has no words or non-empty phrase text.")
            start, end = interval(segment, label)
            captions.append({"start": start, "end": end, "text": text, "timingMode": "phrase"})
    return validate_captions(captions)


SRT_TIME = r"\d{2,}:[0-5]\d:[0-5]\d[,.]\d{3}"
SRT_TIMING = re.compile(rf"^(?P<start>{SRT_TIME})\s+-->\s+(?P<end>{SRT_TIME})(?:\s+.*)?$")


def srt_seconds(value: str) -> float:
    hours, minutes, rest = value.replace(",", ".").split(":")
    seconds, milliseconds = rest.split(".")
    try:
        result = (int(hours) * 3_600_000 + int(minutes) * 60_000 + int(seconds) * 1000 + int(milliseconds)) / 1000
    except (ValueError, OverflowError):
        raise CaptionError("SRT timestamps must be finite and representable as seconds.") from None
    return time_value(result, "SRT timestamp")


def parse_srt(source: str) -> list[dict]:
    source = source.lstrip("\ufeff").replace("\r\n", "\n").replace("\r", "\n")
    captions: list[dict] = []
    for index, block in enumerate(re.split(r"\n[ \t]*\n", source.strip("\n")), 1):
        if not block.strip():
            continue
        lines = block.split("\n")
        if lines[0].strip().isdigit():
            lines = lines[1:]
        match = SRT_TIMING.fullmatch(lines[0].strip()) if lines else None
        if not match:
            raise CaptionError(f"SRT cue {index} needs a valid HH:MM:SS,mmm --> HH:MM:SS,mmm timing line.")
        text = "\n".join(lines[1:])
        if not text.strip():
            raise CaptionError(f"SRT cue {index} has no phrase text.")
        cue = {"start": srt_seconds(match["start"]), "end": srt_seconds(match["end"]),
               "text": text, "timingMode": "phrase"}
        interval(cue, f"SRT cue {index}")
        captions.append(cue)
    return validate_captions(captions)


def import_captions(source: str | Path, output: str | Path, *, format: str = "auto") -> Path:
    destination = Path(output).expanduser().absolute()
    if os.path.lexists(destination):
        raise CaptionError(f"Refusing to overwrite existing output: {destination}")
    path = Path(source).expanduser().resolve(strict=True)
    if not path.is_file():
        raise CaptionError("Caption input must be a regular local file.")
    if format not in {"auto", "whisper", "srt"}:
        raise CaptionError(f"Unsupported caption format: {format}")
    text = path.read_text(encoding="utf-8-sig")
    selected = format
    if selected == "auto":
        if path.suffix.lower() == ".srt":
            selected = "srt"
        elif path.suffix.lower() == ".json" or text.lstrip().startswith("{"):
            selected = "whisper"
        else:
            raise CaptionError("Cannot identify caption format. Use a .json/.srt input or --format whisper|srt.")
    if selected == "whisper":
        try:
            data = json.loads(text)
        except json.JSONDecodeError as exc:
            raise CaptionError(f"Malformed Whisper JSON: {exc}") from exc
        captions = parse_whisper(data)
    else:
        captions = parse_srt(text)
    encoded = json.dumps({"captions": captions}, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive creation protects both existing captions and an input reused as output.
    created = False
    try:
        descriptor = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
        created = True
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            handle.write(encoded)
    except FileExistsError as exc:
        raise CaptionError(f"Refusing to overwrite existing output: {destination}") from exc
    except BaseException:
        if created:
            destination.unlink(missing_ok=True)
        raise
    return destination


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", help="Local Whisper JSON or SRT input")
    parser.add_argument("output", help="New captions JSON path; existing files are never replaced")
    parser.add_argument("--format", choices=("auto", "whisper", "srt"), default="auto")
    args = parser.parse_args(argv)
    try:
        result = import_captions(args.input, args.output, format=args.format)
    except (CaptionError, OSError, UnicodeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    print(f"Wrote {result}. Original timings and text preserved; phrase cues have no invented word timings.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
