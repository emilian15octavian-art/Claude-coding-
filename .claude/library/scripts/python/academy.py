#!/usr/bin/env python3
"""Download Claude Academy (academy.claude.com) course outlines and public lesson text into staging/ for study notes.

Usage:
  python3 academy.py catalog                    # print every course: slug, lessons, quizzes, time, badge
  python3 academy.py fetch <slug> [<slug> ...]  # save lesson text (summary + transcript) to $BRAIN/staging/academy/<slug>/
  python3 academy.py fetch --all                # every course (slow; be polite)

Skips quiz, badge and completion pages on purpose: graded work is the owner's.
Output stays in staging/ (git-ignored): it's Anthropic's content, so distil your own notes
into library/courses/ and link back instead of committing lesson text to a public repo.
"""
import html
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

BASE = "https://academy.claude.com"
SKIP = ("quiz", "assessment", "exam", "test-your", "badge", "complete")  # substring match: graded pages stay untouched
UA = "Mozilla/5.0 (study-notes script)"
FOOTER = ("Learn about AI", "Previous lesson", "Next lesson")


def get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")


def text_lines(page: str) -> list:
    page = re.sub(r"<(script|style)\b.*?</\1>", "", page, flags=re.S)
    page = re.sub(r"<br\s*/?>|</(p|li|h[1-6]|div)>", "\n", page)
    txt = html.unescape(re.sub(r"<[^>]+>", "\n", page))
    return [l.strip() for l in txt.splitlines() if l.strip() and l.strip() not in ("·", "Loading")]


def catalog() -> list:
    page = get(f"{BASE}/courses")
    slugs = list(dict.fromkeys(re.findall(r'href="/courses/([a-z0-9\-]+)"', page)))
    lines = text_lines(page)
    out = []
    for slug in slugs:
        cpage = get(f"{BASE}/courses/{slug}")
        cl = text_lines(cpage)
        title = re.search(r"<title>(.*?)\s*·", cpage)
        meta = " ".join(cl[:40])
        lessons = re.search(r"(\d+) lessons?", meta)
        quiz = re.search(r"(\d+) quiz(?:zes)?", meta)
        dur = re.search(r"(\d+(?:\.\d+)? hr|\d+ min)", meta)
        out.append({
            "slug": slug,
            "title": html.unescape(title.group(1)) if title else slug,
            "lessons": int(lessons.group(1)) if lessons else 0,
            "quizzes": int(quiz.group(1)) if quiz else 0,
            "time": dur.group(1) if dur else "",
            "badge": "No completion badge" not in meta and "Completion badge" in meta,
        })
        time.sleep(0.5)
    return out


def lesson_links(slug: str) -> list:
    page = get(f"{BASE}/courses/{slug}")
    links = list(dict.fromkeys(re.findall(rf'href="/courses/{slug}/([a-z0-9\-]+)"', page)))
    return [l for l in links if not any(k in l for k in SKIP)]


def lesson_text(slug: str, lesson: str) -> str:
    lines = text_lines(get(f"{BASE}/courses/{slug}/{lesson}"))
    start = next((i for i, l in enumerate(lines) if re.match(r"Lesson \d+ of \d+", l)), 0)
    end = next((i for i, l in enumerate(lines[start:], start) if l in FOOTER), len(lines))
    return "\n".join(lines[start:end])


def find_brain() -> Path:
    if os.environ.get("CLAUDE_BRAIN"):
        return Path(os.environ["CLAUDE_BRAIN"]).expanduser()
    for base in (os.environ.get("CLAUDE_PROJECT_DIR"), os.getcwd(), str(Path(__file__).resolve().parents[4])):
        if base and (Path(base) / ".claude" / "skills" / "autonomous-core").is_dir():
            return Path(base) / ".claude"
    return Path.home() / ".claude"


def fetch(slug: str, outroot: Path) -> int:
    outdir = outroot / slug
    outdir.mkdir(parents=True, exist_ok=True)
    links = lesson_links(slug)
    for n, lesson in enumerate(links, 1):
        dest = outdir / f"{n:02d}-{lesson}.md"
        if dest.exists() and dest.stat().st_size > 200:
            continue
        body = lesson_text(slug, lesson)
        dest.write_text(f"<!-- source: {BASE}/courses/{slug}/{lesson} -->\n{body}\n", encoding="utf-8")
        time.sleep(0.5)
    print(f"{slug}: {len(links)} lessons -> {outdir}", file=sys.stderr)
    return len(links)


def main(argv: list) -> int:
    if not argv or argv[0] not in ("catalog", "fetch"):
        print(__doc__)
        return 2
    if argv[0] == "catalog":
        print("| Course | Slug | Lessons | Quizzes | Time | Badge |\n| :--- | :--- | ---: | ---: | :--- | :--- |")
        for c in catalog():
            print(f"| {c['title']} | `{c['slug']}` | {c['lessons']} | {c['quizzes']} | {c['time']} | {'yes' if c['badge'] else 'no'} |")
        return 0
    outroot = find_brain() / "staging" / "academy"
    slugs = [c["slug"] for c in catalog()] if argv[1:] == ["--all"] else argv[1:]
    if not slugs:
        print("fetch needs course slugs or --all", file=sys.stderr)
        return 2
    total = sum(fetch(s, outroot) for s in slugs)
    print(f"done: {total} lessons", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
