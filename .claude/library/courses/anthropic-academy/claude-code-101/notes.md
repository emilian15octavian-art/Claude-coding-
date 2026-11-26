# Claude Code 101: notes
Source: https://academy.claude.com/courses/claude-code-101 · 12 lessons · quiz + 🏅 · studied 2026-11-26

- **Agent loop:** gather context → act (tool call) → verify → repeat until the result checks out. You can interrupt or steer at any point.
- **Install:** `curl -fsSL https://claude.ai/install.sh | bash` (Homebrew/winget don't auto-update). Needs Pro/Max/Ultra/Team/Enterprise, Console, or a cloud provider; not the free plan.
- **Permission modes (Shift+Tab):** manual (asks before edits/commands) · accept edits · auto (background safety check) · **plan mode** (reads and researches, no edits).
- **Core workflow: Explore → Plan → Code → Commit.** Course-correct at the plan, before code exists.
- **Context:** `/context` shows usage; `/compact` summarizes (can lose detail); `/clear` wipes.
- **Review twice:** read `/diff` yourself, then `/code-review` from a clean context (needs git).
- **CLAUDE.md:** project onboarding file, read every session (falls back to AGENTS.md if no CLAUDE.md).
- **Subagents** (`.claude/agents/`), **skills** (`.claude/skills/`), **MCP** (`claude mcp add`, HTTP for remote, stdio for local, `/mcp` to manage), **hooks** (deterministic: format after edits, block dangerous ops, notify on Stop).
- Skills in the brain: `verify-work`, `claude-code-automation`, `skill-authoring`.
