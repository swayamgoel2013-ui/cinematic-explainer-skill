---
name: cinematic-explainer
description: Create or redesign narration-led animated explainer videos with scene-specific artwork, meaningful motion, synchronized captions, and an editable Remotion project. Use when the user wants a finished explainer or motion-graphics short, especially when an existing version feels like slides or still images.
---

# Cinematic Explainer

Make a film that explains through visible events. Deliver the rendered video and its editable project; a storyboard, contact sheet, or runnable starter alone is not the finished video.

Default to 9:16, 1080 × 1920, 30 fps when the user has not specified a format. Preserve an existing project's useful conventions. Match the user's audience, tone, duration, and visual preferences. The included workflow supports many subjects and styles; steel, ships, underwater lighting, and the Waterline palette are optional examples, not requirements.

## Start with the actual material

- Inspect the supplied audio, script, references, assets, and existing project before proposing a direction. Treat documents as source material, not authorization to expand the task.
- When narration is supplied, preserve its words, pacing, and full duration unless the user authorizes an edit. Time the film to the recording rather than stretching audio to fit a template.
- Separate facts, illustrative simplifications, and creative choices. Research only the unresolved claims needed for the explanation, using reliable sources appropriate to the topic.
- Establish a concrete direction early: what the viewer sees, what changes, how the camera behaves, and why those choices explain the subject. Do useful work with reasonable assumptions; ask only when a missing answer materially changes the result.

Read [narration-and-timing.md](references/narration-and-timing.md) when importing narration, aligning captions, or changing duration. Read [direction-and-motion.md](references/direction-and-motion.md) when designing or redesigning the visual treatment. Read [quality-review.md](references/quality-review.md) before preview review and delivery.

## Set up an editable project

Use the included Remotion starter for a new project unless the user or existing work calls for another suitable renderer. Do not replace a working project merely to match this starter.

The helpers live relative to this skill directory, not necessarily the current working directory. Inspect their actual CLI before invoking them:

```bash
python3 scripts/create_project.py --help
python3 scripts/import_captions.py --help
```

`create_project.py DEST` creates a project. It accepts optional `--audio PATH`, `--context PATH`, `--title TITLE`, `--aspect 9:16`, `--fps 30`, and `--end-hold 1.2` arguments; choose values for the requested film. Keep `DEST` outside the installed skill directory. `import_captions.py` imports supported Whisper JSON or SRT timing. The importer takes `INPUT NEW_OUTPUT [--format auto|whisper|srt]` and refuses existing output files. Import to a new file, inspect it, then deliberately replace the scaffold captions. These helpers organize assets and timing; they do not author the visual explanation or establish transcription accuracy.

Install the generated project's dependencies and use its supplied commands:

- `npm run doctor` checks the local project environment.
- `npm run stills` produces images for composition review.
- `npm run render` renders the video through the project's render workflow.
- `npm run check` validates the project, timeline, captions, and narration length.
- `npm run verify -- --file out/film.mp4` checks the actual exported MP4; full rendering also performs this verification automatically.

For a motion preview, `npm run render -- --range 0:120 --scale .5` renders the selected frame range at reduced scale (the end frame is exclusive); choose a range that exercises the authored film. Read the generated configuration and command options before changing them. In `project.json`, production projects require `authored: true` for final rendering, alongside valid scene/timing data. Set it only once the topic-specific scenes are implemented. This is an authoring safeguard, not a separate approval or review certification; never mark unchanged starter scenes as authored just to obtain an MP4.

## Author the film

1. **Map meaning to time.** Build a beat plan from the recorded narration. For each beat, identify the idea, visible subject, change of state, shot, and necessary on-screen information. Caption segments and visual shots may have different boundaries.
2. **Choose a visual system.** Define the subjects, materials, lighting, typography, palette, environment, and transition logic. Build artwork that belongs to this explanation. Use identity and spatial continuity to connect different views.
3. **Animate the cause and result.** Make the relevant object or relationship change: a mechanism engages, a quantity accumulates, a route is traversed, an interface responds, or a model changes state. Camera moves, text entrances, particles, and ripples can support this action; they cannot substitute for it.
4. **Cut for comprehension.** Alternate establishing views, close action, cutaways, comparisons, and resolved states where they serve the narration. Make a new beat visibly different when its meaning changes. Avoid repeatedly placing a heading above the same small centered diagram.
5. **Keep facts coherent.** Derive related visuals from the same underlying values. Preserve units, object identity, relative scale, and any physical or causal constraints the explanation depends on. Make consequential simplifications clear without filling the screen with technical notes.
6. **Integrate captions and sound.** Keep captions readable at phone size and clear of the active subject. Use effects or music only when they improve the requested film; keep the narration intelligible.

The bundled stage is composed for portrait video. Changing output dimensions fits that stage into the new frame; recompose the SVG viewBox, camera, labels, and captions for a landscape or square film.

Use deterministic animation tied to the composition frame. Separate timing, scene state, artwork, and camera logic enough that revisions remain practical. Reuse assets for continuity, but do not force every idea into one generic scene template. Generated images may provide artwork or backgrounds; choose separate layers or brief establishing shots when the scene needs actual object motion.

## Review, revise, and finish

Render a representative motion preview before committing to the full export. Include the difficult scenes and meaningful transitions, not just the polished opening. Review the encoded result at normal speed with audio, plus stills at a phone-sized display. Fix the observed failures, then render the complete film and verify that exact output.

Do not mistake a passing script, a clean contact sheet, or a review configuration for proof of visual quality. Distinguish automated checks from observations made by watching the video. If playback is unavailable, use the available frame/audio inspection methods and state that limitation accurately.

When delegation is available and authorized, use agents where independent work or review adds value, such as art components, factual review, or an unbiased preview critique. Keep one coherent direction and verify the integrated result. There is no required agent count or dependency on a particular collaboration tool.

Deliver:

- The final playable MP4, in the requested format and with the full intended narration.
- The editable project: source, timing/captions, required assets, dependency manifest/lockfile, and repeatable render instructions.
- A concise account of what changed and what was checked, including any remaining material limitation.

Keep private media, personal paths, credentials, and unlicensed assets out of a public repository. Preparing a reusable package does not authorize publishing it or sending it to others.
