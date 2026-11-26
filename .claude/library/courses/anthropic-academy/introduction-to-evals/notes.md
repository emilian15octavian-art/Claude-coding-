# Introduction to evals: notes
Source: https://academy.claude.com/courses/introduction-to-evals · 4 lessons · quiz + 🏅 · studied 2026-11-26

- **Pick models by measurement:** set an accuracy floor from the cost of a wrong answer → score each model on the same cases → cost per call → cost per *completed* task → cheapest model above the floor.
- **Minimum viable eval:** realistic inputs + expected answers written *before* any model runs + a grader. Graders: code (exact/contains: fastest, most reliable) → LLM judge with a rubric (free-text fields) → humans. Hand-grade a sample before trusting the judge. Cover typical, multi-item and edge (missing-data) cases.
- **Fix the prompt before upgrading the model:** group failures by case type and field, fix what they share (e.g. "return null when there's no risk section"), rerun all cases on all models (demo: Haiku 84% → 100%).
- **Production:** smoke eval (~10 cases) on every PR as a required check with a threshold, full suite as a batch, nightly grading of sampled live traffic to catch drift.
- Candidate future skill: `evals-smoke-ci` once you have a prompt worth guarding.
