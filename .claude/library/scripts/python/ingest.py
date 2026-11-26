#!/usr/bin/env python3
"""Turn course material (PPTX, PDF, video/audio URL or file) into plain-text markdown for study notes.

Usage:
  python3 ingest.py deck.pptx              # slide titles, body text, tables, speaker notes
  python3 ingest.py handout.pdf            # page text
  python3 ingest.py https://youtu.be/ID    # subtitles via yt-dlp; falls back to Whisper on the audio
  python3 ingest.py lecture.mp3            # Whisper transcript (faster-whisper, CPU int8)
  python3 ingest.py lecture.mp4 --frames   # also save scene-change frames (ffmpeg) for diagrams/code
Options: -o OUT.md (default: stdout), --model small|base|medium (Whisper), --lang en

Only ingest material you're allowed to access. Heavy transcription belongs on a node from
cloud-nodes.md (e.g. Kaggle/Colab GPU); CPU works for short clips.
"""
import argparse
import glob
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

MEDIA = {".mp3", ".mp4", ".m4a", ".wav", ".webm", ".mkv", ".mov", ".ogg", ".flac"}


def pptx_to_md(path: Path) -> str:
    from pptx import Presentation

    prs = Presentation(str(path))
    out = [f"# {path.stem}\n"]
    for i, slide in enumerate(prs.slides, 1):
        title = slide.shapes.title.text.strip() if slide.shapes.title is not None and slide.shapes.title.has_text_frame else ""
        out.append(f"## Slide {i}: {title}".rstrip(": ") + "\n")
        for shape in slide.shapes:
            if shape == slide.shapes.title:
                continue
            if shape.has_text_frame:
                for para in shape.text_frame.paragraphs:
                    text = "".join(r.text for r in para.runs).strip()
                    if text:
                        out.append("  " * para.level + f"- {text}")
            if getattr(shape, "has_table", False) and shape.has_table:
                rows = [[c.text.strip().replace("|", "\\|") for c in r.cells] for r in shape.table.rows]
                if rows:
                    out.append("")
                    out.append("| " + " | ".join(rows[0]) + " |")
                    out.append("|" + " --- |" * len(rows[0]))
                    out += ["| " + " | ".join(r) + " |" for r in rows[1:]]
        if slide.has_notes_slide:
            notes = slide.notes_slide.notes_text_frame.text.strip()
            if notes:
                out.append(f"\n> **Speaker notes:** {notes}")
        out.append("")
    return "\n".join(out)


def pdf_to_md(path: Path) -> str:
    import pymupdf

    out = [f"# {path.stem}\n"]
    with pymupdf.open(str(path)) as doc:
        for i, page in enumerate(doc, 1):
            text = page.get_text().strip()
            if text:
                out.append(f"## Page {i}\n\n{text}\n")
    return "\n".join(out)


def vtt_to_text(vtt: str) -> str:
    lines, last = [], None
    for line in vtt.splitlines():
        line = line.strip()
        if not line or line == "WEBVTT" or "-->" in line or line.isdigit() or line.startswith(("Kind:", "Language:", "NOTE")):
            continue
        line = re.sub(r"<[^>]+>", "", line).strip()
        if line and line != last:  # auto-subs repeat each line as it scrolls
            lines.append(line)
            last = line
    return " ".join(lines)


def transcribe(audio: Path, model: str, lang) -> str:
    from faster_whisper import WhisperModel

    try:
        wm = WhisperModel(model, device="auto", compute_type="int8")
    except Exception as exc:  # model download needs huggingface.co + its CDN/Xet hosts
        sys.exit(f"Whisper model '{model}' could not be loaded ({type(exc).__name__}). If the network blocks "
                 "Hugging Face hosts, transcribe on a node from cloud-nodes.md (Kaggle/Colab) or your PC. "
                 "HF_HUB_DISABLE_XET=1 avoids the Xet host when only huggingface.co is allowed.")
    segments, info = wm.transcribe(str(audio), language=lang, vad_filter=True)
    return " ".join(s.text.strip() for s in segments)


def save_frames(video: Path, outdir: Path) -> int:
    outdir.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(video), "-vf", "select='gt(scene,0.3)'",
                    "-vsync", "vfr", str(outdir / "frame-%04d.png")], check=True)
    return len(list(outdir.glob("frame-*.png")))


def url_to_md(url: str, args, tmp: Path) -> str:
    if not shutil.which("yt-dlp"):
        sys.exit("yt-dlp missing: uv tool install yt-dlp")
    base = ["yt-dlp", "--no-playlist", "-o", str(tmp / "media.%(ext)s")]
    if shutil.which("node"):
        base += ["--js-runtimes", "node"]  # YouTube extraction needs a JS runtime (deno default)
    if os.environ.get("YTDLP_COOKIES_BROWSER"):  # e.g. chrome/firefox on the owner's PC: passes YouTube's bot check
        base += ["--cookies-from-browser", os.environ["YTDLP_COOKIES_BROWSER"]]
    subprocess.run(base + ["--skip-download", "--write-subs", "--write-auto-subs", "--sub-langs", f"{args.lang or 'en'}.*",
                           "--sub-format", "vtt", "--print", "before_dl:%(title)s"], check=False)
    subs = sorted(glob.glob(str(tmp / "media*.vtt")))
    if subs:
        return f"# {url}\n\n_Source: subtitles_\n\n" + vtt_to_text(Path(subs[0]).read_text(errors="replace"))
    print("No subtitles: downloading audio for Whisper", file=sys.stderr)
    if subprocess.run(base + ["-x", "--audio-format", "mp3"]).returncode != 0:
        sys.exit("yt-dlp failed (see its ERROR above). Common causes: network policy blocks the host "
                 "(proxy 403), or YouTube's bot check on cloud IPs: run on your PC with "
                 "YTDLP_COOKIES_BROWSER=chrome, or download the file yourself and pass its path.")
    audio = next(tmp.glob("media.*"))
    return f"# {url}\n\n_Source: Whisper {args.model}_\n\n" + transcribe(audio, args.model, args.lang)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source")
    ap.add_argument("-o", "--out")
    ap.add_argument("--model", default="small")
    ap.add_argument("--lang")
    ap.add_argument("--frames", action="store_true")
    args = ap.parse_args()

    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        src = args.source
        if re.match(r"https?://", src):
            md = url_to_md(src, args, tmp)
        else:
            path = Path(src)
            if not path.is_file():
                sys.exit(f"not found: {src}")
            ext = path.suffix.lower()
            if ext == ".pptx":
                md = pptx_to_md(path)
            elif ext == ".pdf":
                md = pdf_to_md(path)
            elif ext in MEDIA:
                md = f"# {path.stem}\n\n_Source: Whisper {args.model}_\n\n" + transcribe(path, args.model, args.lang)
                if args.frames:
                    n = save_frames(path, Path(args.out or path.stem).with_suffix("").parent / f"{path.stem}-frames")
                    md += f"\n\n_{n} scene-change frames saved next to the output._\n"
            else:
                sys.exit(f"unsupported type: {ext} (pptx, pdf, audio/video, or URL)")
    if args.out:
        Path(args.out).write_text(md, encoding="utf-8")
        print(f"wrote {args.out} ({len(md)} chars)", file=sys.stderr)
    else:
        print(md)
    return 0


if __name__ == "__main__":
    sys.exit(main())
