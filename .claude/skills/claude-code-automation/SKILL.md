---
name: claude-code-automation
description: Automate and enforce Claude Code with hooks, headless mode (claude -p), cloud scheduled tasks and CI. Use when adding a PreToolUse/PostToolUse/Stop hook, blocking a dangerous command, gating a turn on tests, running Claude from a script or cron, getting JSON/structured output, resuming sessions, or setting up nightly runs.
---

# Hooks, headless and scheduled runs

Source: Claude Academy, *Claude Code in action*: "Hooks", "Scheduled tasks and headless", "Trust it" (https://academy.claude.com/courses/claude-code-in-action); hooks reference https://code.claude.com/docs/en/hooks.

## Hooks: rules Claude can't skip
CLAUDE.md is a request; a hook is code at a fixed point in the loop. Three parts in `.claude/settings.json`: **event** → **matcher** → **command** (gets the event as JSON on stdin).
```json
{ "hooks": { "PreToolUse": [ { "matcher": "Bash|Monitor",
  "hooks": [ { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/guard.sh" } ] } ] } }
```
- Match `Bash|Monitor` together: Monitor also runs shell commands. Optional `"if": "Bash(curl *)"` narrows to one command. Check with `/hooks`.
- **Events:** `PreToolUse` (only one that can stop a call) · `PostToolUse` (lint/format after edits) · `Stop` / `SubagentStop` (keep working until a check passes) · `SessionStart` (matcher `startup` or `compact`; stdout goes into context) · `PreCompact`/`PostCompact` · `InstructionsLoaded`.
- **Exit codes:** `0` = OK (JSON on stdout is read) · **`2` = block**: PreToolUse call doesn't run, Stop keeps Claude working; stderr is the reason Claude reads · `1`/other = **not** a block (action proceeds).
- **JSON decisions (PreToolUse, exit 0):** `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Open a PR instead of pushing to main."}}`. `allow` / `deny` / `ask`; `updatedInput` rewrites the call and **replaces the whole input object** (copy unchanged fields).
- A hook that crashes usually doesn't block: test it (e.g. run a command that should trip it) and commit script + settings together. `chmod +x` scripts.
- Re-inject context after compaction: `SessionStart` + matcher `compact` + `git status --short`.
- Unattended gate: `Stop` hook runs tests, exits 2 on failure; `PostToolUse` hook lints/typechecks.

## Headless (`claude -p`)
- `git diff | claude -p "summarize"`: loads the same hooks/skills/MCP/CLAUDE.md as interactive.
- Structured output: `--output-format json --json-schema '<schema>'` → result in `.structured_output` (`jq`).
- Multi-step: save `--output-format json`, then `--resume "$(jq -r .session_id plan.json)"`.
- CI reproducibility: `--bare` skips hooks/skills/plugins/MCP/CLAUDE.md discovery; needs `ANTHROPIC_API_KEY` (no subscription login).
- Verify headless runs by their JSON result and exit code, not prose.

## Cloud scheduled tasks
- Prompt + repo + connectors + trigger (cron, HTTP POST, GitHub event), on Anthropic's infrastructure. Create at claude.ai/code/routines or `/schedule daily audit at 9am`.
- Research preview; at most hourly; each run starts from a fresh clone of the default branch and pushes to a `claude/` branch unless the prompt names one. Protect branches with GitHub rulesets.
- Keep unattended runs in **auto mode**, not bypass: the classifier screens dangerous actions (it does not judge correctness, so still verify).
