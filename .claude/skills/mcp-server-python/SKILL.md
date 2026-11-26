---
name: mcp-server-python
description: Build, test and wire an MCP (Model Context Protocol) server in Python with FastMCP — tools, resources, resource templates, prompts, the MCP Inspector, stdio vs Streamable HTTP. Use when creating or debugging an MCP server, exposing an API to Claude as tools, or adding one to Claude Code.
allowed-tools: Read, Bash(python3 *), Bash(uv *)
---

# MCP servers in Python

Source: Claude Academy, *Introduction to MCP* + *MCP: Advanced topics* (https://academy.claude.com/courses/introduction-to-model-context-protocol, https://academy.claude.com/courses/model-context-protocol-advanced-topics); spec https://modelcontextprotocol.io.

## Primitives: who controls what
- **Tools** (model-controlled): actions Claude decides to call. `@mcp.tool(name=..., description=...)`; params via type hints + `pydantic.Field(description=...)` → schema generated for you. Raise exceptions for bad input: they reach the client as `isError`.
- **Resources** (app-controlled): read-only data, like GET. Direct `@mcp.resource("docs://documents", mime_type="application/json")`; templated `"docs://documents/{doc_id}"` (URI params become kwargs). Return Python objects; the SDK serializes.
- **Prompts** (user-controlled): tested templates exposed as slash commands. `@mcp.prompt(...)` returning `list[base.Message]`.
- Advanced: **sampling** (server asks the client's model to generate), **log/progress notifications**, **roots** (client tells server which dirs it may touch).

## Build (copy the tested template)
1. `scripts/server_template.py` = working server (tool + direct/templated resource + prompt). Copy and rename.
2. SDK version: `uv pip install "mcp[cli]<2"`. **v2 renamed `FastMCP` → `MCPServer`**, so `from mcp.server.fastmcp import FastMCP` fails on v2. Check `pip show mcp` and adapt.
3. Test in memory, no subprocess: `python3 scripts/test_server.py` (uses `mcp.shared.memory.create_connected_server_and_client_session`; covers tools, error path, resources, templates, prompts). Point its import at your server.
4. Interactive: `mcp dev server.py` (needs uv; Node ≥ 22.19) or `npx @modelcontextprotocol/inspector mcp run server.py` → http://127.0.0.1:6274: connect, then the Tools/Resources/Prompts tabs.

## Transports
- **stdio**: client launches the server as a subprocess; newline-delimited JSON-RPC on stdin/stdout. Never print to stdout yourself (breaks the protocol); log to stderr. Default for local tools.
- **Streamable HTTP**: remote/shared servers. Both flags default to `false`: `stateless_http=True` (needed for horizontal scaling behind a load balancer) and `json_response=True` (disables streaming of POST responses) break the SSE mechanism that server→client messages (sampling, logging/progress notifications) rely on. Test in the mode you'll deploy.

## Wire into Claude Code
`claude mcp add --scope project <name> -- uv run --with "mcp[cli]<2" python path/to/server.py` → writes `.mcp.json` (synced via Git). Verify with `claude mcp list`; project servers need one-time approval in an interactive `claude` session. Secrets via env vars, never in `.mcp.json`.
