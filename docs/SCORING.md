# Match Scoring Guide & Formula Reference

OpenSourceMate ranks open-source issues for developers using a transparent, multi-factor compatibility scoring formula.

All scoring weights, multipliers, point caps, and thresholds are defined in a typed configuration object (`ScoringConfig` in `backend/app/services/scoring_config.py`). There are no magic numbers embedded in the scoring algorithm.

---

## 1. Scoring Weights & Thresholds Configuration Table

The table below outlines every weight, threshold, and parameter used by `calculate_issue_score`:

| Parameter | Default Value | Category | Description |
| :--- | :--- | :--- | :--- |
| `language_match_weight` | `40.0` | Skill Match | Points awarded when repository primary language matches user profile (scaled by user skill weight `0.0`–`1.0`). |
| `max_text_points` | `30` | TF-IDF Text | Point cap for text keyword / TF-IDF mentions in issue title, labels, repo, and body. |
| `text_term_multiplier` | `12.0` | TF-IDF Text | Multiplier in logarithmic TF-IDF term scoring formula. |
| `text_log_scale_divisor`| `2.0` | TF-IDF Text | Divisor in logarithmic TF-IDF term scoring formula. |
| `title_term_weight` | `3` | Field Weight | Term occurrence weight in issue title. |
| `labels_term_weight` | `2` | Field Weight | Term occurrence weight in issue labels. |
| `repo_term_weight` | `2` | Field Weight | Term occurrence weight in repository name. |
| `body_term_weight` | `1` | Field Weight | Term occurrence weight in issue description body. |
| `max_embedding_points` | `25` | Semantic ML | Point cap for optional vector embedding cosine similarity (scaled by similarity `0.0`–`1.0`). |
| `good_first_issue_bonus`| `25` | Label Bonus | Bonus points awarded when issue has `good first issue` label. |
| `help_wanted_bonus` | `15` | Label Bonus | Bonus points awarded when issue has `help wanted` label. |
| `activity_recent_days_threshold` | `30` | Activity Recency | Max days since update to qualify for recent activity bonus. |
| `activity_recent_bonus` | `10` | Activity Recency | Bonus points awarded for updates within `activity_recent_days_threshold` (30 days). |
| `activity_moderate_days_threshold`| `90` | Activity Recency | Max days since update to qualify for moderate activity bonus. |
| `activity_moderate_bonus` | `5` | Activity Recency | Bonus points awarded for updates between 31 and 90 days ago. |
| `freshness_active_days_threshold` | `14` | Freshness Categorization | Days threshold for `Active` freshness indicator. |
| `freshness_stale_days_threshold` | `60` | Freshness Categorization | Days threshold beyond which issue is marked `Stale`. |
| `comments_max_threshold` | `10` | Discussion Size | Max comments to qualify for manageable discussion bonus. |
| `comments_manageable_bonus` | `10` | Discussion Size | Bonus points awarded when `comments <= 10`. |
| `min_score` | `0` | Range Constraint | Minimum lower bound for final clamped match score. |
| `max_score` | `100` | Range Constraint | Maximum upper bound for final clamped match score. |

---

## 2. Match Score Formula

The overall compatibility score is computed as the sum of several distinct components:

$$\text{Raw Score} = S_{\text{lang}} + S_{\text{text}} + S_{\text{embedding}} + B_{\text{gfi}} + B_{\text{hw}} + B_{\text{activity}} + B_{\text{comments}}$$

### Component Details

1. **Direct Primary Language Match ($S_{\text{lang}}$)**:
   $$S_{\text{lang}} = \text{round}(\text{language\_match\_weight} \times w_{\text{skill}})$$
   Where $w_{\text{skill}} \in [0.0, 1.0]$ represents the developer's skill weight in that language.

2. **Keyword / TF-IDF Mentions ($S_{\text{text}}$)**:
   For each skill mentioned in the issue title ($3\times$), labels ($2\times$), repository name ($2\times$), or body ($1\times$):
   $$\text{points}(s) = \frac{\text{text\_term\_multiplier} \times w_{s} \times \text{IDF}(s) \times (1 + \ln(\text{count}))}{\text{text\_log\_scale\_divisor}}$$
   $$S_{\text{text}} = \min\left(\text{round}\left(\sum_{s} \text{points}(s)\right), \text{max\_text\_points}\right)$$

3. **Semantic Embeddings ($S_{\text{embedding}}$ - Optional)**:
   $$S_{\text{embedding}} = \text{round}(\text{max\_embedding\_points} \times \text{similarity})$$
   (Only applied when embedding model is active; otherwise 0).

4. **Community Label Bonuses**:
   - $B_{\text{gfi}} = 25$ if `good first issue` in labels, else $0$.
   - $B_{\text{hw}} = 15$ if `help wanted` in labels, else $0$.

5. **Activity Recency Bonus ($B_{\text{activity}}$)**:
   - $B_{\text{activity}} = 10$ if updated within 30 days.
   - $B_{\text{activity}} = 5$ if updated within 31–90 days.
   - $B_{\text{activity}} = 0$ otherwise.

6. **Manageable Discussion Bonus ($B_{\text{comments}}$)**:
   - $B_{\text{comments}} = 10$ if comment count $\le 10$, else $0$.

### Range Clamping & Raw Score
- **Final Display Score**: Clamped strictly to `[0, 100]`:
  $$\text{Final Score} = \max(\text{min\_score}, \min(\text{Raw Score}, \text{max\_score}))$$
- **`raw_score`**: Kept alongside the final score to maintain determinism and resolve ties when multiple issues reach the 100-point ceiling.

---

## 3. Local Score Breakdown Tool

OpenSourceMate includes a dedicated command-line script to inspect the complete point breakdown for any profile and issue without network access:

```bash
# Run with sample data
python scripts/explain_score.py

# Output formatted JSON
python scripts/explain_score.py --json
```

---

## 4. Customizing Weights in Code or Tests

To test alternative scoring weights or experiment with custom rankings:

```python
from app.services.matching_service import calculate_issue_score
from app.services.scoring_config import ScoringConfig

# Define custom configuration
custom_config = ScoringConfig(
    language_match_weight=50.0,
    good_first_issue_bonus=30,
)

# Pass config into calculate_issue_score
result = calculate_issue_score(issue, user_skills, config=custom_config)
print(result["score"])
```
