# Validation evidence

The release was checked locally on macOS arm64 with Node 26 and Python 3.12.

- Official skill-creator validation passed for SKILL.md metadata and structure.
- 25 Python behavior tests passed: installation with backup, no overwrite, project creation, narration duration, destination containment, rollback, caption formats and timestamp preservation.
- 5 Node tests passed: exact scene coverage, incomplete-production guard, caption timing, exclusive preview ranges, and media path containment.
- A clean `npm ci` installation produced the bundled 18-second demo at 1080×1920, 30 fps, 540 frames. Automatic media probing and full FFmpeg decoding passed.
- The still-image command produced early/middle/late views for all four demo shots and an HTML review sheet.
- A production fixture initialized from a 0.9-second tone plus 0.1-second hold rendered 30 frames at 30 fps with a valid audio stream. The fixture tested media transport and timing; it was not speech transcription.
- An independent agent used the skill to create a different subject: an 8-second silent gravity explainer. Its 240-frame 1080×1920 export passed probing and full decoding. [View the result](gravity-demo.mp4).
- Repository validation checked required files, Markdown links, JSON, personal path/credential patterns, unintended private media, and oversized assets.
- Both release ZIPs receive CRC validation and SHA- 256 manifests during packaging.

Visual review used rendered stills and decoded temporal sequences. Continuous normal-speed playback was not reviewed in this environment. Automated checks do not establish subjective pacing or universal scientific correctness.

The included GitHub Actions workflow has not yet run on GitHub; it will execute when this repository is uploaded. The installation and rendering tests above were run locally.
