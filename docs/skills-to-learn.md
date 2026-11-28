# Nearby Skills & Issue Unlocks Architecture & Contribution Guide

## 1. Overview
Recommending only issues that match a contributor's current skills limits opportunities for growth. To help developers plan their learning and discover new contribution pathways, OpenSourceMate analyzes their detected skills and suggests **nearby complementary skills** alongside the number of **additional open issues** each skill would unlock.

For example:
- A developer working in **JavaScript** sees **TypeScript** unlocks additional typed open issues, as well as **React** or **Next.js**.
- A developer proficient in **Python** sees **FastAPI**, **Django**, or **Pandas** and the exact number of extra matching open issues available in the ecosystem.
- When a user has no detected skills yet, OpenSourceMate renders an encouraging, actionable empty-state message guiding them on how to analyze their repositories or get started.

---

## 2. Requirements & Acceptance Criteria

- **Configuration-Driven Relationships**: Mappings are maintained in lightweight JSON configuration files:
  - Frontend: [`frontend/data/skills_to_learn.json`](../frontend/data/skills_to_learn.json)
  - Backend: [`backend/app/data/related_skills.json`](../backend/app/data/related_skills.json)
- **Adding Relationships Requires Only a Config Change**: Contributors can map new companion skills simply by updating the JSON configurations without modifying business logic.
- **Top Three Suggestions**: Limits recommendations to the top 3 highest-impact nearby skills ranked by additional unlocked open issues.
- **Unlocked Open Issues Metric**: Each suggestion prominently displays the count of additional issues unlocked (e.g., `+18 issues unlocked`).
- **Strict User Skill Exclusion**: Automatically excludes any skills the user already possesses (case-insensitive matching).
- **Helpful Empty State**: When a user has no detected skills (or unchecks all skills), a clear empty-state card is displayed with helpful guidance rather than a blank or broken screen.

---

## 3. Configuration Files & Schemas

### Frontend Configuration (`frontend/data/skills_to_learn.json`)
Maps canonical language/technology names to an array of companion skills:
```json
{
  "JavaScript": ["TypeScript", "React", "Node.js", "Next.js", "Vue"],
  "Python": ["FastAPI", "Django", "Flask", "PyTorch", "Pandas"],
  "React": ["Next.js", "TypeScript", "Tailwind CSS", "Redux", "GraphQL"],
  "Go": ["Docker", "Kubernetes", "gRPC", "Prometheus", "Terraform"]
}
```

### Backend Configuration (`backend/app/data/related_skills.json`)
Defines the same structured relationships for backend recommendation queries and OpenAPI endpoints:
```json
{
  "JavaScript": ["TypeScript", "React", "Node.js", "Next.js", "Vue"],
  "Python": ["FastAPI", "Django", "Flask", "PyTorch", "Pandas"],
  "React": ["Next.js", "TypeScript", "Tailwind CSS", "Redux", "GraphQL"],
  "Go": ["Docker", "Kubernetes", "gRPC", "Prometheus", "Terraform"]
}
```

---

## 4. How to Add New Skill Relationships (Config-Only)

Adding a new relationship or expanding an existing one requires **no code changes**:

1. **Open the Config Files**:
   - [`frontend/data/skills_to_learn.json`](../frontend/data/skills_to_learn.json)
   - [`backend/app/data/related_skills.json`](../backend/app/data/related_skills.json)
2. **Locate or Add the Base Technology**:
   - If the skill already exists (e.g., `"Python"`), append your companion skill (e.g., `"FastAPI"`) to the array in order of relevance.
   - If adding a new technology, add a new key with canonical capitalization and an array of 3–6 related skills:
     ```json
     "Elixir": ["Phoenix", "Ecto", "Erlang", "LiveView"]
     ```
3. **Verify Canonical Casing**:
   - Use community-standard casing (e.g., `TypeScript`, `FastAPI`, `GraphQL`, `Next.js`). Matching is case-insensitive, but display uses canonical formatting.
4. **Run Tests**:
   ```bash
   cd frontend
   npm test -- --testPathPattern="SkillsToLearn|skillsToLearn" --watchAll=false
   ```
5. Submit your pull request!

---

## 5. Recommendation & Unlock Count Algorithm

### Client-Side (`frontend/utils/skillsToLearn.ts`)
1. **Empty / No-Skills Check**: If the user's detected skills list is empty, returns an empty list `[]`.
2. **Normalized Exclusion Set**: Converts all user skills to lowercase for case-insensitive exclusion.
3. **Lookup & Aggregation**: For each detected user skill, retrieves related skills from the config. Any skill already known by the user or already suggested is filtered out.
4. **Issue Unlock Count**:
   - Scans the issue pool (if loaded from recommendations) to tally how many matching open issues require each related skill.
   - Falls back to a deterministic catalog baseline count if an issue pool is not yet populated.
5. **Ranking & Truncation**: Sorts candidate skills in descending order of unlocked open issue counts and takes the **top 3**.

### Backend Service (`backend/app/services/related_skills_service.py`)
1. **Dynamic Config Loader**: Reads `backend/app/data/related_skills.json` dynamically with caching.
2. **Issue Unlock Calculation**: Queries open issues tagged with each candidate skill.
3. **Endpoints**:
   - `GET /api/matching/users/{username}/skill-unlocks`: Evaluates detected skills for `{username}` and returns top 3 unlock suggestions.
   - `GET /api/matching/skill-unlocks?skills=Python&skills=JavaScript`: Direct query with arbitrary skill inputs.
4. **Empty State Message**: Returns `"No skills detected yet. Analyze a GitHub profile or select skills to discover nearby opportunities."` when input skills are empty.

---

## 6. UI Component (`frontend/components/SkillsToLearn.tsx`)

The UI component integrates seamlessly into the results page:
- **Empty State**: When `skills` is empty, displays an informative card with `data-testid="skills-to-learn-empty"`, explaining how to unlock issue recommendations.
- **Top 3 Cards**: Renders a 3-column responsive grid (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3`).
- **Unlocked Issues Badge**: Shows a highlighted pill on each card (e.g. `+18 issues unlocked`) using `data-testid="unlock-badge-{name}"`.
- **Relationship Context**: Highlights which base skill paired with the suggestion (`Pairs with Python`).
- **Accessible & Themed**: Includes full dark/light mode styling and `aria-label="Skills to learn next"`.

---

## 7. Verification & Testing

- Unit tests in `frontend/__tests__/skillsToLearn.test.ts` verify exclusion of existing skills, ranking by unlocked count, top 3 truncation, and config overrides.
- Integration tests in `frontend/__tests__/SkillsToLearn.test.tsx` verify the empty-state rendering, top 3 display, unlock badges, and accessibility.
- Backend tests in `backend/tests/test_related_skills_service.py` verify JSON config parsing, exclusion logic, issue counting, and empty skills handling.
