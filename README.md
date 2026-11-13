# Cinematic Explainer

An installable agent skill for narrated explainers with animated cutaways, diagrams, mechanisms, comparisons, and camera movement. It helps a coding agent turn a voiceover and source notes into a finished video and an editable Remotion project.

![Silent motion demonstration](docs/demo.gif)

[Watch the 18-second silent demo](docs/demo.mp4) · [Read the skill](skills/cinematic-explainer/SKILL.md)

The agent designs scenes for each topic. The included ship, nail, and water artwork demonstrates the approach; other subjects call for their own artwork and motion. The film's main event should change visibly: a mechanism engages, water accumulates, a quantity grows, or an object moves through space.

## Install

### From a local checkout

```sh
python3 scripts/install.py
```

This installs `cinematic-explainer` into `$CODEX_HOME/skills`, or `~/.codex/skills` when that variable is unset. It needs no network access and refuses to overwrite an existing installation. To update while keeping a backup:

```sh
python3 scripts/install.py --replace
```

For another agent's skill directory, pass `--dest` pointing to that directory. The repository uses the portable [Agent Skills format](https://agentskills.io/specification), with additional Codex interface metadata.

### From GitHub, after you publish this repository

Replace `YOUR-USERNAME` with the repository owner:

```sh
npx skills add YOUR-USERNAME/cinematic-explainer-skill --skill cinematic-explainer -a codex -g
```

The [skills CLI](https://github.com/vercel-labs/skills) also supports selecting other compatible coding agents. Alternatively, ask Codex's skill installer to install `skills/cinematic-explainer` from your GitHub repository.

## Use it

Invoke the installed skill in a new turn:

```text
Use $cinematic-explainer to create a 9:16 explainer from my voiceover
and research notes. Give it a cinematic laboratory theme, use real
object motion and cutaways, and deliver the MP4 plus editable source.
```

It also supports redesigning an existing project, adapting the visual theme, and making deliberately silent animations. Your chosen topic, style, aspect ratio, and authorized narration edits take precedence over the starter's defaults.

The skill covers:

- Planning visual events around the actual recording.
- Designing artwork and camera changes that explain the subject.
- Importing word or phrase captions without fabricating timing.
- Keeping related quantities, geometry, and physical states consistent.
- Reviewing encoded motion excerpts, then checking the finished MP4.
- Delivering local assets, timing, source code, and repeatable rendering commands.

## Run the starter yourself

Requirements: Python 3.10+, Node.js 22.20+, FFmpeg/FFprobe on PATH, and Chrome/Chromium. The renderer can use an installed browser or download Remotion's managed browser when needed. Network access is needed for the initial npm install and an uncached managed-browser download. No paid media service or API key is required by the starter.

```sh
python3 skills/cinematic-explainer/scripts/create_project.py ../my-film
cd ../my-film
npm ci
npm run doctor
npm run render
```

This renders the bundled silent demonstration to `out/film.mp4`. It does not generate a new explanation automatically; the agent authors the scenes for your requested subject.

To start from a recording, run this from the repository root:

```sh
python3 skills/cinematic-explainer/scripts/create_project.py ../my-narrated-film \
  --audio ../narration.mp3 --context ../research.md --title "My explanation"
```

The initializer copies the recording, measures its duration, and creates a production scaffold with `authored: false`. Implement the scenes, shot plan, and captions before setting that field to `true`. Partial draft renders remain available while authoring.

The helpers import existing timing; transcription requires an available transcription tool or manually authored cue times. For example:

```sh
python3 skills/cinematic-explainer/scripts/import_captions.py \
  ../alignment.json ../my-narrated-film/captions.imported.json
```

Inspect the imported file, then deliberately replace the scaffold's `captions.json`. The importer refuses to overwrite files. Whisper word timestamps remain word timestamps; SRT and segment timing remain phrase timing.

### Project commands

Run these inside a generated project:

| Command | Result |
|---|---|
| `npm run studio` | Editable Remotion preview |
| `npm run doctor` | Browser, media tools, local media, and configuration checks |
| `npm run check` | Validate scene coverage, audio length, and captions |
| `npm run stills` | Early/middle/late images and an HTML contact sheet |
| `npm run render -- --range 0:120 --scale .5` | Four-second preview at 30 fps; end frame is exclusive |
| `npm run render` | Full MP4 followed by automated media verification |
| `npm run verify -- --file out/film.mp4` | Verify an exported MP4 and decode every frame |

Use `--output out/revision-2.mp4` for a new render, or `--overwrite` intentionally. `--draft` permits a full unfinished preview, named `out/draft.mp4` by default. Use `--browser PATH` or `REMOTION_BROWSER_EXECUTABLE` when automatic browser discovery does not find your installation.

The default artwork is composed for 9:16. `--aspect 16:9` and `--aspect 1:1` change output dimensions; the agent must recompose the SVG stage, camera, labels, and captions for those formats. Merely changing dimensions fits the portrait demo into the new frame.

## Repository contents

```text
skills/cinematic-explainer/
  SKILL.md                    Agent instructions
  agents/openai.yaml          Codex display metadata
  references/                 Direction, narration, and review guidance
  scripts/                    Project setup and caption import
  assets/remotion-template/   Runnable project, vector art, fonts, and tools
scripts/                      Local installation, validation, release packaging
tests/                        Helper and installer behavior tests
docs/                         Original silent demonstration
.github/workflows/            Validation and render smoke test
```

Only original demonstration artwork and licensed fonts are bundled. Supplied client narration, private research, personal paths, credentials, and generated production projects are excluded.

## Validate and package

```sh
python3 -m unittest discover -s tests -v
node --test skills/cinematic-explainer/assets/remotion-template/scripts/project.test.mjs
python3 scripts/check_repository.py
python3 scripts/build_release.py
```

The release builder creates a complete repository ZIP and a standalone skill ZIP in `dist/`, with SHA-256 hashes and ZIP integrity checks. The GitHub Actions workflow runs the tests and a small render after upload; that hosted run is separate from local testing.

See the [local validation report](docs/VALIDATION.md) and [independent gravity example](docs/gravity-demo.mp4).

Automated checks catch missing media, timeline errors, missing narration, wrong dimensions or frame counts, and decoding failures. A human or capable visual agent still needs to assess motion, clarity, factual accuracy, and synchronization. A configuration flag cannot certify creative quality.

## Upload to GitHub

Create an empty repository named `cinematic-explainer-skill`, then upload these extracted files through GitHub or push this folder:

```sh
git init -b main
git add .
git commit -m "Add cinematic explainer skill"
git remote add origin https://github.com/YOUR-USERNAME/cinematic-explainer-skill.git
git push -u origin main
```

Keep the `skills/cinematic-explainer` directory intact so installers can discover it. Update the owner in this README's installation command after publishing. Upload the repository's contents, rather than only the ZIP file, for direct skill installation.

## License

The skill, helper code, and original vector art are [MIT licensed](LICENSE). Bundled fonts retain their included OFL notices; Remotion retains its separate terms. See [third-party notices](THIRD_PARTY_NOTICES.md). Rendering is based on Remotion's [documented renderer API](https://www.remotion.dev/docs/renderer/render-media).
