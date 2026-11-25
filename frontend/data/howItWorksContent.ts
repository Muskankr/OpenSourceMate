/**
 * How It Works & FAQ Content File
 *
 * Single source of truth for all explanatory copy, pipeline steps,
 * data storage disclosures, and frequently asked questions across OpenSourceMate.
 * Update this file to modify any textual explanations without changing UI component logic.
 */

export interface DataRetrievalPoint {
  title: string;
  description: string;
  included: boolean;
}

export interface PipelineStep {
  number: string;
  badge: string;
  title: string;
  summary: string;
  details: string[];
}

export interface StorageComparisonItem {
  item: string;
  stored: boolean;
  location: "Browser (localStorage)" | "Server Memory (TTLCache)" | "Never Stored";
  description: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "Data & Privacy" | "Skill Detection" | "Issue Matching" | "General";
}

export interface HealthSignalExplanation {
  badge: "Active" | "Slow" | "Inactive" | "Unknown";
  color: string;
  meaning: string;
  thresholds: string;
}

export interface HowItWorksContent {
  metadata: {
    pageTitle: string;
    pageSubtitle: string;
    leadParagraph: string;
    lastUpdated: string;
  };
  navigationSections: {
    id: string;
    title: string;
    shortLabel: string;
  }[];
  dataRetrieval: {
    heading: string;
    subheading: string;
    description: string;
    callout: string;
    publicDataPoints: DataRetrievalPoint[];
    privateDataPoints: DataRetrievalPoint[];
  };
  skillDetection: {
    heading: string;
    subheading: string;
    description: string;
    steps: PipelineStep[];
    forkExplanation: {
      title: string;
      description: string;
      badge: string;
    };
    proficiencyTiers: {
      name: string;
      criteria: string;
      description: string;
    }[];
  };
  issueMatching: {
    heading: string;
    subheading: string;
    description: string;
    scoringFactors: {
      name: string;
      weight: string;
      description: string;
    }[];
    healthSignals: HealthSignalExplanation[];
    bonusFeatures: {
      title: string;
      description: string;
    }[];
  };
  storageAndPrivacy: {
    heading: string;
    subheading: string;
    description: string;
    table: StorageComparisonItem[];
    takeaway: string;
  };
  faq: {
    heading: string;
    subheading: string;
    description: string;
    items: FAQItem[];
  };
}

