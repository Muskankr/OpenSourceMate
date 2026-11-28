# Pasted Text Skill Analysis Architecture

## Overview

Many aspiring open-source contributors do not maintain extensive public repository histories on GitHub, or their public repositories consist of course forks that fail to reflect their true technical capabilities. To provide inclusive matching for developers with private work or non-traditional backgrounds, OpenSourceMate provides in-memory text skill extraction from resumes, LinkedIn bios, or project summaries.

---

## Privacy & Security Architecture

1. **Ephemeral In-Memory Execution**:
   - The user's pasted text is processed strictly in-memory during the lifetime of the request.
   - Text is **never written to disk**, logged in application logs, persisted in databases, or forwarded to third-party endpoints.
2. **Strict Payload Size Limits**:
   - The API enforces a strict maximum length of 10,000 characters (`MAX_PASTED_TEXT_LENGTH`).
   - Payloads exceeding this limit are truncated or rejected with HTTP 422 to protect server resources from denial-of-service attempts.
3. **Transparent User Disclaimer**:
   - A dedicated privacy note is displayed prominently within the UI reassuring users that their input is temporary and private.

---

## Extraction Algorithm

The backend implements a multi-category regular expression matching engine:
- **Languages**: Python, TypeScript, JavaScript, Rust, Go, Java, C++, etc.
- **Frameworks**: React, Next.js, Vue, Angular, FastAPI, Django, Flask, Express, etc.
- **Databases & DevOps**: PostgreSQL, MongoDB, Redis, Docker, Kubernetes, etc.
- **AI & Data**: Machine Learning, PyTorch, TensorFlow, scikit-learn, etc.

### Confidence Scoring
Each detected skill is assigned a confidence metric ($0 - 100\%$) based on:
- Mention count and proximity.
- Domain category weight multiplier.
- Caps at $100\%$ confidence for primary tech stacks.

---

## API Specification

### Endpoint: `POST /api/v1/skills/analyze-text`

#### Request Payload:
```json
{
  "text": "Senior software engineer with 5 years building reactive UIs in Next.js, React, TypeScript, and microservices in Python (FastAPI, Docker)."
}
```

#### Response Payload:
```json
{
  "skills": [
    {
      "skill": "React",
      "occurrences": 1,
      "confidence": 72,
      "category": "framework"
    },
    {
      "skill": "Next.js",
      "occurrences": 1,
      "confidence": 72,
      "category": "framework"
    },
    {
      "skill": "Python",
      "occurrences": 1,
      "confidence": 60,
      "category": "language"
    }
  ],
  "total_extracted": 3,
  "character_count": 139,
  "categories": {
    "framework": 2,
    "language": 1
  }
}
```

---

## Verification
- Backend service and endpoint tested in `backend/tests/test_pasted_text_skills.py`.
- Frontend user interaction and privacy disclaimers verified in `frontend/__tests__/PastedTextAnalyzer.test.tsx`.
