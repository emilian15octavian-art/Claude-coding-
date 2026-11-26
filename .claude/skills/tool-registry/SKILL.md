---
name: tool-registry
description: Registry of vetted, smoke-tested tools, MCP connectors and skills installed by autonomous-core. Check here before searching for or installing a new tool.
---

# Tool Registry

| Date | Name | Type | Source / License | Usage command | Notes |
|------|------|------|------------------|---------------|-------|
| 2026-11-26 | fetch | MCP (Tier 1, no credentials) | https://github.com/modelcontextprotocol/servers/tree/main/src/fetch (MIT) | `claude mcp add --scope project fetch -- uvx mcp-server-fetch` | Smoke-tested: `uvx mcp-server-fetch --help` OK. Project scope in `.mcp.json`. |
