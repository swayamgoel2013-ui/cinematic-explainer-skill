# Quality review and delivery

Use this reference to decide whether the authored film is ready to render and whether the exported file is ready to deliver. Automated validation checks technical conditions; it does not establish the quality or truthfulness of the explanation.

## Review the actual work

Render representative stills to inspect composition, typography, clipping, and consistency. Sample both the settled frame and the transition where a scene changes. Use current, explicitly selected outputs; a directory glob can accidentally include stale frames from an earlier cut.

Also render a short encoded motion preview. Include several different shot types and the most difficult actions: a cutaway, an accumulating quantity, a physical interaction, a camera change, or a precise comparison. A polished opening alone is a poor test of the rest of the film.

Watch at normal speed with audio. Inspect the same excerpt at a phone-sized display when the deliverable is a short. Scrubbing and contact sheets are useful supplements, but cannot reveal pacing, motion continuity, audio balance, or a subtitle that appears too briefly.

If direct playback cannot be inspected in the available environment, use frame sequences, audio inspection, and technical checks as available. Be specific about that limitation instead of claiming the film was watched.

## Evaluate four things

| Area | Questions that change the edit |
|---|---|
| Explanation | Does the visible event establish the narrated cause and result? Is the viewer shown the decisive relationship? |
| Motion and rhythm | Does the main subject actually change? Are the shots meaningfully different? Are transitions readable and results given time to register? |
| Composition | Is the relevant object large enough? Are labels near their referents? Are there collisions, accidental crops, or idle areas caused by a repeated template? |
| Integrity | Do numbers, geometry, captions, causal order, and source material agree? Are illustrations and simplified conditions represented honestly? |

Perform a useful motion audit: temporarily disregard captions, camera drift, particles, and decorative ripples. State what the central subject does in each beat. If a beat intended to explain a change has no visible change, redesign its staging rather than adding another text entrance.

Check the authored beat plan against the render. A list of thirty shots can still produce ten compositions if branches reuse the same artwork and framing. Count meaningful visible events, not metadata rows or title changes.

When reviewing a redesign, compare a few representative old/new scenes. Verify that the actual problem changed—for example, subject scale, physical action, camera variety, or continuity—rather than only the palette.

## Correct observed failures efficiently

Prioritize problems that undermine comprehension or make the video feel unfinished: wrong state relationships, unreadable values, missing actions, repeated layouts, broken captions, and audio truncation. Then refine materials, secondary movement, and polish.

Make corrections specific: identify the time, visible defect, practical impact, and proposed change. Recheck the affected scene and its neighboring transitions. Do not repeatedly render the whole film for a minor label adjustment unless the change affects the whole composition.

When independent review is requested or otherwise authorized, give the reviewer the actual current artifact and the user's goal. Ask for observed failures rather than reassurance. Integrate feedback under one direction; parallel work still requires an integrated review.

## Authoring guard and review evidence

The generated project uses `project.json` with `mode: "production"` and an `authored` boolean for real audio projects. Final rendering requires `authored: true` and valid scene/timing data. Set the flag only after replacing the starter behavior with the intended topic-specific film. The field records implementation status, not user permission and not proof that the video was reviewed.

Keep review evidence separately in the project notes or delivery account: identify the preview file, sampled times, observations, corrections, and unresolved limitations. Do not add invented review fields to the configuration, claim unseen previews were watched, or alter validation code merely to unblock an export. The authoring guard is not a guarantee of quality and does not require additional user confirmation when the work is already authorized.

## Verify the final MP4

Run the supplied `npm run doctor`, `npm run stills`, `npm run check`, `npm run render`, and `npm run verify -- --file out/film.mp4` commands at the appropriate stages, using the generated project's options. Read what each command actually verifies. If using another renderer, perform equivalent checks.

After the final render, verify that exact file:

- It exists, is nonempty, and can be decoded or played.
- Its dimensions, aspect ratio, frame rate, and duration match the intended output.
- The audio stream is present when expected and contains the complete intended narration.
- The beginning, middle, revised transitions, and ending contain the current artwork and captions.
- There are no unintended blank frames, stale assets, missing glyphs, literal escape sequences, clipped text, or abrupt final audio cutoff.
- Audio/visual synchronization holds at more than one point, including near the end.

Review the complete film when playback is available; targeted checks of a preview do not cover the entire final export. Check any release-critical issue again after a subsequent change. Avoid claiming that a probe or a successful render proves visual review occurred.

## Deliver a usable result

Provide a clear link or supported preview of the final MP4 and identify the editable project location. Include source, timing/captions, required assets, the dependency manifest and lockfile, and enough instructions to reproduce the render. Keep generated caches and bulky intermediate exports separate from the deliverable where practical.

State the actual outcome and meaningful checks concisely. If a technical or review limitation remains, say exactly what it prevents. Do not describe the work as maximally polished or automatically professional because the workflow completed.

For public packaging, remove private narration, research, personal paths, credentials, and assets without redistribution rights. Keep examples generic and appropriately licensed. Publishing, pushing to a remote, or messaging another person requires the applicable user authorization; preparing a package alone does not imply those actions.
