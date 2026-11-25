# Bleeding Debts 316: cold-view strategy (from 26 Nov 2026)

## What the numbers said (Metricool, Instagram Reels, 25 Oct – 24 Nov)

| Group | Views per Reel | Skipped in first 3 s | Avg watch |
|---|---|---|---|
| Reels that got pushed (31 Oct – 4 Nov, mostly the owner's own face videos) | 760 – 2,546 | 26 – 42 % | 5.6 – 9.3 s |
| Last week's generated photo Reels (19 – 24 Nov) | 35 – 190 | 64 – 88 % | 2.5 – 4 s |

The clearest test: **the same hook** ("My dream has a monthly payment") got **1,719 views** on 31 Oct and **76 views** on 20 Nov.
Only the visual changed. Instagram shows every Reel to a small group of strangers first; if they swipe in the first
3 seconds, the Reel stops there. Followers went from 140 to 146 in a week of 3 posts a day.

## Why it bombed
1. **The visual looked like an ad.** One dark, teal-tinted, still photo, a logo, spectrum bars, boxed text. Nothing moved.
2. **The hooks were slogans, not questions.** "Sunday service, but louder." / "Office by day." gives a stranger no reason to stay.
3. **We pitched before we gave anything.** Countdown banner, "link in bio", website in every video.
4. **Same template 3× a day**, and some videos were uploaded more than once on TikTok. Repetition gets less reach.

## The new formula
- **Hook = "Why X happens / didn't happen"** or "N reasons", readable on frame 0, max ~7 words, one red keyword.
- **Teach or provoke, then reveal:** 3 numbered reasons (one line each), a payoff, and a last line that loops into the hook.
- **Topics that work for a cold audience:** musician pain explained (why songs flop, why bands quit), metal myths (screaming,
  "metal makes you angry"), the Christian-metal debate, production tricks shown with our own songs.
- **Visual (engine v3):** black and white, faces, a cut every ~2 s plus one inside the hook, fast pull-out from frame 0,
  shake on hits, no logo/bars/banner, text kept out of the app's button zones. 10–12 s so it loops.
- **Audio:** start on energy, or on a quiet bar that drops within 2.5 s. Normalised loudness.
- **Description:** first line adds to the hook, niche keywords for Instagram search, a one-word-answer question, 3–5 hashtags.
- **Selling stays out of the video.** The site and Linktree go in the caption's last line and in the bio.

## The viral exam (nothing posts without it)
Every post is written with **at least 3 hook versions**. `scripts/hive/cold/viral_exam.py` renders each one and scores it
out of 100: visual 20, audio 20, hook text 20, on-screen captions 20, description 20. **Pass = 80+ and at least 12 in every
area.** The best passing version is posted. If none passes, the post is blocked. `gate_payloads.py` refuses to build a
scheduling request for a post without a PASS report.

The exam is a gate against the mistakes we measured, not a promise of going viral. Re-tune it every Sunday with the
week's real numbers (skip rate, watch time, sends).

## The biggest lever is still you
Your own face Reels got 760 – 2,546 views. The best of the generated ones got about 200. One 10 – 20 s phone video a day
(talking or playing) is worth more than any template.
