"""Drive server.py in memory with the SDK's client session (no subprocess, no network)."""
import anyio
from mcp.shared.memory import create_connected_server_and_client_session as connect
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).parent)); from server_template import mcp

async def main():
    async with connect(mcp._mcp_server) as client:
        tools = await client.list_tools()
        assert [t.name for t in tools.tools] == ["read_doc"], tools
        assert "doc_id" in tools.tools[0].inputSchema["properties"]
        r = await client.call_tool("read_doc", {"doc_id": "plan.md"})
        assert r.content[0].text == "Steps for the project." and not r.isError
        bad = await client.call_tool("read_doc", {"doc_id": "nope"})
        assert bad.isError, bad
        res = await client.read_resource("docs://documents/spec.txt")
        assert res.contents[0].text == "Technical requirements."
        tmpl = await client.list_resource_templates()
        assert tmpl.resourceTemplates[0].uriTemplate == "docs://documents/{doc_id}"
        p = await client.get_prompt("summarize", {"doc_id": "plan.md"})
        assert "plan.md" in p.messages[0].content.text
        print("MCP server test: tools, error path, resources, templates, prompts OK")

anyio.run(main)
