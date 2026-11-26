---
name: tool-registry
description: Registry of vetted, smoke-tested tools, MCP connectors and skills installed by autonomous-core. Check here before searching for or installing a new tool.
---

# Tool Registry

| Date | Name | Type | Source / License | Usage command | Notes |
|------|------|------|------------------|---------------|-------|
| 2026-11-26 | fetch | MCP (Tier 1, no credentials) | https://github.com/modelcontextprotocol/servers/tree/main/src/fetch (MIT) | `claude mcp add --scope project fetch -- uvx mcp-server-fetch` | Smoke-tested: `uvx mcp-server-fetch --help` OK. Project scope in `.mcp.json`. |
| 2026-11-26 | playwright | MCP (Tier 1, no credentials) | https://github.com/microsoft/playwright-mcp (Apache-2.0) | `claude mcp add --scope project playwright -- npx -y @playwright/mcp@latest` | Smoke-tested `--help` OK. Uses preinstalled Chromium here; on PC run `npx playwright install chromium` once |
| 2026-11-26 | yt-dlp | CLI (Tier 1) | https://github.com/yt-dlp/yt-dlp (Unlicense) | `uv tool install yt-dlp` | v2026.11.23. YouTube blocked from cloud (proxy 403 + bot check); on PC use `YTDLP_COOKIES_BROWSER=chrome` |
| 2026-11-26 | python-pptx, pymupdf | Python libs (Tier 1) | https://github.com/scanny/python-pptx (MIT) · https://github.com/pymupdf/PyMuPDF (AGPL-3.0) | `uv pip install --system python-pptx pymupdf` | Tested via ingest.py on generated PPTX (bullets, table, notes) + PDF. Use `import pymupdf`, not `fitz` |
| 2026-11-26 | faster-whisper | Python lib (Tier 1) | https://github.com/SYSTRAN/faster-whisper (MIT) | `uv pip install --system faster-whisper` (library, not a `uv tool`) | Installed; model download blocked here (Hugging Face hosts). Transcribe on Kaggle/Colab/PC |
| 2026-11-26 | ingest.py | Script (own) | `.claude/library/scripts/python/ingest.py` | `python3 .claude/library/scripts/python/ingest.py <file\|url> -o notes.md` | PPTX/PDF verified; URL + Whisper paths fail with a clear message when network blocks |
