import type { IssueRecommendation, SkillItem } from "../types/api";
import { rankIssuesForLearningMode } from "../utils/learningMode";

export type IssueDifficulty = "Beginner" | "Intermediate" | "Advanced";

/**
 * Infers an issue's difficulty level from its labels and metadata.
 */
export function inferIssueDifficulty(labels: string[] = []): IssueDifficulty {
  const normalizedLabels = labels.map((l) => l.toLowerCase());

  // Beginner signals
  if (
    normalizedLabels.some(
      (l) =>
        l.includes("good first") ||
        l.includes("good-first-issue") ||
        l.includes("beginner") ||
        l.includes("easy") ||
        l.includes("starter") ||
        l.includes("first-timers") ||
        l.includes("documentation") ||
        l.includes("docs")
    )
  ) {
    return "Beginner";
  }

  // Advanced signals
  if (
    normalizedLabels.some(
      (l) =>
        l.includes("architecture") ||
        l.includes("performance") ||
        l.includes("expert") ||
        l.includes("hard") ||
        l.includes("complex") ||
        l.includes("rfc") ||
        l.includes("breaking") ||
        l.includes("core")
    )
  ) {
    return "Advanced";
  }

  // Default to Intermediate
  return "Intermediate";
}

/**
 * Realistic repository of open-source issues used for demo and fallback states
 * when the backend matching endpoint is not yet ready or in development.
 */
