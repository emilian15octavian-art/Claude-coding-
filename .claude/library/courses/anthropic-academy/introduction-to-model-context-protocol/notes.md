# Introduction to Model Context Protocol: notes
Source: https://academy.claude.com/courses/introduction-to-model-context-protocol · 10 lessons · quiz + 🏅 · studied 2026-11-26

- MCP moves tool definitions/execution out of your app into reusable servers; client ↔ server over a transport.
- Python SDK v1 `FastMCP` (`mcp[cli]<2`; v2 renamed it `MCPServer`). Decorators: `@mcp.tool`, `@mcp.resource` (direct or `{param}` templates, `mime_type`), `@mcp.prompt` (returns messages).
- Tools = model-controlled actions; resources = app-controlled reads (e.g. @-mentions injected into the prompt); prompts = user-triggered tested templates (slash commands).
- Test with the Inspector: `mcp dev server.py` or `npx @modelcontextprotocol/inspector mcp run server.py` → 127.0.0.1:6274.
- Clients: `ClientSession` → `list_tools` / `call_tool` / `read_resource` / `get_prompt`.
- Skill: `mcp-server-python` (template + in-memory test verified with mcp 1.30.0).
