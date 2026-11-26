"""Minimal FastMCP server template (MCP Python SDK v1): one tool, a direct + a templated resource, one prompt."""
from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.prompts import base
from pydantic import Field

mcp = FastMCP("DocsDemo", log_level="ERROR")
docs = {"plan.md": "Steps for the project.", "spec.txt": "Technical requirements."}

@mcp.tool(name="read_doc", description="Read a document by id and return its text.")
def read_doc(doc_id: str = Field(description="Document id, e.g. plan.md")) -> str:
    if doc_id not in docs:
        raise ValueError(f"Doc {doc_id} not found")
    return docs[doc_id]

@mcp.resource("docs://documents", mime_type="application/json")
def list_docs() -> list[str]:
    return list(docs)

@mcp.resource("docs://documents/{doc_id}", mime_type="text/plain")
def fetch_doc(doc_id: str) -> str:
    return docs[doc_id]

@mcp.prompt(name="summarize", description="Summarize one document in 3 bullets.")
def summarize(doc_id: str = Field(description="Document id")) -> list[base.Message]:
    return [base.UserMessage(f"Summarize <doc>{doc_id}</doc> in 3 bullets. Use read_doc.")]

if __name__ == "__main__":
    mcp.run()  # stdio
