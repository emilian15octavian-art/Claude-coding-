---
name: verify-work
description: Verify finished code changes before reporting them done. Use after any refactor, bug fix, feature or unattended/scheduled run, or when asked "check your work", "is it done", "did the tests pass". Runs the project's test/lint/typecheck gates, reads the diff scope, and flags weakened or skipped tests.
allowed-tools: Bash(bash .claude/skills/verify-work/scripts/check.sh*), Bash(git diff*), Bash(git status*), Read, Grep
---

# Verify work before saying "done"

"Done" means the gates ran and you observed the result, not that the diff looks right.
Source: Claude Academy, *Claude Code in action*: "Verification skills" and "Trust it: verifying unsupervised runs" (https://academy.claude.com/courses/claude-code-in-action).

## Steps
1. **Run the gates (don't read the script, run it):**
   `bash .claude/skills/verify-work/scripts/check.sh [BASE_REF]`
   It detects npm `lint`/`typecheck`/`check`/`test` scripts, pytest (+ ruff when configured), `cargo test`, `go test`; prints the diff stat; and flags test files where assertions were removed or `skip`/`only`/`xfail` was added. Exit 0 = pass.
2. **Read the diff, not your summary:** `git diff --stat` then the hunks. First the files in the plan, then anything outside it. A file you didn't expect to touch is a finding.
3. **If a WARNING about weakened tests appears:** open those hunks. A test loosened to go green is a failure, even when the suite passes.
4. **Scale with supervision:** the less anyone watched the run (scheduled, headless, CI), the more you verify. For anything important, get a cold second opinion: a fresh subagent or `/code-review` with no memory of how the code was built.
5. **Report with evidence:** gates run, PASS/FAIL per gate, files changed, anything unverified ("no gates detected" means say plainly that nothing was verified).

## Make it non-skippable (optional)
Instructions can be skipped; hooks can't. For unattended runs add a `Stop` hook that runs the tests and exits 2 on failure (Claude keeps working and reads stderr), and a `PostToolUse` hook for lint/typecheck. See the `claude-code-automation` skill.