export const MOCK_RECOMMENDED_ISSUES: IssueRecommendation[] = [
  {
    id: 1001,
    number: 1001,
    author: "timneutkens",
    title: "Add dark mode toggle keyboard accessibility shortcut (Ctrl/Cmd + J)",
    repository: "vercel/next.js",
    url: "https://github.com/vercel/next.js/issues/1001",
    state: "open",
    labels: ["good first issue", "accessibility", "frontend"],
    comments: 4,
    created_at: "2026-10-15T10:00:00Z",
    updated_at: "2026-10-28T14:30:00Z",
    language: "TypeScript",
    match_score: 94,
    match_reasons: [
      "Matched primary skill: TypeScript",
      "Tag matched: accessibility / good first issue",
      "Repository matches high-frequency frontend activity",
    ],
    explanation:
      "This issue directly matches your TypeScript experience and has clear acceptance criteria suitable for getting started in Next.js core.",
    difficulty: "Beginner",
    is_mock: true,
    body: `### Description
We want to improve keyboard navigation accessibility by adding a global keyboard shortcut (\`Ctrl+J\` / \`Cmd+J\`) to toggle dark mode across docs and dashboard pages.

### Proposed Changes
- [ ] Add global event listener for \`keydown\` detecting \`KeyJ\` with meta/ctrl modifier
- [ ] Ensure the shortcut is suppressed when focused inside an \`<input>\`, \`<textarea>\`, or \`contentEditable\` element
- [ ] Announce mode changes to screen readers via \`aria-live="polite"\`
- [ ] Update keyboard shortcuts documentation table

\`\`\`typescript
export function useThemeShortcut(toggleTheme: () => void) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        toggleTheme();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);
}
\`\`\`

> **Note**: Please ensure automated tests are added under \`__tests__/keyboardNav.test.tsx\`.

For more details on accessibility guidelines, check out the [W3C ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/).`,
  },
  {
    id: 1002,
    number: 1002,
    author: "tiangolo",
    title: "Support Pydantic v2 recursive model validation in dependency injection",
    repository: "tiangolo/fastapi",
    url: "https://github.com/tiangolo/fastapi/issues/1002",
    state: "open",
    labels: ["help wanted", "enhancement", "pydantic-v2"],
    comments: 12,
    created_at: "2026-10-18T08:15:00Z",
    updated_at: "2026-10-29T11:20:00Z",
    language: "Python",
    match_score: 89,
    match_reasons: [
      "Matched primary skill: Python",
      "FastAPI architecture aligns with your backend repositories",
      "Active discussion with maintainer feedback provided",
    ],
    explanation:
      "A great match for backend Python developers comfortable with type annotations and modern async frameworks.",
    difficulty: "Intermediate",
    is_mock: true,
    body: `### Problem Summary
When nesting deeply recursive Pydantic v2 models within FastAPI \`Depends()\` or sub-dependencies, the validation schema generator occasionally throws recursion depth errors during OpenAPI generation.

### Example Code
\`\`\`python
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from typing import Optional, List

class CategoryNode(BaseModel):
    id: str
    children: Optional[List['CategoryNode']] = None

@app.get("/categories")
def get_categories(tree: CategoryNode = Depends()):
    return {"status": "ok"}
\`\`\`

### Reproduction Steps
1. Define a recursive self-referential Pydantic model with \`TypeAdapter\`
2. Mount it in an endpoint dependency
3. Fetch \`/openapi.json\`
4. Observe recursion limit exceeded

### Expected Behavior
OpenAPI schema generator should identify cycles and emit a \`$ref\` pointer instead of expanding recursively.`,
  },
  {
    id: 1003,
    number: 1003,
    author: "gaearon",
    title: "Optimize SVG rendering pipeline for heavy node tree diagrams",
    repository: "facebook/react",
    url: "https://github.com/facebook/react/issues/1003",
    state: "open",
    labels: ["performance", "component", "advanced"],
    comments: 19,
    created_at: "2026-09-20T16:45:00Z",
    updated_at: "2026-10-30T09:10:00Z",
    language: "JavaScript",
    match_score: 85,
    match_reasons: ["Matched skill: React and JavaScript", "Performance optimization focus"],
    explanation:
      "Deep dive into React DOM reconciliation and SVG layout recalculation under heavy rendering workloads.",
    difficulty: "Advanced",
    is_mock: true,
    body: `### Overview
Rendering large interactive SVG node graphs (>5,000 DOM nodes) in React currently triggers excessive style and layout recalculations during pan and zoom transitions.

### Benchmarks
- Baseline: 18 FPS during continuous drag pan on 4K display
- Target: 60 FPS sustained animation frame budget (<= 16.6ms frame time)

### Profiling Breakdown
We noticed that React fiber reconciliation visits every SVG leaf element even when transform properties are purely container-level.

\`\`\`javascript
// Current workaround
function DiagramContainer({ nodes, zoom, pan }) {
  return (
    <svg style={{ transform: \`translate(\${pan.x}px, \${pan.y}px) scale(\${zoom})\` }}>
      {nodes.map(node => <NodeView key={node.id} data={node} />)}
    </svg>
  );
}
\`\`\`

### Architecture Plan & Long Discussion
Here is the detailed architecture roadmap for optimizing the renderer:
1. Virtualization: Only render SVG nodes within the active viewport bounding box plus a 20% margin.
2. Canvas Fallback: Consider hybrid Canvas 2D / WebGL rendering for non-interactive background grids.
3. CSS Transform GPU offloading: Use \`will-change: transform\` and translate3d to avoid layout thrashing.
4. Batch state updates using \`startTransition\` to prevent locking the main thread.
5. Memoize leaf nodes using custom comparator functions to skip re-renders when zoom changes.
6. Evaluate OffscreenCanvas worker threads for off-thread node layout computing and spatial indexing (R-Tree).
7. Benchmark on low-powered mobile devices to ensure 60fps consistency across platforms.
8. Add regression benchmarks to GitHub Actions CI to catch rendering regressions automatically.

![Architecture Diagram](https://raw.githubusercontent.com/facebook/react/main/fixtures/diagram-sample.png)

Contributions, profiling traces, and feedback are welcome!`,
  },
  {
    id: 1004,
    number: 1004,
    author: "bradfitz",
    title: "Implement zero-allocation TCP connection pooling for gRPC client",
    repository: "golang/go",
    url: "https://github.com/golang/go/issues/1004",
    state: "open",
    labels: ["net/http", "performance", "help wanted"],
    comments: 8,
    created_at: "2026-10-05T12:00:00Z",
    updated_at: "2026-10-27T17:00:00Z",
    language: "Go",
    match_score: 91,
    match_reasons: ["Matched primary skill: Go", "Network systems programming alignment"],
    explanation: "Requires familiarity with Go's net package and sync.Pool memory reuse patterns.",
    difficulty: "Advanced",
    is_mock: true,
    body: `### Issue Description
High-throughput microservices using gRPC transport experience GC pauses under load due to buffer allocations in the TCP connection pool.

### Goal
Implement a \`sync.Pool\` backed buffer pool for connection framing to achieve zero allocations per request on the hot path.

\`\`\`go
var bufPool = sync.Pool{
    New: func() any {
        b := make([]byte, 32*1024)
        return &b
    },
}
\`\`\`

### Acceptance Criteria
- All tests in \`net/http\` pass without regressions.
- Benchmark shows 0 B/op and 0 allocs/op during steady state stream calls.`,
  },
  {
    id: 1005,
    number: 1005,
    author: "BurntSushi",
    title: "Improve CLI help messages and error formatting for missing config file",
    repository: "BurntSushi/ripgrep",
    url: "https://github.com/BurntSushi/ripgrep/issues/1005",
    state: "open",
    labels: ["good first issue", "cli", "docs"],
    comments: 3,
    created_at: "2026-10-22T09:30:00Z",
    updated_at: "2026-10-31T15:00:00Z",
    language: "Rust",
    match_score: 88,
    match_reasons: ["Matched skill: Rust", "Beginner-friendly issue labeled good first issue"],
    explanation:
      "Straightforward Rust enhancement updating clap CLI error reporting and user guide documentation.",
    difficulty: "Beginner",
    is_mock: true,
    body: `### Problem
When \`--config-path\` points to a non-existent file, the error message currently prints:
\`error: Os { code: 2, kind: NotFound, message: "No such file or directory" }\`

### Proposed Fix
We should catch this error and display a user-friendly error message with actionable hints:

\`\`\`text
error: configuration file not found at: /path/to/missing.conf
Hint: Check that the file exists, or specify a valid path with --config-path <FILE>.
\`\`\`

### Getting Started
1. Clone the repository
2. Inspect \`crates/core/flags/config.rs\`
3. Wrap \`std::fs::File::open\` in a custom error handler
4. Run \`cargo test --test cli\``,
  },
  {
    id: 1006,
    number: 1006,
    author: "adamwathan",
    title: "Add arbitrary precision decimal formatting utility with i18n support",
    repository: "tailwindlabs/tailwindcss",
    url: "https://github.com/tailwindlabs/tailwindcss/issues/1006",
    state: "open",
    labels: ["enhancement", "help wanted"],
    comments: 7,
    created_at: "2026-10-10T14:10:00Z",
    updated_at: "2026-10-29T18:40:00Z",
    language: "TypeScript",
    match_score: 82,
    match_reasons: ["Matched skill: TypeScript and CSS", "Utility library expansion"],
    explanation:
      "Builds on Tailwind compiler internals to format dynamic unit values across international locales.",
    difficulty: "Intermediate",
    is_mock: true,
    body: `### Summary
Add a utility function for calculating and formatting decimal values in generated CSS units (rem, em, px, %) with arbitrary precision without floating-point inaccuracies (e.g. \`0.1 + 0.2 === 0.30000000000000004\`).

### Requirements
- Support fractional units
- Format numbers cleanly (strip trailing zeroes: \`1.5000\` -> \`1.5\`)
- Full test coverage for edge cases (zero, negative values, very small fractions)`,
  },
];

