---
name: claude-api-tool-use
description: Implement tool use with the Claude Messages API — tool definitions Claude picks correctly, strict schemas, parallel tool calls, error results, streaming, and cutting cost with programmatic tool calling and prompt caching. Use when writing or debugging an agent/tool loop against the Anthropic API or SDK.
allowed-tools: Read, Bash(python3 *)
---

# Tool use with the Messages API

Source: Claude Academy, *Tool use with the Messages API* (https://academy.claude.com/courses/tool-use-with-the-messages-api); docs https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview. Check current model ids and feature support in the docs before shipping; the `claude-api` skill has the reference.

## Definitions Claude picks correctly
Claude sees only the definition and the results, never your function. When it misuses a tool, fix the definition first.
- `name`, `description` (3–4+ sentences: what it does, **when to use and when not to**, what each param means, **what it doesn't return** and which tool does), `input_schema` (JSON Schema with per-param descriptions, `enum`s, formats like `MEG-YYYY-NNNN`), optional `input_examples` (each must validate, or the API returns 400).
- Merge overlapping thin tools into one with a `fields` parameter instead of making Claude guess.

## Strict schemas
`"strict": true` (top level, beside `name`) + `"additionalProperties": false` on every object → grammar-constrained input that matches the schema (except after a refusal or a cut-off response). Generate the schema from your validator so they can't drift: Pydantic `Model.model_json_schema()` with `model_config = {"extra": "forbid"}`, then `Model.model_validate(call.input)`.

## The loop (tested template: `scripts/tool_loop.py`, test: `python3 scripts/test_tool_loop.py`)
- Collect **every** `tool_use` block (`stop_reason == "tool_use"`), run independent read-only calls in parallel (`ThreadPoolExecutor`), run writes/ordered calls sequentially.
- Return **one `tool_result` per `tool_use_id`, all in one user message**. Splitting results across messages teaches Claude to stop calling in parallel; missing results → API error.
- Failures: catch, return `content` = what went wrong + what to try, `is_error: true`. Don't let one exception lose the other results.
- Append `{"role": "assistant", "content": resp.content}` before the results.

## Cost of tool-heavy agents
Every request resends tools + system + all prior results. Print `resp.usage.input_tokens` per request to see where it grows.
- **Programmatic tool calling:** add the code execution tool, mark callable tools with `allowed_callers: ["code_execution_20260120"]`, pass `container=resp.container.id` back, handle `stop_reason == "pause_turn"`, and describe each tool's **result shape** (the script parses it). Only the script's printout reaches Claude. Limits (Oct 2026): not with `strict: true` tools or `disable_parallel_tool_use`; not on Haiku 4.5.
- **Prompt caching** for the stable prefix (tools + system).
- Server tools (code execution, web search, computer use) and streaming tool calls: see the course lessons and docs before building.
