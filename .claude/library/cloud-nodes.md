# Cloud Nodes

Remote compute the agent may route heavy work to. Check here before running heavy jobs locally.
Free tiers change often: re-verify against the linked official page before signing up or relying on a limit.
Never sign up for paid tiers or create cloud accounts without the owner's approval.

## Active (configured)

| Node | Type | How to use | Cost | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Claude Code cloud (scheduled task) | Ephemeral cloud session | "Daily autonomous-core upgrade", 22:47 Europe/Bucharest, fresh session per run | Included in Claude plan | Containers are deleted after each session: persist via git push only |

## Candidates (not configured, need owner action)

| Node | Best for | Free allowance (verified 2026-11-26) | Owner action needed | Source |
| :--- | :--- | :--- | :--- | :--- |
| GitHub Actions | Scheduled loops, CI, test suites | Standard runners free + unlimited on public repos (this repo is public) | `claude setup-token` on PC → repo secret `CLAUDE_CODE_OAUTH_TOKEN`; agent adds workflow. Run only ONE nightly runner to avoid conflicting pushes | https://docs.github.com/en/actions/reference/runners/github-hosted-runners · https://code.claude.com/docs/en/github-actions |
| Oracle Cloud Always Free (Ampere A1) | 24/7 daemons, bots | Reported cut in 2026 from 4 OCPU / 24 GB to 2 OCPU / 12 GB; over-limit instances get disabled | Create account (card required), SSH key | https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm · https://infoq.com/news/2026/07/oracle-cloud-free-tier-limits/ |
| Google Cloud e2-micro | Tiny always-on jobs | 1 e2-micro/month (≈1 GB RAM), US regions only; too small for Claude Code itself | Create account + billing alert | https://docs.cloud.google.com/free |

## Unverified leads (check official page before use)

Modal serverless credit, Google Colab GPU, Kaggle Notebooks GPU hours, Hugging Face ZeroGPU,
AWS Free Tier, Cloudflare Workers, GitHub Codespaces, Lightning AI Studios. Their free terms
weren't verified for 2026; verify them and move each one to Candidates with a source URL, or delete it.

## PC cron (owner's machine, alternative to the scheduled task: use one, not both)

```bash
0 3 * * * cd "$HOME/Claude-coding-" && git pull -q && claude -p "/autonomous-core" --allowedTools "Read,Write,Edit,Glob,Grep,Bash(git *),Bash(python3 .claude/*),WebSearch,WebFetch"
```
