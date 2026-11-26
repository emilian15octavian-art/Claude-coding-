# Introduction to agent skills: notes
Source: https://academy.claude.com/courses/introduction-to-agent-skills · 6 lessons · no quiz/badge · studied 2026-11-26

- Skill = folder + `SKILL.md`; only names/descriptions load at startup; semantic matching on the description.
- Personal `~/.claude/skills` vs project `.claude/skills` (shared via Git). Priority: Enterprise > Personal > Project; plugin skills sit outside.
- Frontmatter all optional; `description` (what + when) matters most; `allowed-tools` pre-approves without restricting; `model`; `disallowed-tools`.
- Progressive disclosure: SKILL.md < 500 lines; `scripts/`, `references/`, `assets/`; scripts execute without loading into context.
- Choosing: CLAUDE.md (always-on) · skills (on-demand knowledge) · subagents (isolated execution) · hooks (event-driven, enforced) · MCP (external tools).
- Troubleshoot: `claude plugin validate .claude/skills` → description trigger phrases → path/filename → distinct descriptions → priority name clash → deps/`chmod +x`/forward slashes; `claude --debug`.
- Subagents don't inherit invoked skills; custom subagents preload via `skills:` and should keep `Skill` in `tools`.
- Skill: `skill-authoring`.
