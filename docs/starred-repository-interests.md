# Starred Repository Topics as Interest Signals

## Overview

A developer's authored repositories reflect their **proven, existing skill set**, while their starred repositories often reflect their **learning aspirations, curiosity, and emerging interests**.

By analyzing the topics and languages of repositories a user has starred, OpenSourceMate captures these forward-looking signals without confusing them with verified coding competencies.

---

## Architectural Principles

1. **Separation of Proven Skills vs. Emerging Interests**:
   - Proven skills: Computed from repository languages and manifest dependencies in authored code.
   - Interests: Derived from topics (`topics`) and primary languages of starred repositories.
2. **Rate Limit Conservation**:
   - Caps total starred repositories fetched per analysis at 50 (or maximum 100).
   - Responses are cached using `github_cache_ttl` in `TTLCache`.
3. **Visual Transparency**:
   - Rendered using the `<InterestsDisplay />` component with distinctive amber styling, topic tags (`#topic`), and frequency multipliers.

---

## API Specification

### Endpoint: `GET /api/v1/github/users/{username}/starred-interests?limit=50&refresh=false`

#### Sample Response:
```json
{
  "username": "octocat",
  "starred_count": 3,
  "topics": [
    { "topic": "docker", "count": 2 },
    { "topic": "fastapi", "count": 1 },
    { "topic": "react", "count": 1 }
  ],
  "languages": [
    { "language": "Python", "count": 2 },
    { "language": "TypeScript", "count": 1 }
  ],
  "total_starred_analyzed": 3
}
```

---

## Verification
- Backend service tested in `backend/tests/test_starred_interests.py`.
- Frontend display tested in `frontend/__tests__/InterestsDisplay.test.tsx`.


---

## Interest Weighting Formula

In upcoming matching phases (Issue #191 / #195), interested topics will provide secondary match boosts to good first issues tagged with complementary labels:

$$\text{MatchScore} = \text{SkillMatch} \times 0.70 + \text{InterestMatch} \times 0.20 + \text{FriendlinessScore} \times 0.10$$

This balances current execution capability with learning velocity, preventing developers from only receiving issues in languages they already know exhaustively.
