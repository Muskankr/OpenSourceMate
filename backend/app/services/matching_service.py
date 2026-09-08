from datetime import datetime, timezone


def calculate_issue_score(
    issue: dict,
    user_skills: list[str],
) -> dict:
    """
    Calculate a transparent compatibility score between
    a GitHub issue and a user's skills.
    """

    score = 0
    reasons = []

    labels = {
        label.lower()
        for label in issue.get("labels", [])
    }

    # -----------------------------------
    # 1. Skill / language match
    # -----------------------------------

    issue_language = issue.get("language")

    if issue_language:
        user_skill_names = {
            skill.lower()
            for skill in user_skills
        }

        if issue_language.lower() in user_skill_names:
            score += 40
            reasons.append(
                f"Your profile includes {issue_language}."
            )

    # -----------------------------------
    # 2. Good first issue
    # -----------------------------------

    if "good first issue" in labels:
        score += 25
        reasons.append(
            "This issue is marked as a good first issue."
        )

    # -----------------------------------
    # 3. Help wanted
    # -----------------------------------

    if "help wanted" in labels:
        score += 15
        reasons.append(
            "The repository is actively looking for contributors."
        )

    # -----------------------------------
    # 4. Issue activity
    # -----------------------------------

    updated_at = issue.get("updated_at")

    if updated_at:
        try:
            updated = datetime.fromisoformat(
                updated_at.replace("Z", "+00:00")
            )

            days_old = (
                datetime.now(timezone.utc) - updated
            ).days

            if days_old <= 30:
                score += 10
                reasons.append(
                    "This issue has been active recently."
                )

            elif days_old <= 90:
                score += 5
                reasons.append(
                    "This issue has recent activity."
                )

        except ValueError:
            pass

    # -----------------------------------
    # 5. Comment count
    # -----------------------------------

    comments = issue.get("comments", 0)

    if comments <= 10:
        score += 10
        reasons.append(
            "The issue has a manageable discussion size."
        )

    # Never exceed 100
    score = min(score, 100)

    return {
        "score": score,
        "reasons": reasons,
    }