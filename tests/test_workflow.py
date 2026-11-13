"""Critical user-facing guarantees of the standard-library workflow commands.

Run from the repository root: python3 -m unittest discover -s tests -v
"""

from decimal import Decimal
from contextlib import redirect_stdout
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "skills" / "cinematic-explainer" / "scripts"


def load_module(name):
    specification = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    return module


project_tool = load_module("create_project")
caption_tool = load_module("import_captions")


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


class ProjectCreationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.template = self.root / "template"
        self.template.mkdir()
        (self.template / "src").mkdir()
        (self.template / "src" / "Film.tsx").write_text("// authored demo\n", encoding="utf-8")
        (self.template / "project.json").write_text(json.dumps({
            "title": "Demo", "fps": 30, "width": 1080, "height": 1920,
            "durationInFrames": 540, "mode": "demo", "authored": True,
        }), encoding="utf-8")
        (self.template / "shots.json").write_text(json.dumps({"shots": [
            {"id": "one", "startFrame": 0, "endFrameExclusive": 210, "action": "first"},
            {"id": "two", "startFrame": 210, "endFrameExclusive": 540, "action": "second"},
        ]}), encoding="utf-8")
        (self.template / "captions.json").write_text('{"captions": []}\n', encoding="utf-8")
        self.target = self.root / "new project"

    def create(self, **kwargs):
        return project_tool.create_project(self.target, template=self.template, **kwargs)

    def test_demo_is_authored_and_exactly_eighteen_seconds(self):
        self.create()
        config = read_json(self.target / "project.json")
        self.assertEqual((config["durationInFrames"], config["fps"]), (540, 30))
        self.assertEqual(config["mode"], "demo")
        self.assertTrue(config["authored"])
        self.assertIsNone(config["audio"])
        self.assertEqual((self.target / "src" / "Film.tsx").read_text(), "// authored demo\n")

    def test_demo_changes_aspect_and_fps_without_changing_timeline_seconds(self):
        self.create(aspect="16:9", fps=24)
        config = read_json(self.target / "project.json")
        shots = read_json(self.target / "shots.json")["shots"]
        self.assertEqual((config["width"], config["height"]), (1920, 1080))
        self.assertEqual(config["durationInFrames"], 432)
        self.assertEqual([(s["startFrame"], s["endFrameExclusive"]) for s in shots], [(0, 168), (168, 432)])

    def test_cli_reports_requested_frame_rate_and_actual_demo_frames(self):
        output = io.StringIO()
        with mock.patch.object(project_tool, "TEMPLATE", self.template), redirect_stdout(output):
            status = project_tool.main([str(self.target), "--fps", "24"])
        self.assertEqual(status, 0)
        self.assertIn("432 frames at 24 fps", output.getvalue())
        self.assertEqual(read_json(self.target / "project.json")["durationInFrames"], 432)

    def test_distribution_targets_are_rejected_but_repository_projects_are_allowed(self):
        repository = self.root / "repository"
        skill = repository / "skills" / "cinematic-explainer"
        skill.mkdir(parents=True)
        with mock.patch.object(project_tool, "SKILL_ROOT", skill):
            forbidden = skill / "client-project"
            with self.assertRaisesRegex(project_tool.WorkflowError, "outside the installed skill"):
                project_tool.create_project(forbidden, template=self.template)
            self.assertFalse(forbidden.exists())
            allowed = repository / "client-project"
            project_tool.create_project(allowed, template=self.template)
            self.assertTrue((allowed / "project.json").is_file())

    def test_symlink_into_distribution_cannot_bypass_destination_guard(self):
        skill = self.root / "installed-skill"
        skill.mkdir()
        alias = self.root / "alias"
        try:
            alias.symlink_to(skill, target_is_directory=True)
        except (OSError, NotImplementedError):
            self.skipTest("This platform does not permit directory symlinks.")
        with mock.patch.object(project_tool, "SKILL_ROOT", skill):
            with self.assertRaisesRegex(project_tool.WorkflowError, "outside the installed skill"):
                project_tool.create_project(alias / "client-project", template=self.template)
        self.assertFalse((skill / "client-project").exists())

    def test_existing_directory_and_files_are_never_overwritten(self):
        self.target.mkdir()
        marker = self.target / "important.txt"
        marker.write_text("keep me", encoding="utf-8")
        with self.assertRaisesRegex(project_tool.WorkflowError, "Refusing to overwrite"):
            self.create()
        self.assertEqual(marker.read_text(), "keep me")
        marker.unlink()
        self.target.rmdir()
        self.target.write_text("existing file", encoding="utf-8")
        with self.assertRaisesRegex(project_tool.WorkflowError, "Refusing to overwrite"):
            self.create()
        self.assertEqual(self.target.read_text(), "existing file")

    def test_audio_creates_full_length_unauthored_production_and_private_context(self):
        audio = self.root / "voice with spaces.MP3"
        audio.write_bytes(b"audio source bytes")
        context = self.root / "context.md"
        context.write_text("# User research\n", encoding="utf-8")
        with mock.patch.object(project_tool, "probe_audio_duration", return_value=Decimal("148.21875")):
            self.create(audio=audio, context=context, title="Topic film", aspect="1:1")
        config = read_json(self.target / "project.json")
        self.assertEqual(config["durationInFrames"], 4483)
        self.assertEqual(config["audioDuration"], 148.21875)
        self.assertEqual(config["endHold"], 1.2)
        self.assertEqual(config["audio"], "audio/narration.mp3")
        self.assertEqual(config["title"], "Topic film")
        self.assertEqual((config["width"], config["height"]), (1080, 1080))
        self.assertFalse(config["authored"])
        self.assertEqual(config["mode"], "production")
        self.assertEqual(read_json(self.target / "shots.json")["shots"], [{
            "id": "unplanned", "startFrame": 0, "endFrameExclusive": 4483,
            "action": "Author a topic-specific sequence",
        }])
        self.assertEqual(read_json(self.target / "captions.json"), {"captions": []})
        self.assertEqual((self.target / "public" / "audio" / "narration.mp3").read_bytes(), audio.read_bytes())
        self.assertEqual((self.target / "media" / "context.md").read_bytes(), context.read_bytes())
        self.assertFalse((self.target / "public" / "context.md").exists())
        self.assertFalse((self.template / "media").exists())

    def test_invalid_audio_leaves_no_partial_project(self):
        audio = self.root / "invalid.wav"
        audio.write_bytes(b"not audio")
        with mock.patch.object(project_tool, "probe_audio_duration", side_effect=project_tool.WorkflowError("no audio")):
            with self.assertRaisesRegex(project_tool.WorkflowError, "no audio"):
                self.create(audio=audio)
        self.assertFalse(self.target.exists())
        self.assertFalse(list(self.root.glob(".new project-*")))

    def test_copy_failure_cleans_staging_and_preserves_source(self):
        with mock.patch.object(project_tool.shutil, "copytree", side_effect=OSError("disk full")):
            with self.assertRaisesRegex(OSError, "disk full"):
                self.create()
        self.assertFalse(self.target.exists())
        self.assertFalse(list(self.root.glob(".new project-*")))
        self.assertTrue((self.template / "src" / "Film.tsx").is_file())

    def test_partial_publication_failure_removes_only_the_new_project(self):
        rename = Path.rename
        moved = []

        def fail_after_first_entry(path, target):
            if moved:
                raise OSError("publication interrupted")
            result = rename(path, target)
            moved.append(result)
            return result

        with mock.patch.object(Path, "rename", fail_after_first_entry):
            with self.assertRaisesRegex(OSError, "publication interrupted"):
                self.create()
        self.assertEqual(len(moved), 1)
        self.assertFalse(self.target.exists())
        self.assertFalse(list(self.root.glob(".new project-*")))
        self.assertTrue((self.template / "src" / "Film.tsx").is_file())

    def test_target_created_during_staging_is_preserved(self):
        copytree = project_tool.shutil.copytree

        def competing_creator(source, destination, *args, **kwargs):
            result = copytree(source, destination, *args, **kwargs)
            if Path(source).resolve() == self.template.resolve():
                self.target.mkdir()
                (self.target / "keep.txt").write_text("other process", encoding="utf-8")
            return result

        with mock.patch.object(project_tool.shutil, "copytree", competing_creator):
            with self.assertRaisesRegex(project_tool.WorkflowError, "Refusing to overwrite"):
                self.create()
        self.assertEqual((self.target / "keep.txt").read_text(), "other process")
        self.assertFalse(list(self.root.glob(".new project-*")))

    def test_invalid_hold_and_fps_are_rejected_before_creation(self):
        for hold in ("nan", "inf", "-1", "1e10000"):
            with self.subTest(hold=hold), self.assertRaises(project_tool.WorkflowError):
                self.create(end_hold=hold)
        for fps in (0, -1, True, 29.97):
            with self.subTest(fps=fps), self.assertRaises(project_tool.WorkflowError):
                self.create(fps=fps)
        self.assertFalse(self.target.exists())

    def test_ffprobe_uses_argument_list_and_requires_audio_stream(self):
        media = self.root / "voice $(never-execute).wav"
        media.write_bytes(b"bytes")
        good = subprocess.CompletedProcess([], 0, json.dumps({
            "streams": [{"codec_type": "audio", "duration": "2.125"}], "format": {"duration": "10"},
        }), "")
        with mock.patch.object(project_tool.shutil, "which", return_value="ffprobe"), mock.patch.object(project_tool.subprocess, "run", return_value=good) as run:
            self.assertEqual(project_tool.probe_audio_duration(media), Decimal("10"))
            self.assertIsInstance(run.call_args.args[0], list)
            self.assertEqual(run.call_args.args[0][-1], str(media))
            self.assertNotIn("shell", run.call_args.kwargs)
        for response in ({"streams": [], "format": {"duration": "2"}},
                         {"streams": [{"codec_type": "audio", "duration": "NaN"}]},
                         {"streams": [{"codec_type": "audio", "duration": "0"}]}):
            bad = subprocess.CompletedProcess([], 0, json.dumps(response), "")
            with self.subTest(response=response), mock.patch.object(project_tool.shutil, "which", return_value="ffprobe"), mock.patch.object(project_tool.subprocess, "run", return_value=bad):
                with self.assertRaises(project_tool.WorkflowError):
                    project_tool.probe_audio_duration(media)