export interface MockIssuesOptions {
  learningMode?: boolean;
  targetSkills?: string[];
}

/**
 * Returns mock recommended issues filtered or prioritized by user skills.
 * Falls back to the full mock set if no skills match.
 *
 * When options.learningMode is true with chosen targetSkills, ranks
 * beginner-friendly issues in the chosen skills higher.
 */
export function getMockRecommendedIssues(
  skills?: string[] | SkillItem[] | null,
  options?: MockIssuesOptions
): IssueRecommendation[] {
  let baseList: IssueRecommendation[];

  if (!skills || skills.length === 0) {
    baseList = MOCK_RECOMMENDED_ISSUES.map((issue) => ({
      ...issue,
      difficulty: issue.difficulty || inferIssueDifficulty(issue.labels),
      is_mock: true,
    }));
  } else {
    // Extract skill names in lowercase
    const userSkillNames = new Set(
      skills.map((s) => (typeof s === "string" ? s.toLowerCase() : s.name.toLowerCase()))
    );

    // Score mock issues based on user's skills
    const scored = MOCK_RECOMMENDED_ISSUES.map((issue) => {
      const langMatch = issue.language && userSkillNames.has(issue.language.toLowerCase());
      const labelMatch = issue.labels?.some((lbl) => userSkillNames.has(lbl.toLowerCase()));

      let score = issue.match_score ?? 75;
      if (langMatch) score = Math.min(98, score + 10);
      if (labelMatch) score = Math.min(99, score + 5);

      return {
        ...issue,
        match_score: score,
        difficulty: issue.difficulty || inferIssueDifficulty(issue.labels),
        is_mock: true,
      };
    });

    baseList = scored.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
  }

  if (options?.learningMode && options?.targetSkills && options.targetSkills.length > 0) {
    return rankIssuesForLearningMode(baseList, options.targetSkills, true);
  }

  return baseList;
}
