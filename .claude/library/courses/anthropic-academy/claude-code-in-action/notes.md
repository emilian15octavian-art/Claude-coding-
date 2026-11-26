# Claude Code in action: notes
Source: https://academy.claude.com/courses/claude-code-in-action · 9 lessons · quiz + 🏅 · studied 2026-11-26

- **Steer:** plan mode for scope; direct compaction; rewind to course-correct; pick hands-on vs autonomous goal/loop runs.
- **Lean CLAUDE.md:** it's guidance, not enforcement: every line competes for attention. Hard rules → hooks. Four stacked locations: managed policy, user (`~/.claude/CLAUDE.md`), project, local (`CLAUDE.local.md`, git-ignored). `@path` imports organize but **don't reduce** context. Rules must be specific and checkable, name the replacement ("use named exports"), plain wording (no "IMPORTANT/YOU MUST"). Treat mistakes as bug reports against the file.
- **Verification skill first:** run tests → read diff → check no test was weakened → report with evidence. Skill folders can carry `reference.md` and scripts (run, don't read).
- **Permission modes** per job; unattended work in **auto mode** (classifier screens danger, not correctness).
- **Hooks:** event + matcher + command; exit 2 blocks (exit 1 doesn't); JSON `permissionDecision` allow/deny/ask; `updatedInput` replaces the whole input; match `Bash|Monitor`; `SessionStart`+`compact` re-injects context.
- **Automate:** cloud scheduled tasks (prompt + repo + connectors + trigger; ≤ hourly; fresh clone; pushes to `claude/` branch) → headless `claude -p` (`--output-format json --json-schema`, `--resume`, `--bare` for CI with API key) → Agent SDK.
- **GitHub:** managed code review + the GitHub action on PRs.
- **Trust unsupervised runs:** verify in proportion to how little you watched: diff first, tests as a Stop-hook gate, JSON result + exit code for headless, cold second-opinion review.
- **Plugins:** package a trusted setup for the team.
- Skills: `verify-work`, `claude-code-automation`.
