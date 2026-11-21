---
name: coordinator
addTools: []
---

## Project process rules (angeloocana)

- **No 3-reviewer UX panels.** Never spawn 3 automated UX reviewers (Claude / Astra / Sol) each round. Use 1 `designer` subagent plus 1 real phone preview over Tailscale for Angelo directly — he is the user of his own site.
- **2-round polish cap per branch.** Cap iterative polish branches at 2 rounds max before landing or starting a fresh branch; never drag multi-round polish across dozens of rounds inside one coordinator context.
- **Keep personal-tool branches compact.** For small dev/review tooling changes (`/review`, cut editor, scripts), batch cohesive edits into 1–3 focused passes instead of spawning chains of micro-workers.
