#!/usr/bin/env bash
# Run the project's quality gates and flag weakened tests in the diff. Exit 0 = pass, 1 = fail.
# Usage: check.sh [BASE_REF]   (default: compare working tree + staged changes against HEAD)
set -uo pipefail
BASE="${1:-HEAD}"
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fail=0; ran=0; LOG=$(mktemp)
trap 'rm -f "$LOG"' EXIT
gate() { local name="$1"; shift; ran=$((ran+1)); echo "== gate: $name ($*)"
  if "$@" >"$LOG" 2>&1; then echo "   PASS"; else echo "   FAIL (last lines):"; tail -20 "$LOG" | sed 's/^/   | /'; fail=1; fi; }

# 1. Gates: detect from project files (first match per kind)
if [ -f package.json ]; then
  for s in lint typecheck check test; do
    if node -e "process.exit(require('./package.json').scripts?.['$s']?0:1)" 2>/dev/null; then
      if [ -d node_modules ]; then gate "npm $s" npm run -s "$s"; else echo "== gate: npm $s SKIPPED (no node_modules: run npm ci first)"; fail=1; fi
    fi
  done
fi
pytests=$(find . -path ./node_modules -prune -o -path ./.venv -prune -o \( -name 'test_*.py' -o -name '*_test.py' \) -print 2>/dev/null | head -1)
if [ -n "$pytests" ]; then
  if command -v ruff >/dev/null && { [ -f ruff.toml ] || [ -f .ruff.toml ] || grep -q "^\[tool.ruff" pyproject.toml 2>/dev/null; }; then gate "ruff" ruff check .; fi
  gate "pytest" python3 -m pytest -q
fi
[ -f Cargo.toml ] && gate "cargo test" cargo test --quiet
[ -f go.mod ] && gate "go test" go test ./...
[ "$ran" -eq 0 ] && echo "== no gates detected: add a test/lint script, or tell the user nothing was verified"

# 2. Diff scope
echo "== changed files vs $BASE"
git diff --stat "$BASE" -- . | tail -25

# 3. Weakened-test heuristics on test files only
tests=$(git diff --name-only "$BASE" -- . | grep -Ei '(^|/)(tests?|__tests__|spec)/|[._-](test|spec)\.[a-z]+$' || true)
if [ -n "$tests" ]; then
  hunks=$(git diff "$BASE" -- $tests | grep -vE '^(\+\+\+|---) ')
  A='\b(assert|expect|should|toBe|toEqual|assertEqual)\b'
  removed=$(printf '%s\n' "$hunks" | grep -E '^-' | grep -cE "$A" || true)
  added=$(printf '%s\n' "$hunks" | grep -E '^\+' | grep -cE "$A" || true)
  skips=$(printf '%s\n' "$hunks" | grep -E '^\+' | grep -cE '\.skip\(|\.only\(|xit\(|xdescribe\(|@pytest\.mark\.(skip|xfail)|@unittest\.skip|t\.Skip\(|#\[ignore\]' || true)
  echo "== test files changed: $(echo "$tests" | wc -l) | assertions removed: $removed added: $added | new skip/only: $skips"
  if [ "$skips" -gt 0 ] || [ "$removed" -gt "$added" ]; then echo "   WARNING: tests may have been weakened: read these hunks before reporting success"; fail=1; fi
fi

echo "== RESULT: $([ $fail -eq 0 ] && echo PASS || echo FAIL)"
exit $fail
