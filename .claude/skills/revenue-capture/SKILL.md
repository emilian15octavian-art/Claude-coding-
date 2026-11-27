---
name: revenue-capture
description: Turn the work we do into income. Use after finishing any skill, script, tool, site feature, guide or creative asset; during the daily autonomous-core run; or when the owner asks "can we sell this", "make money from this", "passive income", "monetize". Scores artifacts, keeps the revenue ledger, packages products, drafts listings, and stops for owner approval before anything goes public or touches money.
allowed-tools: Read, Bash(python3 .claude/library/scripts/python/revenue_scan.py*)
---

# Revenue capture: every piece of work is checked for income

Ledger: `.claude/library/revenue/LEDGER.md`. Scanner (run it, don't read it): `python3 .claude/library/scripts/python/revenue_scan.py [--add]`.

## 1. Capture (after every finished artifact, and daily)
1. Run the scanner with `--add`. Each new indexed artifact gets a row: score 0–10 (reusable, tested, self-contained, documented) or `not-sellable` with the reason.
2. For each `candidate`, answer in the row's Next action: **Who would pay?** (a specific buyer, e.g. "solo devs on Claude Code") · **Why?** (time saved, money earned, risk avoided) · **What form?** (below) · **What's missing?**
3. Group related artifacts into a **Product** row. One good bundle beats ten tiny listings.

## 2. Forms, cheapest to run first
| Form | Fits | Channels (owner's accounts) |
| --- | --- | --- |
| Digital download (skill zips, templates, scripts + README) | Tested tooling | Gumroad, Lemon Squeezy, Bandcamp (music assets) |
| Free content that sells the paid thing | Guides, write-ups, demos | Owner's site, newsletter, YouTube/TikTok shorts |
| Done-for-you service | Things we built for ourselves that others need (band site, automations) | Owner's site, direct outreach drafts |
| Subscription | Ongoing value (fan perks, monthly packs) | Bandcamp subscription, Patreon |
| Physical (print-on-demand) | Band artwork, designs | Site shop + POD provider via Stripe |

## 3. Package (status `packaging`)
- Generalize: strip brain-specific paths and personal details; add a README with install + a 60-second quick start; keep the tests in.
- Run `verify-work` on the package. Ship nothing that fails its own tests.
- Draft the listing: title, 3 benefits, what's inside, requirements, honest limits, price suggestion with 2–3 comparable listings and their URLs.
- Pick a license with the owner (a paid product needs one; the repo is public, so sell convenience, support, updates and bundles, not secrecy).

## 4. Approval gate (status `awaiting-approval`): always stop here
The owner approves before: publishing a listing or post, setting prices, creating store/payment accounts, connecting Stripe or payouts, emailing anyone, or spending money. Present: the listing text, price, channel, license, and what goes public. Unattended runs only prepare drafts and log them.

## 5. Track (status `live`)
- Revenue column = real payouts the owner reports or a connected dashboard shows. Never estimates.
- Monthly: retire products with no sales after 90 days and a fair try; double down on what sells.

## Hard rules
- Sell only the owner's own work. Things built from third-party content (course material, other people's code, MCP servers we installed) are `not-sellable`; cite sources inside products and never use Anthropic's or other brands' names, logos or endorsements.
- No income claims or guarantees in listings, no fake reviews or scarcity, no spam, no platform-rule breaking (survey/click/engagement bots, automated surveys answered for the owner, review swaps).
- Taxes and payouts run through the owner's accounts in their country; flag when income needs declaring.
