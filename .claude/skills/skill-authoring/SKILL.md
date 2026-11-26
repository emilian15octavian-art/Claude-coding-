---
name: skill-authoring
description: Create, configure, validate, share and troubleshoot Claude Code skills (SKILL.md). Use when writing a new skill, a skill doesn't trigger or load, the wrong skill fires, choosing between skill/CLAUDE.md/hook/subagent/MCP, or packaging repeated instructions ("I keep telling Claude the same thing").
allowed-tools: Bash(claude plugin validate*), Read, Glob, Grep
---

# Authoring Claude Code skills

Source: Claude Academy, *Introduction to agent skills* (https://academy.claude.com/courses/introduction-to-agent-skills) + skills docs (https://code.claude.com/docs/en/skills).

## Pick the right surface first
| Need | Use |
| --- | --- |
| Always-on conventions (naming, where files go) | `CLAUDE.md` (keep it lean; it's guidance, not enforcement) |
| Task-specific procedure or reference, loaded on demand | **Skill** |
| Rule that must never be skipped | **Hook** (code; can block with exit 2) |
| Delegated work in an isolated context | Subagent (`.claude/agents/*.md`) |
| External tools/data | MCP server |
Rule of thumb: typed the same multi-step instruction twice → write a skill.

## Create
1. Folder per skill: `.claude/skills/<name>/SKILL.md` (project, shared via Git) or `~/.claude/skills/<name>/SKILL.md` (personal). File name exactly `SKILL.md`, inside a named directory, never at the skills root.
2. Frontmatter (all optional in Claude Code; `description` recommended):
   ```yaml
   ---
   name: pr-description            # defaults to dir name; API/claude.ai: lowercase-hyphen, ≤64 chars
   description: Writes PR descriptions from the branch diff. Use when opening a PR or asked to "write the PR text".
   allowed-tools: Read, Grep, Bash(git diff *)   # pre-approves (doesn't restrict) while active
   model: sonnet                    # optional
   ---
   ```
   - **Description = what it does + when to use it**, with the trigger phrases people actually type. API/claude.ai cap: 1,024 chars.
   - `allowed-tools`: bare `Bash` pre-approves all shell commands; narrow it (`Bash(git status *)`). `disallowed-tools` removes tools while active.
3. **Progressive disclosure:** SKILL.md under 500 lines (this brain's rule: under 250). Put depth in `references/`, tools in `scripts/`, templates in `assets/`, and say when to load each. Tell Claude to **run** scripts, not read them: only output costs tokens.

## Validate & test
- `claude plugin validate .claude/skills` (or `~/.claude/skills`; needs Claude Code ≥ 2.1.233). Fix parse errors first.
- Ask "what skills are available?" and try 3 phrasings of a request that should trigger it.
- `claude --debug` shows loading errors; grep for the skill name.

## Troubleshoot
- **Doesn't trigger:** description lacks overlap with the request: add trigger phrases.
- **Doesn't load:** path/file name/YAML.
- **Wrong skill fires:** descriptions too similar: make them distinct.
- **Ignored:** a higher-priority skill has the same name (Enterprise > Personal > Project; plugin skills sit outside that order): rename.
- **Runtime errors:** missing deps (note them in the description), `chmod +x` scripts, forward slashes in paths.

## Share
- Project: commit `.claude/skills/`, everyone gets it on pull.
- Plugin: `skills/` at the plugin root (not inside `.claude-plugin/`), distribute via a marketplace; `/reload-plugins` after installing.
- Enterprise: managed settings dir, highest priority.
- Subagents don't inherit invoked skills. Custom subagents preload skills via a `skills:` frontmatter field; keep `Skill` in their `tools` list so they can invoke others.
