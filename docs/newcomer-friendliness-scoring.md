# Newcomer-Friendliness Scoring System (Issue #447)

## Overview

When developers look for an open source project to join, they need more than just individual issue recommendations. They need active, welcoming repositories that have clear contributor onboarding guidelines, codes of conduct, and active maintainers who label beginner-friendly tasks.

The **Newcomer-Friendliness Score** evaluates open-source repositories on a deterministic **100-point scale** across four core community signals.

---

## 100-Point Scoring Formula

Repositories are scored based on the following deterministic allocation:

| Signal | Maximum Points | Evaluation Criteria & Allocation |
| :--- | :--- | :--- |
| **Open Beginner Issues** | **30 pts** | Curated issues with newcomer labels (`good first issue`, `beginner`, `easy`):<br>• $\ge 5$ issues: **30 pts**<br>• $3$–$4$ issues: **22 pts**<br>• $1$–$2$ issues: **15 pts**<br>• $0$ issues: **0 pts** |
| **Recent Activity** | **25 pts** | Maintainer recency based on commits, pushes, or issue/PR activity within:<br>• Last 30 days: **25 pts**<br>• 31–90 days: **15 pts**<br>• 91–180 days: **8 pts**<br>• $> 180$ days: **0 pts** |
| **CONTRIBUTING Guide** | **25 pts** | Presence of `CONTRIBUTING.md` or community guidelines:<br>• Present: **25 pts**<br>• Missing: **0 pts** |
| **Code of Conduct** | **20 pts** | Presence of `CODE_OF_CONDUCT.md` or standard conduct declaration:<br>• Present: **20 pts**<br>• Missing: **0 pts** |

**Total Score Range**: $0$ to $100$ points.

---

## Newcomer-Friendliness Tiers

Repositories are grouped into four newcomer-friendliness tiers for visual badges and clarity:

| Tier | Score Range | Description | Badge Color |
| :--- | :--- | :--- | :--- |
| **Very Welcoming** | $80$–$100$ pts | Ideal entry point: clear guides, conduct rules, active maintainers, and plentiful beginner tasks. | Emerald / Green |
| **Welcoming** | $60$–$79$ pts | Solid community structure with established guidelines and regular updates. | Blue |
| **Moderate** | $40$–$59$ pts | Some documentation present; may require asking maintainers for local setup details. | Amber / Orange |
| **Challenging** | $0$–$39$ pts | Lacks onboarding documentation or recent activity; steeper barrier for first-time contributors. | Slate / Gray |

---

## Filtering Capabilities

The Discover page allows developers to find projects tailored to their goals:
- **Language Filtering**: Filter repositories by primary programming technology (e.g., Python, TypeScript, JavaScript, Go, Rust).
- **Repository Size (Stars Range)**:
  - **All Sizes**: Unrestricted search.
  - **< 1,000 ⭐**: Growing/emerging projects where individual contributions have high impact.
  - **1,000 – 10,000 ⭐**: Balanced medium-sized active open source projects.
  - **10,000+ ⭐**: Large, established ecosystems.
- **Empty State**: When filters yield no matching repositories, a friendly message suggests widening filters or resetting with one click.

---

## Caching & Rate Limit Protection

To protect users against GitHub secondary and primary rate limits:
1. Search queries are cached in backend memory (`discover:{lang}:{min_stars}:{max_stars}:{limit}`) with a 1-hour TTL.
2. In-flight requests coalesce duplicate fetches.
3. HTTP 429 rate limit errors gracefully bubble to the UI and render the standard `RateLimitBanner` notifying the user when rate limits reset.
