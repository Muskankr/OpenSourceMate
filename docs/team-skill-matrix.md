# Team Skill Matrix (Issue #424)

## Overview

OpenSourceMate's **Team Skill Matrix** allows engineering teams, student cohorts, hackathon groups, and open-source study groups to analyze up to five GitHub usernames concurrently.

It maps collective technical coverage, shared proficiencies, and single-expert competencies (technologies that only one person knows) while handling individual profile failures gracefully.

---

## Features

1. **Parallel Analysis with Concurrency Safety**:
   - Supports up to 5 GitHub usernames analyzed in parallel.
   - Enforces rate-limit compliance through the backend's bounded concurrency and client-side caching.
   - Accurately enforces boundary limits: entering more than 5 usernames is rejected with a clear user-facing error message.

2. **Full Matrix & Coverage Summary**:
   - Computes an interactive visual matrix mapping each detected technology across all team members.
   - Summarizes total distinct technologies covered, shared technologies (covered by $\ge 2$ members), and single-expert technologies.
   - Spotlights **"Technologies only one person knows"** to identify key areas of unique expertise or single points of failure.

3. **Per-User Failure Isolation**:
   - If a username is invalid, not found (404), or rate-limited (429), it is flagged in a dedicated warnings panel with a human-readable explanation.
   - The team skill matrix continues rendering seamlessly using all successfully fetched profiles without blocking or crashing.

4. **Accessible Alternative (WCAG 2.1 AA Compliant)**:
   - Provides a toggle between the interactive visual grid and an **Accessible Standard HTML Table** (`<table>` with `<caption class="sr-only">`, proper `scope="col"`, `scope="row"`, and readable text descriptions).

---

## Route & Usage

- **URL**: `/team` or `/team?users=alice,bob,charlie`
- **Supported Formats**: Usernames separated by commas, spaces, or newlines, with optional `@` prefix.
