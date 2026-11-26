# Tool use with the Messages API: notes
Source: https://academy.claude.com/courses/tool-use-with-the-messages-api · 9 lessons · quiz + 🏅 · studied 2026-11-26

- Claude sees only definitions and results: fix the definition first. Description: what, when (and when not), params, what it doesn't return. `input_examples` must validate. Merge overlapping tools (demo: 14 → 26 of 30 correct).
- `strict: true` + `additionalProperties: false` = grammar-constrained input; generate the schema from your Pydantic/Zod validator (demo: 79 → 0 rejections in 100).
- Parallel tool calls: handle every `tool_use`, run independent ones concurrently, return all `tool_result`s in **one** user message, failures as `is_error: true` (demo: 19.9 s → 10.8 s).
- Streaming tool calls, code execution, web search, computer use: server-side tools (review lessons 4–7 on the site before using).
- Cost: requests resend everything; measure `usage.input_tokens`; programmatic tool calling (`allowed_callers`, container id, `pause_turn`) keeps raw results out of context; prompt caching for stable prefixes. Demo baseline: 42 requests, 1.12 M input tokens.
- Skill: `claude-api-tool-use` (loop template + offline test).