export const HOW_IT_WORKS_CONTENT: HowItWorksContent = {
  metadata: {
    pageTitle: "How It Works & Privacy",
    pageSubtitle: "Transparent open-source analysis with zero secrets and zero persistent tracking.",
    leadParagraph:
      "OpenSourceMate was built to help developers find meaningful contribution opportunities without guessing. Here is an honest, plain-language explanation of what data we read, how your skill profile is calculated, how issues are ranked, and what stays strictly on your local device.",
    lastUpdated: "November 2026",
  },

  navigationSections: [
    { id: "public-data", title: "Public GitHub Data Only", shortLabel: "Data Read" },
    { id: "skill-detection", title: "Skill Detection Pipeline", shortLabel: "Skills" },
    { id: "issue-matching", title: "Issue Matching & Ranking", shortLabel: "Matching" },
    { id: "storage-privacy", title: "What Is Stored vs. Not", shortLabel: "Storage & Privacy" },
    { id: "faq", title: "Frequently Asked Questions", shortLabel: "FAQ" },
  ],

  dataRetrieval: {
    heading: "01. Public GitHub Data Only",
    subheading: "Zero login required. We only inspect what is already publicly visible on GitHub.",
    description:
      "When you enter a GitHub username, OpenSourceMate calls GitHub's public REST API v3. We never ask for an OAuth login, we never request read/write access to your account, and we cannot see anything that isn't publicly visible to anyone on the web.",
    callout:
      "No account creation, no password, and zero access to private repositories — guaranteed.",
    publicDataPoints: [
      {
        title: "Public User Profile",
        description:
          "Public username, display name, public bio, avatar URL, follower and following counts, and account creation date.",
        included: true,
      },
      {
        title: "Public Repositories",
        description:
          "Names, descriptions, primary languages, star counts, fork flags, and open issue counts from repositories you own or contribute to publicly.",
        included: true,
      },
      {
        title: "Language Byte Breakdowns",
        description:
          "The byte breakdown returned by GitHub for your top public repositories, used to calculate proportional language familiarity.",
        included: true,
      },
      {
        title: "Manifest Dependencies",
        description:
          "Public dependency manifests (such as package.json, requirements.txt, or pyproject.toml) from your most active repositories to detect frameworks like React, FastAPI, or Django.",
        included: true,
      },
      {
        title: "Repository Topics",
        description:
          "Community tags and topics attached to your public repositories (e.g. 'machine-learning', 'cli', 'tailwind').",
        included: true,
      },
    ],
    privateDataPoints: [
      {
        title: "Private Repositories & Commits",
        description:
          "Private repositories and unauthenticated organizations are completely invisible. Our API calls have zero permissions to access them.",
        included: false,
      },
      {
        title: "OAuth Account Authorizations",
        description:
          "We do not request OAuth access tokens to act on your behalf or inspect personal settings.",
        included: false,
      },
      {
        title: "Private Email Addresses & Billing",
        description:
          "Private contact information, billing records, and personal SSH/GPG keys are never queried or seen.",
        included: false,
      },
      {
        title: "Organization Internal Data",
        description:
          "Internal or private organizational discussions, draft PRs, and secret repos remain 100% private.",
        included: false,
      },
    ],
  },

  skillDetection: {
    heading: "02. How Skills Are Detected",
    subheading: "A multi-stage deterministic pipeline that cleans noise and weights real experience.",
    description:
      "We avoid hype and black-box claims. Instead, OpenSourceMate uses clean, transparent heuristics to map your public GitHub history into actionable skills:",
    steps: [
      {
        number: "Step 1",
        badge: "Ingestion",
        title: "Language & Manifest Aggregation",
        summary: "Read language bytes and top active repository manifests.",
        details: [
          "Queries language distributions across your public non-fork and active repositories.",
          "Samples dependency files (package.json, pyproject.toml, requirements.txt) from your top active repositories.",
          "Consolidates package names (e.g., 'fastapi', 'next', 'torch') into recognized framework competencies.",
        ],
      },
      {
        number: "Step 2",
        badge: "Filtering",
        title: "Noise Reduction & Normalization",
        summary: "Strip build artifacts and non-indicative languages.",
        details: [
          "Filters out non-language noise files such as Dockerfiles, Makefiles, Postman collections, and Jupyter Notebook formatting bytes.",
          "Merges language variants into unified skill ecosystems (e.g., TypeScript and JavaScript cross-correlation).",
          "Normalizes raw byte counts so a single massive repository doesn't completely drown out regular development in other stacks.",
        ],
      },
      {
        number: "Step 3",
        badge: "Verification",
        title: "Fork-Aware Commit Detection",
        summary: "Distinguish between pure upstream clones and actual code contributions.",
        details: [
          "Pure forks (where no new commits were authored by the user) are ignored by default to prevent inflating skills with third-party code.",
          "Forks with personal commits (verified via pushed dates and authorship) are included at a balanced 0.5x weight.",
          "Users can toggle 'Include all forks' at any time in the analyzer if they prefer the unweighted view.",
        ],
      },
      {
        number: "Step 4",
        badge: "Categorization",
        title: "Proficiency Tier Assignment",
        summary: "Assign transparent tiers based on repository breadth and recency.",
        details: [
          "Assigns simple, intuitive proficiency tiers (Learning, Comfortable, Strong) based on how many repositories you have actively used each technology in.",
          "Recency weighting prioritizes technologies you worked with recently over tools last touched years ago.",
        ],
      },
    ],
    forkExplanation: {
      badge: "Fork-Aware",
      title: "Why We Filter Pure Forks",
      description:
        "Forking a massive Go repository like Kubernetes does not mean a developer knows Go. By default, pure forks without personal commits are excluded, and OpenSourceMate verifies whether you actually authored commits on a fork before counting its languages toward your skills.",
    },
    proficiencyTiers: [
      {
        name: "Learning",
        criteria: "1 Repository",
        description: "Early experimentation or tutorial projects in this technology.",
      },
      {
        name: "Comfortable",
        criteria: "2 to 4 Repositories",
        description: "Proven familiarity through multiple working projects or contributions.",
      },
      {
        name: "Strong",
        criteria: "5+ Repositories & Recent Activity",
        description: "Substantial, repeated experience across diverse codebases.",
      },
    ],
  },

  issueMatching: {
    heading: "03. How Issues Are Matched",
    subheading: "Connecting your stack with responsive, welcoming open-source repositories.",
    description:
      "A matched issue is only helpful if the project is actually active and welcoming to newcomers. OpenSourceMate uses a multi-factor ranking algorithm that weights skill alignment, repository health, and contributor friendliness:",
    scoringFactors: [
      {
        name: "Skill & Language Overlap",
        weight: "Highest Weight (40%)",
        description:
          "Calculates semantic and keyword overlap between your detected languages/frameworks and the issue tags, title, and repository stack.",
      },
      {
        name: "Beginner-Friendly Labels",
        weight: "Bonus Weight (20%)",
        description:
          "Prioritizes issues explicitly labeled by maintainers as 'good first issue', 'help wanted', 'beginner-friendly', or 'up-for-grabs'.",
      },
      {
        name: "Repository Health & Maintainer Signals",
        weight: "Health Weight (20%)",
        description:
          "Checks days since the last commit, recent PR merge rates, and average maintainer response times. Stale repositories receive score penalties.",
      },
      {
        name: "Community Standards & Guidelines",
        weight: "Guideline Bonus (10%)",
        description:
          "Detects presence of CONTRIBUTING.md, CODE_OF_CONDUCT.md, license files, and CLA/DCO requirements so you know expectations upfront.",
      },
      {
        name: "Issue Freshness & Low Discussion Noise",
        weight: "Freshness Weight (10%)",
        description:
          "Surfaces open issues that are not already congested with dozens of competing comments or unresolved debates.",
      },
    ],
    healthSignals: [
      {
        badge: "Active",
        color: "emerald",
        meaning: "Maintainers actively review and merge pull requests.",
        thresholds: "Commit in the last 30 days, recent PR merge rate ≥ 50%, median first response ≤ 3 days.",
      },
      {
        badge: "Slow",
        color: "amber",
        meaning: "Maintainers respond occasionally, but reviews take longer.",
        thresholds: "Commit in the last 90 days, PR merge rate between 20% and 50%, median response up to 14 days.",
      },
      {
        badge: "Inactive",
        color: "rose",
        meaning: "Repository has seen minimal activity in recent months.",
        thresholds: "No commits for >90 days, very low PR merge rate, or stale unanswered issues.",
      },
      {
        badge: "Unknown",
        color: "slate",
        meaning: "Insufficient recent PRs/issues to compute a reliable health signal.",
        thresholds: "Fewer than 5 recent issues or PRs sampled.",
      },
    ],
    bonusFeatures: [
      {
        title: "Contributor Programs",
        description:
          "Filter issues affiliated with initiatives like Google Summer of Code (GSoC), Hacktoberfest, and Outreachy.",
      },
      {
        title: "'I want to learn' Mode",
        description:
          "Select a language or framework you want to explore, and get beginner stretch issues ranked by maintainer support rather than existing skill overlap.",
      },
      {
        title: "Custom Preferences",
        description:
          "Filter by preferred languages, exclude specific organizations, limit maximum issue age, and set your available time commitment (quick, weekend, ongoing).",
      },
    ],
  },

  storageAndPrivacy: {
    heading: "04. What Is Stored vs. What Is Not",
    subheading: "Zero persistent database. Transparent local storage that stays on your device.",
    description:
      "We believe you shouldn't have to surrender your privacy to explore open source. Here is our complete matrix of what is stored, where it lives, and how long it lasts:",
    table: [
      {
        item: "Recent Searches",
        stored: true,
        location: "Browser (localStorage)",
        description:
          "Stored locally on your device so you don't have to retype usernames. Can be cleared in one click using the 'Clear' button.",
      },
      {
        item: "Saved Bookmarks & Private Notes",
        stored: true,
        location: "Browser (localStorage)",
        description:
          "Issues you save along with your personal notes and status ('Interested', 'Working on it', 'Done'). Kept in your browser; never sent to a server.",
      },
      {
        item: "Theme & Display Preferences",
        stored: true,
        location: "Browser (localStorage)",
        description:
          "Your preference for Dark Mode, Light Mode, or System theme.",
      },
      {
        item: "Filter & Excluded Organization Settings",
        stored: true,
        location: "Browser (localStorage)",
        description:
          "Your chosen language filters, excluded orgs, and time availability preferences.",
      },
      {
        item: "Temporary GitHub API Response Cache",
        stored: true,
        location: "Server Memory (TTLCache)",
        description:
          "Responses from GitHub's public API are held in server RAM for up to 300 seconds (5 minutes) purely to avoid hitting rate limits. Automatically deleted upon expiration.",
      },
      {
        item: "User Accounts, Passwords & Credentials",
        stored: false,
        location: "Never Stored",
        description:
          "We do not have a sign-up form, user database, passwords, or authentication tokens.",
      },
      {
        item: "Persistent Database Records",
        stored: false,
        location: "Never Stored",
        description:
          "There is no SQL database, MongoDB, or external cloud storage archiving developer profiles.",
      },
      {
        item: "Private Repositories or Private Code",
        stored: false,
        location: "Never Stored",
        description:
          "We cannot view private code and never store any private code under any circumstance.",
      },
      {
        item: "Tracking Pixels, Ad Networks & Data Brokers",
        stored: false,
        location: "Never Stored",
        description:
          "We do not sell data, run advertisements, or use invasive third-party telemetry.",
      },
    ],
    takeaway:
      "You have full control. Clear your browser cache or click 'Clear' at any time to remove every trace of your activity from your computer.",
  },

  faq: {
    heading: "05. Frequently Asked Questions",
    subheading: "Clear answers to the most common questions about OpenSourceMate.",
    description:
      "Have a question that isn't answered here? Check out our GitHub issues or open a discussion.",
    items: [
      {
        id: "faq-data-read",
        category: "Data & Privacy",
        question: "What data does OpenSourceMate access from my GitHub?",
        answer:
          "Only public GitHub data: your public profile metadata (username, display name, public bio, avatar, and follower counts), public repositories, and their language byte statistics. For active public repositories, it also reads public dependency manifest files (e.g. package.json, requirements.txt, or pyproject.toml) to identify frameworks.",
      },
      {
        id: "faq-login",
        category: "Data & Privacy",
        question: "Do I need to sign up or connect my GitHub account?",
        answer:
          "No. There is no sign-up, no login, and no OAuth authorization. You simply enter any public GitHub username to analyze publicly available data.",
      },
      {
        id: "faq-private-repos",
        category: "Data & Privacy",
        question: "Can OpenSourceMate access my private repositories or private commits?",
        answer:
          "No. OpenSourceMate queries GitHub's public REST API endpoints without OAuth user access tokens. It cannot see, read, or analyze private repositories, internal organizations, private gists, or private commits.",
      },
      {
        id: "faq-forks",
        category: "Skill Detection",
        question: "Why are some forked repositories excluded from my skills?",
        answer:
          "Forking a repository does not inherently demonstrate experience in that codebase. To give an accurate picture of your skills, OpenSourceMate skips pure unedited forks by default. If you have authored commits on a fork, it is counted at a balanced weight (0.5x). You can toggle 'Include all forks' on the analyzer if you want to include all forks.",
      },
      {
        id: "faq-skill-calculation",
        category: "Skill Detection",
        question: "How are my skills and proficiency percentages calculated?",
        answer:
          "Primary languages and language byte distributions are aggregated across your public non-fork and active repositories. Manifest dependencies and repository topics are mapped to known frameworks. These frequencies are normalized to produce percentage breakdowns and intuitive experience tiers (Learning, Comfortable, Strong).",
      },
      {
        id: "faq-issue-ranking",
        category: "Issue Matching",
        question: "How are open-source issues matched and ranked for me?",
        answer:
          "Issues are scored based on a multi-factor formula: skill overlap with the repository stack (40%), beginner-friendly labels like 'good first issue' (20%), repository health and maintainer responsiveness (20%), community guidelines like CONTRIBUTING.md (10%), and issue recency (10%). Maintainer health is indicated by Active, Slow, or Inactive badges.",
      },
      {
        id: "faq-learn-mode",
        category: "Issue Matching",
        question: "What is 'I want to learn' mode?",
        answer:
          "If you want to use open source to learn a new programming language or framework, you can select 'I want to learn' in the analyzer. The algorithm will prioritize beginner-friendly issues in that technology with active, supportive maintainers rather than matching your existing stack.",
      },
      {
        id: "faq-server-storage",
        category: "Data & Privacy",
        question: "Is any profile data stored on your servers?",
        answer:
          "No persistent database exists. GitHub API responses are temporarily cached in server memory (TTLCache) for up to 5 minutes strictly to conserve GitHub rate limits and speed up repeat queries. After 5 minutes, the cache expires and data is completely evicted.",
      },
      {
        id: "faq-saved-issues",
        category: "General",
        question: "Where are my saved issues and bookmarks stored?",
        answer:
          "Saved issues, notes, and status labels are saved exclusively in your browser's localStorage. They never leave your device, survive page reloads, and can be exported as JSON or cleared at any time.",
      },
      {
        id: "faq-rate-limits",
        category: "General",
        question: "What happens if GitHub rate limits are reached?",
        answer:
          "Unauthenticated GitHub API calls are limited by GitHub to 60 requests per hour per IP. OpenSourceMate uses server-side caching, ETag conditional headers, and rate-limit mitigation to minimize calls. If rate limits are exceeded, a banner will explain the cooldown time.",
      },
      {
        id: "faq-free-opensource",
        category: "General",
        question: "Is OpenSourceMate free and open source?",
        answer:
          "Yes! OpenSourceMate is 100% free and open source under the MIT License. You can inspect the entire frontend and backend source code, run it locally with Docker, or contribute improvements on GitHub.",
      },
    ],
  },
};
