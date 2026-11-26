# MCP: Advanced topics: notes
Source: https://academy.claude.com/courses/model-context-protocol-advanced-topics · 11 lessons · quiz + 🏅 · studied 2026-11-26 (walkthrough lessons are interactive; review them on the site)

- **Sampling:** server asks the client to run an LLM call; the client pays for and controls the model.
- **Logging + progress notifications:** keep users informed during long tool calls.
- **Roots:** client declares which directories the server may access.
- **JSON-RPC message types:** requests/results, notifications (no reply), both directions.
- **stdio:** client spawns the server; client→server via stdin, server→client via stdout; either side can initiate.
- **Streamable HTTP:** `stateless_http` and `json_response` default false; setting them true (needed for load-balanced horizontal scaling / non-streaming) breaks the SSE path that server→client requests and notifications use. Decide per deployment and test that mode.
- Skill: `mcp-server-python`.
