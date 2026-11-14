# Open-source tools: the rule and the register

**The rule:** every content tool for Bleeding Debts 316 (visuals, video, captions, writing helpers, scheduling)
starts from open-source code. Paid apps are not copied or cracked, and "clones" that only wrap a paid API
do not count. Before a tool is added, its licence is checked and written down here.

Licences that are fine to use: MIT, Apache-2.0, BSD, ISC, MPL-2.0, OFL (fonts), and LGPL/GPL tools that are
only *run* as a separate program (like ffmpeg). AGPL tools are fine to self-host unchanged. Anything marked
"non-commercial" or "research only" is not used for posts that promote the band.

## In use

| Job | Tool | Licence | Where |
|---|---|---|---|
| Feed posts, stories and Reel frames (instead of Canva) | satori | MPL-2.0 | `scripts/hive/make-media.mjs`, `scripts/tools/make-covers.mjs` |
| SVG to PNG | @resvg/resvg-js | MPL-2.0 | same |
| Image resize and export | sharp | Apache-2.0 | same |
| Turning frames into video (instead of CapCut) | ffmpeg (run as a program, not bundled) | LGPL/GPL | `scripts/hive/make-media.mjs` |
| Scheduling and publishing posts (instead of PostZen or Buffer) | our own `scripts/hive/publish.mjs` on GitHub Actions, calling Meta's official Graph API | this repository's code | `.github/workflows/hive-publish.yml` |
| Fonts | Nunito, Noto Sans via Fontsource | OFL-1.1 | everywhere |
| Screenshots and browser checks | Playwright | Apache-2.0 | `scripts/checks/`, `scripts/tools/` |
| The site itself | Astro | MIT | everything |

## Candidates (not installed; check the licence again before adding)

| Job | Paid app it replaces | Open-source option | Note |
|---|---|---|---|
| Animated graphics in code | After Effects | Motion Canvas (MIT) | Runs on a normal computer or in GitHub Actions |
| Subtitles from audio | Submagic, CapCut captions | whisper.cpp (MIT) | Runs on a normal computer; needs a model download |
| Scheduling with a dashboard | PostZen, Buffer | Postiz (AGPL-3.0) | Needs its own server. Its code was not copied into the hive's scheduler: AGPL code would put the whole repository under AGPL |
| AI video | Higgsfield, Runway | Wan 2.1 (Apache-2.0) through ComfyUI (GPL-3.0) | Needs a graphics card with a lot of memory; cannot run in GitHub Actions |
| AI video, other models | same | LTX-Video, HunyuanVideo, CogVideoX | Each has its own licence: read it before any commercial use |

Remotion is deliberately not on the list: its code is public, but its licence is not open source.
