# Introduction to subagents: notes
Source: https://academy.claude.com/courses/introduction-to-subagents · 4 lessons · no quiz/badge · studied 2026-11-26

- Subagent = own context window + custom system prompt + task prompt written by the parent; only a summary returns (full transcript saved separately). Trade-off: the main thread doesn't see how it got there.
- Built-ins: general-purpose, Explore, Plan. Custom: `.claude/agents/<name>.md` (project) or `~/.claude/agents/` (user), frontmatter `name`, `description`, `tools`, `model` (haiku/sonnet/opus/inherit), `color`. Easiest: ask Claude to write it (the `/agents` wizard was removed in v2.1.198).
- **Description does two jobs:** decides when the parent launches it AND shapes the task prompt the parent writes ("tell the agent exactly which files to review", "return citable sources").
- **Define an output format** in the system prompt: the biggest improvement; gives a stopping point and stops runaway runs. Ask it to report obstacles. Limit tools (reviewers don't need edit tools).
- Use when you need the result, not the journey: research, code review with fresh eyes (Claude reviews better when the code reads as someone else's), custom-voice work (copywriting). Avoid when each step depends on the last.
