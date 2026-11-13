# Editable cinematic explainer

The starter is an 18-second silent motion demonstration. With narration, the initializer creates a full-length, explicitly unfinished production scaffold. Replace `src/Film.tsx` with scenes for your topic and edit the shot/caption data before final export.

```sh
npm ci
npm run doctor
npm run check
npm run studio
npm run render -- --range 0:120 --scale .5
npm run stills
npm run render
```

`--range START:END` uses an exclusive end frame. Production final renders require `authored: true`, complete shot coverage, valid narration, and captions unless deliberately disabled with `captionsRequired: false`. Use `--draft` for an unfinished full preview. Set authored only after implementing the actual scenes. Output files are preserved unless `--overwrite` is supplied.

`npm run render` writes `out/film.mp4` and JSON render/verification reports. `npm run verify -- --file out/film.mp4` checks an existing export. FFmpeg/FFprobe must be available on PATH. Set `REMOTION_BROWSER_EXECUTABLE` or use `--browser PATH` if needed. The renderer otherwise discovers installed Chrome or uses Remotion's managed browser.

## Editable data

- `project.json`: title, width, height, fps, durationInFrames, audio (relative to public/ or null), mode, authored. Optional audioDuration/endHold are seconds.
- `shots.json`: `{ "shots": [{ "id": "opening", "startFrame": 0, "endFrameExclusive": 120, "kind": "custom", "title": "...", "action": "The event this shot visibly performs" }] }`. Cover the entire composition contiguously.
- `captions.json`: `{ "captions": [{ "start": 0, "end": 2, "text": "Phrase caption", "timingMode": "phrase" }] }`. Word captions use a words array of text/start/end values with timingMode word. Times are seconds.

Add narration under `public/audio/`; preserve its full duration and intended pacing. Store private notes outside `public/`. The original recording remains your source of truth. Imported captions need a spelling, timing, and coverage review.

## Reusable artwork

`src/art/waterline.tsx` exports HeroShip, HeroNail, NailVolume, Ocean, CutawayBoat, ForceArrow, WATERLINE colors, and hull-area helpers. Each SVG component is positioned by x/y/scale and receives frame-derived time `t`.

- `HeroShip`: load, cutaway and displaced are 0–1 controls. waterlineY is local hull space: `(worldWaterY - shipY) / scale` when rotation/bob are zero. Excluded-volume hatching is an annotation; label it accordingly. Set bob=0 and wake=false for quantitative comparisons.
- `HeroNail` and `NailVolume` share geometry. Keep the same scale when illustrating unchanged volume.
- `CutawayBoat`: draft sets submerged keel depth in local pixels; pressure/pressureReveal/pressureOpacity control individual force arrows. Distinguish those from the net resultant. The area helpers link qualitative displacement and draft for this particular geometry.
- `Ocean`: use behind the subject and keep the exterior surface aligned with the hull's waterline.
- `ForceArrow`: x/y origin, dx/dy vector, width/color/reveal. Magnitudes must match any labeled quantities.

These assets illustrate one subject. New topics normally need new artwork. `src/components.tsx` contains reusable easing, camera, type, caption, and local-font helpers.

The authored SVG stage is1080×1920. A different output aspect ratio requires layout and camera changes; the demo intentionally fits rather than crops when dimensions change.

Three fonts are included with their OFL notices. Code and original artwork follow the skill's MIT license; installed npm dependencies retain their own license terms.
