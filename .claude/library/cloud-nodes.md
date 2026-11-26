# Cloud Nodes

Remote compute the agent may route heavy work to. Check here before running heavy jobs locally.
Free tiers change often: re-verify against the linked official page before signing up or relying on a limit.
Creating accounts, adding cards or storing cloud credentials needs the owner's approval (Tier 1b).

Confidence: **official** = stated on the provider's own docs/pricing page · **reported** = consistent third-party reports, not confirmed officially · **disputed** = sources conflict.

## Active (configured)

| Node | Type | How to use | Cost | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Claude Code cloud (scheduled task) | Ephemeral Linux session (has gh, docker, ffmpeg, uvx, npx, python3, Chromium) | "Daily autonomous-core upgrade", 22:47 Europe/Bucharest, fresh session per run | Included in Claude plan | Container deleted after each session: persist via git push only. Outbound hosts limited by network policy: YouTube, Hugging Face model hosts and anthropic.skilljar.com are blocked (2026-11-26), so no Whisper or YouTube here |

## Candidates (audited 2026-11-26, not configured)

### Scheduled loops, CI, dev workspaces

| Node | Free allowance | Confidence | Fit for this setup | Owner action | Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GitHub Actions | Standard runners free + unlimited on public repos (this repo is public) | official | ★ Best backup runner for the nightly loop | `claude setup-token` → repo secret `CLAUDE_CODE_OAUTH_TOKEN`; agent adds workflow. Run only ONE nightly runner | https://docs.github.com/en/actions/reference/runners/github-hosted-runners · https://code.claude.com/docs/en/github-actions |
| GitHub Codespaces | 120 core-hours/month + 15 GB-month storage (personal Free; Pro: 180 / 20). = 60 h on a 2-core machine. Personal accounts only | official | Good cloud dev box from phone/PC; not for 24/7 | None (uses GitHub account); set spending limit to $0 | https://docs.github.com/en/billing/concepts/product-billing/github-codespaces |

### Always-on VMs (24/7 daemons, bots)

| Node | Free allowance | Confidence | Fit | Owner action | Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Oracle Cloud Always Free (Ampere A1) | Reported cut in 2026 from 4 OCPU / 24 GB to 2 OCPU / 12 GB; over-limit instances disabled then deleted | disputed (date) | Strongest free 24/7 VM | Account + card, SSH key | https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm · https://infoq.com/news/2026/07/oracle-cloud-free-tier-limits/ |
| AWS Free plan | Up to $200 credits for new customers ($100 signup + $100 activities); Free plan account ends after 6 months or when credits run out, then closes (90 days to upgrade); t4g.small free-tier eligible for accounts after 2025-07-15 | official (credits) / disputed (expiry) | Time-limited, not forever-free | New account + card, billing alarm | https://aws.amazon.com/free/terms · https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-free-tier-usage.html |
| Google Cloud e2-micro | 1 e2-micro/month (≈1 GB RAM), US regions only | official (instance) / reported (regions) | Too small for Claude Code; OK for tiny scripts | Account + billing alert | https://docs.cloud.google.com/free |

### Serverless / edge

| Node | Free allowance | Confidence | Fit | Owner action | Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Modal (Starter) | $0 plan + $30/month compute credit | official (plan) / reported ($30) | Serverless CPU/GPU jobs from Python | Account; API token as env var | https://modal.com/pricing |
| Cloudflare Workers (Free) | 100,000 requests/day, 10 ms CPU per invocation, 50 subrequests | official | Webhooks/cron pings only; can't run Claude Code | Account | https://developers.cloudflare.com/workers/platform/limits |

### Free GPU notebooks (ML experiments, not automation)

| Node | Free allowance | Confidence | Owner action | Source |
| :--- | :--- | :--- | :--- | :--- |
| Kaggle Notebooks | ~30 GPU h/week (floats, shown in account settings), 12 h per session, P100/T4 | reported | Account + phone verification | https://gpuperhour.com/blog/free-cloud-gpus-and-credits |
| Google Colab | No published quota ("limits vary over time"), sessions up to ~12 h | official (no quota) | Google account | https://research.google.com/colaboratory/faq.html |
| Hugging Face ZeroGPU | Free accounts: a few GPU-minutes/day (reports 3.5–5 min); can host up to 2 ZeroGPU Spaces | disputed | Account | https://huggingface.co/docs/hub/spaces-zerogpu |
| Lightning AI | 1 free 4-CPU Studio + credits; Sept 2026 report: monthly 15 credits replaced by one-time ≤30 credits | disputed | Account (+ card for extra credits) | https://lightning.ai/docs/platform/overview/faq/billing.md |

## PC cron (owner's machine, alternative to the scheduled task: use one, not both)

```bash
0 3 * * * cd "$HOME/Claude-coding-" && git pull -q && claude -p "/autonomous-core" --allowedTools "Read,Write,Edit,Glob,Grep,Bash(git *),Bash(python3 .claude/*),WebSearch,WebFetch"
```
