#!/usr/bin/env python3
"""Find brain artifacts not yet in the revenue ledger and score their income potential (zero LLM tokens).

Usage:
  python3 revenue_scan.py          # list unledgered artifacts with a score and reason
  python3 revenue_scan.py --add    # also append them to library/revenue/LEDGER.md as status `candidate`

Score (0-10) is a triage hint, not a forecast: reusable by others, tested, self-contained, documented.
Artifacts built from third-party content (course material, other people's code) are marked
`not-sellable` instead of scored: you can sell your own work, not someone else's.
"""
import os
import re
import sys
from datetime import date
from pathlib import Path

ROW = re.compile(r"^\| (?P<artifact>[^|]+?) \| (?P<category>[^|]+?) \| `(?P<path>[^`]+)` \| (?P<purpose>[^|]*?) \| [^|]* \|$")
THIRD_PARTY = ("courses/", "academy", "staging/")
INTERNAL = ("update_index", "tool-registry", "revenue_scan", "growth-log", "INDEX.md", "LEDGER.md")


def find_brain() -> Path:
    if os.environ.get("CLAUDE_BRAIN"):
        return Path(os.environ["CLAUDE_BRAIN"]).expanduser()
    for base in (os.environ.get("CLAUDE_PROJECT_DIR"), os.getcwd(), str(Path(__file__).resolve().parents[4])):
        if base and (Path(base) / ".claude" / "skills" / "autonomous-core").is_dir():
            return Path(base) / ".claude"
    return Path.home() / ".claude"


def index_rows(index: Path) -> list:
    text = index.read_text(encoding="utf-8")
    block = text.split("AUTO-INDEX:START", 1)[-1].split("AUTO-INDEX:END", 1)[0]
    return [m.groupdict() for line in block.splitlines() if (m := ROW.match(line.strip()))]


def ledgered_paths(ledger: Path) -> set:
    if not ledger.exists():
        return set()
    return set(re.findall(r"`([^`]+)`", ledger.read_text(encoding="utf-8")))


def score(row: dict, root: Path) -> tuple:
    path, cat = row["path"], row["category"]
    if any(k in path for k in THIRD_PARTY) or any(k in row["artifact"] for k in ("academy",)):
        return None, "built from third-party content: use internally, don't sell"
    if any(k in path or k in row["artifact"] for k in INTERNAL):
        return None, "internal plumbing"
    if cat == "mcp":
        return None, "third-party MCP server: not yours to sell"
    pts, why = 0, []
    target = root / path
    folder = target.parent if target.name == "SKILL.md" else target
    if cat == "skill":
        pts += 3; why.append("skill (packageable as a zip)")
    elif cat.startswith("script"):
        pts += 2; why.append("standalone script")
    files = [p for p in folder.rglob("*") if p.is_file()] if folder.is_dir() else [target]
    if any(re.search(r"(^test_|_test\.|check\.sh$)", p.name) for p in files):
        pts += 2; why.append("has tests")
    if any(p.parent.name == "scripts" for p in files):
        pts += 1; why.append("ships executable tooling")
    if len(row["purpose"]) > 120:
        pts += 1; why.append("well documented")
    if not re.search(r"\b(brain|\$BRAIN|owner)\b", target.read_text(encoding="utf-8", errors="replace") if target.is_file() else ""):
        pts += 2; why.append("not tied to this setup")
    else:
        why.append("tied to this brain: generalize before selling")
    return min(pts, 10), ", ".join(why)


def main(argv: list) -> int:
    brain = find_brain()
    root = brain.parent if brain.name == ".claude" else brain
    index, ledger = brain / "library" / "INDEX.md", brain / "library" / "revenue" / "LEDGER.md"
    if not index.exists():
        print(f"no index at {index}", file=sys.stderr)
        return 1
    known = ledgered_paths(ledger)
    new = [r for r in index_rows(index) if r["path"] not in known]
    if not new:
        print("ledger is up to date: every indexed artifact has a row")
        return 0
    rows = []
    for r in new:
        pts, why = score(r, root)
        status = "candidate" if pts is not None else "not-sellable"
        rows.append((pts if pts is not None else -1, r, status, why))
    rows.sort(key=lambda x: -x[0])
    for pts, r, status, why in rows:
        print(f"{'--' if pts < 0 else f'{pts:2d}'}  {r['artifact']:<24} {status:<13} {why}")
    if "--add" in argv:
        today = date.today().isoformat()
        with ledger.open("a", encoding="utf-8") as f:
            for pts, r, status, why in rows:
                s = "" if pts < 0 else str(pts)
                f.write(f"| {r['artifact']} | `{r['path']}` | {s} | {status} | {why} | | | {today} |\n")
        print(f"appended {len(rows)} rows to {ledger}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
