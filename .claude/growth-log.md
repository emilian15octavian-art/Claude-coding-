# Growth Log

One line per daily run (newest last).

- [2026-11-26] | Fixed: none | Skills Added/Updated: autonomous-growth v2, tool-registry | New Connectors Tested/Installed: none | Efficiency Gain: baseline setup, brain moved into git for PC + phone sync
- [2026-11-26] | Fixed: three overlapping skills | Skills Added/Updated: autonomous-core (merged autonomous-growth v2 + autonomous-librarian), library INDEX | Connectors Tested/Installed/PROPOSED: fetch (official, no credentials, project scope) | Efficiency Gain: one skill loaded instead of three
- [2026-11-26] | Fixed: index hook hang on open stdin | Added: autonomous-core v4 (cloud-first + capability check), update_index.py PostToolUse hook, cloud-nodes.md, .claude/CLAUDE.md, staging/, permissions | Staged/PROPOSED: GitHub Actions runner (needs CLAUDE_CODE_OAUTH_TOKEN secret) | Efficiency Gain: index upkeep now 0 tokens
- [2026-11-26] | Fixed: ingest error paths (yt-dlp/Whisper fail with clear message) | Added: autonomous-core v5 (course ingestion + certificate integrity), ingest.py, Playwright MCP, yt-dlp, python-pptx, pymupdf, faster-whisper, courses/CATALOG.md, cloud audit of 11 free tiers | Staged/PROPOSED: allow youtube + huggingface CDN hosts or use Kaggle/PC for transcription; GitHub Actions runner | Efficiency Gain: slides/PDF to notes in 1 command
