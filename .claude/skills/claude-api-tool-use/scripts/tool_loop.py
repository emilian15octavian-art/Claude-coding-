"""Claude Messages API tool loop: runs every tool_use block in parallel, returns all results in one message, errors as is_error."""
from concurrent.futures import ThreadPoolExecutor

MODEL = "claude-sonnet-5-5"  # check current model ids in the docs before shipping


def run_tool(call, handlers):
    result = {"type": "tool_result", "tool_use_id": call.id}
    try:
        result["content"] = str(handlers[call.name](**call.input))
    except Exception as exc:  # report, don't crash: other parallel results survive
        result["content"] = f"{call.name} failed: {exc}. Check the input and try again or use another tool."
        result["is_error"] = True
    return result


def run_loop(client, question, tools, handlers, system=None, max_turns=10, model=MODEL):
    """Return (final_text, messages). `client` is anthropic.Anthropic() or any object with .messages.create."""
    messages = [{"role": "user", "content": question}]
    for _ in range(max_turns):
        kwargs = dict(model=model, max_tokens=4096, tools=tools, messages=messages)
        if system:
            kwargs["system"] = system
        resp = client.messages.create(**kwargs)
        if resp.stop_reason != "tool_use":
            return "".join(b.text for b in resp.content if b.type == "text"), messages
        calls = [b for b in resp.content if b.type == "tool_use"]
        with ThreadPoolExecutor() as pool:  # independent, read-only tools only; run writes in order
            results = list(pool.map(lambda c: run_tool(c, handlers), calls))
        messages.append({"role": "assistant", "content": resp.content})
        messages.append({"role": "user", "content": results})  # ALL results in ONE user message
    raise RuntimeError(f"no final answer after {max_turns} turns")
