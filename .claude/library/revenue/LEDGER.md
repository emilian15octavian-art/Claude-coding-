# Revenue Ledger

Every artifact we make gets a row. `revenue_scan.py --add` appends new ones; the agent fills Product/Channel/Next action.
Revenue is entered only from real payouts the owner reports or a connected dashboard shows. No estimates in that column.

Status: `candidate` → `packaging` → `awaiting-approval` (owner must approve anything public or paid) → `live` → `retired` · or `not-sellable`.

## Owner constraints (2026-11-27)
- ~10 h/week · near-zero budget (free tiers, revenue-share platforms, no upfront ads) · payments via EU-available providers.
- Assets: band site with shop pages; **memberships launching on the site in a few weeks**; music not on streaming yet.
- Skills: visual art, theology, history, psychology. Products should use these: they're what nobody else can copy.
- Priority order follows effort-to-first-sale at 10 h/week.

## Products (bundles of artifacts)

| Product | Built from | Form | Channel | Price | Status | Revenue to date | Next action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Band membership (anchor)** | Site membership (launching), music, art, the band's themes | 3 tiers: supporter (early releases, behind-the-song notes), insider (+ monthly essay on the history/theology/psychology behind a song, sketches, demos), patron (+ signed print or name in credits) | Band site (owner's payment account) | owner decides | candidate | 0 | Draft tier perks + a 3-month content calendar that takes ≤ 4 h/week; launch page copy |
| **2. Get the music on streaming** | Existing recordings | Distributor upload (Spotify, Apple, YouTube Music) + YouTube Content ID; free/low-cost distributor chosen after comparing current terms | Distributor (owner's account) | n/a | candidate | 0 | Compare distributors' current fees/splits with sources; prepare metadata + artwork per track |
| **3. Art + knowledge digital products** | Owner's artwork and theology/history/psychology writing | Illustrated zine/PDF series on the stories behind the songs; art prints via print-on-demand (no stock, no upfront cost) | Band shop, Bandcamp-style store | owner decides | candidate | 0 | Pick first zine topic; outline 12 pages; choose POD provider available in the EU |
| Claude Code Autopilot Kit | verify-work, claude-code-automation, skill-authoring, mcp-server-python, claude-api-tool-use | Skill zips + README + 1 demo video | Gumroad / Lemon Squeezy (owner's account) | owner decides | candidate | 0 | Generalize: remove brain-specific paths; write listing; owner picks license + store. Sell our own tested code + packaging; skills learned from Claude Academy keep their source links; no Anthropic name/logo in the listing |
| Band-site setup service | Bleeding Debts 316 site work (GitLab) | Done-for-you service for other bands | Owner's site + band networks | owner decides | candidate | 0 | Owner confirms they want client work; draft one-page offer |
| Free-cloud guide | `.claude/library/cloud-nodes.md` | Free blog post / lead magnet (facts expire fast: not a paid product) | Owner's site, newsletter | free | candidate | 0 | Rewrite as an article; link to the kit |

## Artifacts

| Artifact | Path | Score | Status | Why | Product | Revenue | Added |
| :--- | :--- | ---: | :--- | :--- | :--- | :--- | :--- |
| claude-api-tool-use | `.claude/skills/claude-api-tool-use/SKILL.md` | 9 | candidate | skill (packageable as a zip), has tests, ships executable tooling, well documented, not tied to this setup | | | 2026-11-27 |
| mcp-server-python | `.claude/skills/mcp-server-python/SKILL.md` | 9 | candidate | skill (packageable as a zip), has tests, ships executable tooling, well documented, not tied to this setup | | | 2026-11-27 |
| verify-work | `.claude/skills/verify-work/SKILL.md` | 9 | candidate | skill (packageable as a zip), has tests, ships executable tooling, well documented, not tied to this setup | | | 2026-11-27 |
| claude-code-automation | `.claude/skills/claude-code-automation/SKILL.md` | 6 | candidate | skill (packageable as a zip), well documented, not tied to this setup | | | 2026-11-27 |
| autonomous-core | `.claude/skills/autonomous-core/SKILL.md` | 4 | candidate | skill (packageable as a zip), well documented, tied to this brain: generalize before selling | | | 2026-11-27 |
| skill-authoring | `.claude/skills/skill-authoring/SKILL.md` | 4 | candidate | skill (packageable as a zip), well documented, tied to this brain: generalize before selling | | | 2026-11-27 |
| ingest | `.claude/library/scripts/python/ingest.py` | 2 | candidate | standalone script, tied to this brain: generalize before selling | | | 2026-11-27 |
| tool-registry | `.claude/skills/tool-registry/SKILL.md` |  | not-sellable | internal plumbing | | | 2026-11-27 |
| academy | `.claude/library/scripts/python/academy.py` |  | not-sellable | built from third-party content: use internally, don't sell | | | 2026-11-27 |
| revenue_scan | `.claude/library/scripts/python/revenue_scan.py` |  | not-sellable | internal plumbing | | | 2026-11-27 |
| update_index | `.claude/library/scripts/python/update_index.py` |  | not-sellable | internal plumbing | | | 2026-11-27 |
| fetch | `.mcp.json` |  | not-sellable | third-party MCP server: not yours to sell | | | 2026-11-27 |
| playwright | `.mcp.json` |  | not-sellable | third-party MCP server: not yours to sell | | | 2026-11-27 |
| revenue-capture | `.claude/skills/revenue-capture/SKILL.md` | 4 | candidate | skill (packageable as a zip), well documented, tied to this brain: generalize before selling | | | 2026-11-27 |
