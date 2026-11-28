"""Rule-based text skill extraction service for pasted text, resumes, and project descriptions.

Privacy and Architecture:
- 100% in-memory processing. Zero persistent disk storage or database logging of user text.
- Enforces strict input character limits (10,000 characters).
- Tokenizes and extracts technical skills across languages, frameworks, databases, and DevOps tools.
- Computes skill confidence/frequency scores and categorizes extracted capabilities.
"""

from collections import Counter
import re
from typing import Any

# Maximum character length accepted for pasted text to prevent resource exhaustion
MAX_PASTED_TEXT_LENGTH = 10000

# Canonical skill registry with regex matching patterns and categorization
SKILL_PATTERNS: dict[str, dict[str, Any]] = {
    "Python": {
        "pattern": r"\b(python|py|django|flask|fastapi|pandas|numpy|scipy|pytest)\b",
        "category": "language",
        "weight": 1.0,
    },
    "JavaScript": {
        "pattern": r"\b(javascript|js|es6|esnext|node(?:\.js)?|express(?:\.js)?)\b",
        "category": "language",
        "weight": 1.0,
    },
    "TypeScript": {
        "pattern": r"\b(typescript|ts|tsc)\b",
        "category": "language",
        "weight": 1.0,
    },
    "React": {
        "pattern": r"\b(react(?:\.js)?|react-dom|redux|zustand|react-router)\b",
        "category": "framework",
        "weight": 1.2,
    },
    "Next.js": {
        "pattern": r"\b(next(?:\.js)?|nextjs|app router)\b",
        "category": "framework",
        "weight": 1.2,
    },
    "Vue.js": {
        "pattern": r"\b(vue(?:\.js)?|vuex|pinia|nuxt(?:\.js)?)\b",
        "category": "framework",
        "weight": 1.1,
    },
    "Angular": {
        "pattern": r"\b(angular|rxjs|ngrx)\b",
        "category": "framework",
        "weight": 1.1,
    },
    "Rust": {
        "pattern": r"\b(rust|cargo|tokio|actix)\b",
        "category": "language",
        "weight": 1.2,
    },
    "Go": {
        "pattern": r"\b(golang|goroutine|gin-gonic)\b",
        "category": "language",
        "weight": 1.1,
    },
    "Java": {
        "pattern": r"\b(java|spring(?:\s+boot)?|hibernate|maven|gradle)\b",
        "category": "language",
        "weight": 1.0,
    },
    "C++": {
        "pattern": r"\b(c\+\+|cpp|clang|cmake)\b",
        "category": "language",
        "weight": 1.0,
    },
    "HTML/CSS": {
        "pattern": r"\b(html5?|css3?|sass|scss|less|flexbox|grid)\b",
        "category": "frontend",
        "weight": 0.9,
    },
    "Tailwind CSS": {
        "pattern": r"\b(tailwind(?:\s+css)?)\b",
        "category": "frontend",
        "weight": 1.0,
    },
    "Docker": {
        "pattern": r"\b(docker|containerfile|docker-compose)\b",
        "category": "devops",
        "weight": 1.0,
    },
    "Kubernetes": {
        "pattern": r"\b(kubernetes|k8s|helm|kubectl)\b",
        "category": "devops",
        "weight": 1.1,
    },
    "PostgreSQL": {
        "pattern": r"\b(postgres(?:ql)?|psql)\b",
        "category": "database",
        "weight": 1.0,
    },
    "MongoDB": {
        "pattern": r"\b(mongodb|mongo|mongoose)\b",
        "category": "database",
        "weight": 1.0,
    },
    "Redis": {
        "pattern": r"\b(redis)\b",
        "category": "database",
        "weight": 1.0,
    },
    "GraphQL": {
        "pattern": r"\b(graphql|apollo|relay)\b",
        "category": "api",
        "weight": 1.1,
    },
    "Git": {
        "pattern": r"\b(git|github|gitlab|version\s+control)\b",
        "category": "tool",
        "weight": 0.8,
    },
    "Machine Learning": {
        "pattern": r"\b(machine\s+learning|deep\s+learning|nlp|computer\s+vision|scikit-learn|tensorflow|pytorch|transformers)\b",
        "category": "ai",
        "weight": 1.3,
    },
    "FastAPI": {
        "pattern": r"\b(fastapi|starlette|uvicorn|pydantic)\b",
        "category": "framework",
        "weight": 1.1,
    },
    "Django": {
        "pattern": r"\b(django|django\s+rest\s+framework|drf)\b",
        "category": "framework",
        "weight": 1.1,
    },
}


def extract_skills_from_text(text: str) -> dict[str, Any]:
    """Analyze skills from user pasted text in memory.

    Enforces input length bounds, ignores case, and calculates frequency
    and confidence scores. Never persists input to storage.
    """
    if not text or not text.strip():
        return {
            "skills": [],
            "total_extracted": 0,
            "character_count": 0,
            "categories": {},
        }

    clean_text = text.strip()
    if len(clean_text) > MAX_PASTED_TEXT_LENGTH:
        clean_text = clean_text[:MAX_PASTED_TEXT_LENGTH]

    extracted_skills: list[dict[str, Any]] = []
    category_counts: Counter[str] = Counter()

    for skill_name, config in SKILL_PATTERNS.items():
        pattern = config["pattern"]
        category = config["category"]
        weight = config["weight"]

        matches = re.findall(pattern, clean_text, re.IGNORECASE)
        count = len(matches)

        if count > 0:
            category_counts[category] += count
            # Calculate a confidence score capped at 100 based on occurrences and weighting
            confidence = min(100, int(round((count * 20 + 40) * weight / 1.0)))
            extracted_skills.append({
                "skill": skill_name,
                "occurrences": count,
                "confidence": confidence,
                "category": category,
            })

    # Sort skills by confidence and occurrences descending
    extracted_skills.sort(key=lambda s: (s["confidence"], s["occurrences"]), reverse=True)

    return {
        "skills": extracted_skills,
        "total_extracted": len(extracted_skills),
        "character_count": len(clean_text),
        "categories": dict(category_counts),
    }
