# Narration and timing

Use this reference when a recording determines the video or when timing changes during revision.

## Establish the source of truth

Probe the supplied audio for duration, channels, sample rate, and usable playback. Listen where possible. Preserve the original recording; work from a project copy or a clearly documented asset reference. A written script provides meaning and spelling, while the actual recording determines spoken order, pauses, and duration.

If no narration exists, author or obtain it through the workflow the user requested. Do not silently invent a voice provider, paid service, or audio tool. A deliberately silent film can still use the same event-based planning without pretending it has narration timing.

Keep the complete intended recording in the composition. Add an end hold when appropriate, but do not cut the final word to meet a nominal duration. Trimming, rewriting, accelerating, or removing narration changes the content and should follow the user's scope.

## Import timing without overclaiming precision

Use `scripts/import_captions.py --help` from the installed skill directory to inspect supported inputs and destination options. The CLI is `import_captions.py INPUT NEW_OUTPUT [--format auto|whisper|srt]`. It refuses existing output files: import into a new file such as `captions.imported.json`, inspect it, and then deliberately replace `captions.json`. The helper imports supported Whisper JSON or SRT; it does not transcribe audio or force-align text by itself.

- Word timestamps can support word highlighting after a synchronization check.
- Segment timestamps support phrase captions. They do not prove each word's timing.
- SRT supplies caption intervals, usually without word alignment. Preserve that precision rather than distributing words evenly and presenting the result as measured synchronization.
- If a transcription tool is available, check names, numbers, technical terms, and omissions against the recording and supplied context.
- Without trustworthy alignment, prefer short phrase captions or author timing manually around audible cues.

If a script and recording disagree, use the spoken text for captions and flag a factual or meaning-changing discrepancy when it affects the task. Do not make the captions claim a fact the speaker did not say.

## Keep three timelines distinct

1. **Audio timeline:** the unchanged recording and any intentional pauses or end hold.
2. **Caption timeline:** readable units of speech, with reliable timestamps.
3. **Visual timeline:** events and shots that explain ideas, often spanning multiple caption segments.

Do not create one static scene per subtitle. A single idea may need an overview, action insert, and result; a single evolving scene may cover several spoken phrases. Use narration cues to initiate the physical event, not merely to reveal a title.

Store timing in editable data rather than scattering unexplained frame numbers through components. Pick one explicit conversion from seconds to composition frames and use it consistently. At shot boundaries, avoid overlapping or missing frames unless the transition deliberately requires them. Recheck the final timestamp against the composition duration.

After audio replacement, re-evaluate duration, caption timing, visual cues, and the final hold. A file with the same name or broadly similar script is not evidence that the old timing remains valid.

### Starter data contract

Read the generated files before editing them; the runtime is the authority if its schema changes.

- `project.json` stores `title`, `width`, `height`, `fps`, `durationInFrames`, `audio` (a path relative to `public`, or `null`), `mode` (`demo` or `production`), and `authored`. Audio projects may also contain `audioDuration` and `endHold` in seconds.
- `shots.json` contains `shots` with `id`, `startFrame`, `endFrameExclusive`, and `action`; `kind` and `title` are optional. The shot schedule must be contiguous. An exclusive end belongs to the next shot rather than both shots.
- `captions.json` contains `captions` with `start` and `end` in seconds, optional `text`, optional `words` (`text`, `start`, `end`), and optional `timingMode` (`word` or `phrase`). Keep the timing mode faithful to the input precision.

The data describes the plan and schedule; changing a shot's `action` text does not implement its animation. Author the scene components as well. Use the project's validation to check coverage and agreement with the audio, and inspect the generated caption output rather than assuming an import was lossless.

## Caption composition

Use short phrases that can be read at the pace of speech. Prefer one or two lines with stable placement and enough separation from the active subject. Preserve punctuation and meaningful units rather than breaking solely at a fixed character count.

Choose contrast against the actual changing image. A subtle backing can help when the scene is busy; a large opaque caption card may unnecessarily consume the frame. Keep platform interface zones in mind for the requested destination, and avoid covering the action with both subtitles and repeated explanatory copy.

Word highlighting is optional. Use it when reliable timing and the tone support it; it is not a substitute for clean caption phrasing. Avoid flashing every short word so quickly that the highlight becomes a distraction.

## Audio integration

Keep narration clear at normal listening volume. Check for clipping, missing channels, unexpected leading silence, and an abrupt ending. If adding effects or music, audition them under the actual voice rather than judging isolated tracks. Effects should mark meaningful actions, not every caption change.

Do not normalize, denoise, or time-stretch a usable supplied voice merely because a pipeline can. Apply processing only for an observed problem or requested result, and keep the original available.

## Before rendering

Review the beginning, a middle cue, the last spoken sentence, and any revised section against the audio. Confirm that the caption and visual schedules span the full intended recording. Set `project.json`'s `authored` field to `true` only after implementing the film's actual scenes; the existence of imported captions does not mean scene authoring or review is complete.