class CaptionImportTests(unittest.TestCase):
    def test_whisper_preserves_exact_word_text_and_timestamps(self):
        words = [{"word": " Leading", "start": 0.15, "end": 0.8},
                 {"word": " punctuation!", "start": 0.8, "end": 1.4}]
        result = caption_tool.parse_whisper({"segments": [{"words": words}]})
        self.assertEqual(result, [{"start": 0.15, "end": 1.4, "timingMode": "word", "words": [
            {"text": " Leading", "start": 0.15, "end": 0.8},
            {"text": " punctuation!", "start": 0.8, "end": 1.4},
        ]}])

    def test_top_level_words_are_grouped_without_loss_or_timing_changes(self):
        words = [{"word": str(i), "start": i / 10, "end": (i + 1) / 10} for i in range(10)]
        result = caption_tool.parse_whisper({"words": words})
        self.assertEqual(len(result), 2)
        flattened = [word for cue in result for word in cue["words"]]
        self.assertEqual(flattened, [{"text": w["word"], "start": w["start"], "end": w["end"]} for w in words])

    def test_srt_is_phrase_timing_without_invented_words(self):
        result = caption_tool.parse_srt("\ufeff1\r\n00:00:01,250 --> 00:00:03,750\r\nTwo lines\r\nstay intact.\r\n\r\n2\r\n00:00:03,750 --> 00:00:04,000\r\nNext.\r\n")
        self.assertEqual(result[0], {"start": 1.25, "end": 3.75, "text": "Two lines\nstay intact.", "timingMode": "phrase"})
        self.assertTrue(all("words" not in cue for cue in result))
        self.assertEqual(result[1]["start"], 3.75)

    def test_whisper_segments_without_words_remain_phrases(self):
        result = caption_tool.parse_whisper({"segments": [
            {"start": 1, "end": 3, "text": " Real phrase timing."},
            {"start": 3, "end": 4, "text": "Next", "words": []},
        ]})
        self.assertEqual(result[0], {"start": 1.0, "end": 3.0, "text": " Real phrase timing.", "timingMode": "phrase"})
        self.assertTrue(all("words" not in cue for cue in result))

    def test_untimed_transcript_is_rejected(self):
        with self.assertRaisesRegex(caption_tool.CaptionError, "no usable timing"):
            caption_tool.parse_whisper({"text": "Words without timing"})

    def test_nonfinite_negative_reversed_and_zero_word_times_are_rejected(self):
        for start, end in ((float("nan"), 1), (0, float("inf")), (-1, 1), (1, 1), (2, 1), (False, 1), ("0", 1)):
            with self.subTest(start=start, end=end), self.assertRaises(caption_tool.CaptionError):
                caption_tool.parse_whisper({"words": [{"word": "Bad", "start": start, "end": end}]})

    def test_word_and_caption_overlaps_or_out_of_order_input_are_rejected(self):
        with self.assertRaisesRegex(caption_tool.CaptionError, "overlaps"):
            caption_tool.parse_whisper({"words": [
                {"word": "one", "start": 1, "end": 2}, {"word": "two", "start": 0.5, "end": 1.5},
            ]})
        with self.assertRaisesRegex(caption_tool.CaptionError, "overlaps"):
            caption_tool.parse_whisper({"segments": [
                {"start": 1, "end": 3, "text": "one"}, {"start": 2, "end": 4, "text": "two"},
            ]})
        with self.assertRaisesRegex(caption_tool.CaptionError, "overlaps"):
            caption_tool.parse_srt("1\n00:00:01,000 --> 00:00:03,000\none\n\n2\n00:00:02,000 --> 00:00:04,000\ntwo")

    def test_malformed_srt_is_rejected(self):
        for source in ("1\n00:99:00,000 --> 00:99:01,000\ninvalid", "1\n00:00:02,000 --> 00:00:01,000\nreversed", "1\n00:00:00,000 --> 00:00:01,000\n", "not srt"):
            with self.subTest(source=source), self.assertRaises(caption_tool.CaptionError):
                caption_tool.parse_srt(source)

    def test_import_never_overwrites_inputs_or_existing_outputs(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "captions.srt"
            text = "1\n00:00:00,000 --> 00:00:01,000\nOriginal.\n"
            source.write_text(text, encoding="utf-8")
            with self.assertRaisesRegex(caption_tool.CaptionError, "Refusing to overwrite"):
                caption_tool.import_captions(source, source)
            self.assertEqual(source.read_text(), text)
            output = root / "captions.json"
            caption_tool.import_captions(source, output)
            original = output.read_bytes()
            with self.assertRaisesRegex(caption_tool.CaptionError, "Refusing to overwrite"):
                caption_tool.import_captions(source, output)
            self.assertEqual(output.read_bytes(), original)
            self.assertEqual(read_json(output)["captions"][0]["timingMode"], "phrase")

    def test_bad_input_does_not_create_an_output(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, output = root / "bad.json", root / "captions.json"
            source.write_text('{"words":[{"word":"x","start":NaN,"end":1}]}', encoding="utf-8")
            with self.assertRaises(caption_tool.CaptionError):
                caption_tool.import_captions(source, output)
            self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
