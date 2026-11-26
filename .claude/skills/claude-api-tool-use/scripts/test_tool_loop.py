"""Offline test of tool_loop.run_loop with a fake client (no API key, no network)."""
from types import SimpleNamespace as NS
from tool_loop import run_loop

def block(**kw): return NS(**kw)

class FakeClient:
    def __init__(self): self.calls = []; self.messages = self
    def create(self, **kw):
        self.calls.append(kw)
        if len(self.calls) == 1:  # Claude asks for two tools in parallel, one will fail
            return NS(stop_reason="tool_use", content=[
                block(type="tool_use", id="t1", name="weather", input={"site": "Riverside"}),
                block(type="tool_use", id="t2", name="permit", input={"permit_id": "BAD"})])
        last = kw["messages"][-1]["content"]
        assert {r["tool_use_id"] for r in last} == {"t1", "t2"}, "every tool_use needs a result"
        assert any(r.get("is_error") for r in last), "failed tool must come back as is_error"
        return NS(stop_reason="end_turn", content=[block(type="text", text="Site ready except permit.")])

def weather(site): return f"{site}: dry"
def permit(permit_id): raise KeyError(permit_id)

client = FakeClient()
text, msgs = run_loop(client, "Is the site ready?", tools=[], handlers={"weather": weather, "permit": permit})
assert text == "Site ready except permit." and len(client.calls) == 2
assert len(msgs) == 3 and msgs[2]["role"] == "user" and len(msgs[2]["content"]) == 2
print("tool loop test: parallel calls, single results message, is_error path OK")
