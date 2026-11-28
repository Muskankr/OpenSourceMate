import { ImageResponse } from "next/og";
import { validateGitHubUsername } from "@/utils/validation";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export const alt = "OpenSourceMate – Developer Profile & Matched Open-Source Issues";

interface Props {
  params: Promise<{ username: string }>;
}

/**
 * Escapes characters for safe rendering in social cards and prevents layout breaking.
 */
export function escapeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Fallback banner matching OpenSourceMate branding for unknown, rate-limited, or invalid users.
 */
export function FallbackBanner({ reason }: { reason?: string }) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#05070d",
        backgroundImage:
          "radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(147, 51, 234, 0.15) 2%, transparent 0%)",
        backgroundSize: "100px 100px",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "60px 80px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(147, 51, 234, 0.35) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          left: "-100px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: "960px",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 24px",
            borderRadius: "9999px",
            backgroundColor: "rgba(147, 51, 234, 0.15)",
            border: "1px solid rgba(147, 51, 234, 0.3)",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#a855f7",
            }}
          />
          <span
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#d8b4fe",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            OpenSourceMate
          </span>
        </div>
        <h1
          style={{
            fontSize: "60px",
            fontWeight: 800,
            lineHeight: 1.15,
            margin: 0,
            marginBottom: "20px",
            background: "linear-gradient(to right, #ffffff, #e2e8f0, #c084fc)",
            backgroundClip: "text",
            color: "transparent",
            textAlign: "center",
          }}
        >
          Find Open-Source Issues That Fit Your Skills
        </h1>
        <p
          style={{
            fontSize: "24px",
            lineHeight: 1.4,
            color: "#94a3b8",
            margin: 0,
            marginBottom: "36px",
            textAlign: "center",
          }}
        >
          {reason
            ? escapeText(reason)
            : "Analyze your GitHub profile, uncover programming strengths, and discover curated contribution opportunities."}
        </p>
        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {["Developer Analysis", "Issue Matcher", "Profile Comparison"].map((pill) => (
            <div
              key={pill}
              style={{
                padding: "8px 20px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: "18px",
                color: "#cbd5e1",
                fontWeight: 500,
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Fetches cached user skills and profile for OG image generation.
 * Strictly uses cached data (never forces refresh), avoiding rate limit exhaustion.
 */
async function getCachedUserData(username: string): Promise<{
  profile: { name?: string; login?: string; avatar_url?: string } | null;
  skills: string[];
  status: "ok" | "not_found" | "rate_limited" | "error";
}> {
  const apiBase =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";

  try {
    const clean = encodeURIComponent(username);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    // Call skills endpoint using standard Next.js revalidation cache (3600s)
    const skillsRes = await fetch(`${apiBase}/api/github/users/${clean}/skills`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    }).catch(() => null);

    clearTimeout(timeout);

    if (!skillsRes) {
      return { profile: null, skills: [], status: "error" };
    }

    if (skillsRes.status === 404) {
      return { profile: null, skills: [], status: "not_found" };
    }
    if (skillsRes.status === 429) {
      return { profile: null, skills: [], status: "rate_limited" };
    }
    if (!skillsRes.ok) {
      return { profile: null, skills: [], status: "error" };
    }

    const data = await skillsRes.json();
    let extractedSkills: string[] = [];
    if (Array.isArray(data.skills)) {
      extractedSkills = data.skills
        .map((s: string | { name?: string; skill?: string }) => {
          if (typeof s === "string") return s;
          return s.name || s.skill || "";
        })
        .filter(Boolean);
    } else if (data.top_skills && Array.isArray(data.top_skills)) {
      extractedSkills = data.top_skills;
    }

    return {
      profile: {
        login: data.login || username,
        name: data.name,
        avatar_url: data.avatar_url,
      },
      skills: extractedSkills,
      status: "ok",
    };
  } catch {
    return { profile: null, skills: [], status: "error" };
  }
}

export default async function UserOpenGraphImage({ params }: Props) {
  const resolvedParams = await params;
  const rawUsername = resolvedParams?.username || "";
  const decoded = decodeURIComponent(rawUsername);
  const validation = validateGitHubUsername(decoded);

  const cacheHeaders = {
    "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
  };

  // If username is invalid according to GitHub format rules, return fallback banner
  if (!validation.isValid) {
    return new ImageResponse(<FallbackBanner />, {
      ...size,
      headers: cacheHeaders,
    });
  }

  const cleanUsername = validation.cleanUsername;
  const userData = await getCachedUserData(cleanUsername);

  // Fallback for unknown, rate-limited, or failed fetches
  if (userData.status === "not_found" || userData.status === "rate_limited" || userData.status === "error") {
    return new ImageResponse(<FallbackBanner />, {
      ...size,
      headers: cacheHeaders,
    });
  }

  const initial = cleanUsername.charAt(0).toUpperCase() || "O";
  const displayUsername = `@${cleanUsername}`;
  const topSkills = userData.skills.slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#05070d",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(147, 51, 234, 0.15) 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "60px 80px",
          position: "relative",
        }}
      >
        {/* Glow Effects */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(147, 51, 234, 0.35) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Top Header: Brand Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 24px",
              borderRadius: "9999px",
              backgroundColor: "rgba(147, 51, 234, 0.15)",
              border: "1px solid rgba(147, 51, 234, 0.3)",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#a855f7",
              }}
            />
            <span
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#d8b4fe",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              OpenSourceMate
            </span>
          </div>

          <div
            style={{
              fontSize: "18px",
              color: "#94a3b8",
              fontWeight: 500,
              padding: "6px 16px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            Developer Skill Profile
          </div>
        </div>

        {/* Center Section: Avatar Initial + Username */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            zIndex: 10,
            marginTop: "10px",
            marginBottom: "10px",
          }}
        >
          {/* Avatar initial circle */}
          <div
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "55px",
              background: "linear-gradient(135deg, #9333ea, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
              boxShadow: "0 10px 25px -5px rgba(147, 51, 234, 0.5)",
              border: "3px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <span
              style={{
                fontSize: "52px",
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1,
              }}
            >
              {initial}
            </span>
          </div>

          {/* Username */}
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.15,
              margin: 0,
              marginBottom: "8px",
              background: "linear-gradient(to right, #ffffff, #e2e8f0, #c084fc)",
              backgroundClip: "text",
              color: "transparent",
              textAlign: "center",
              maxWidth: "900px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {escapeText(displayUsername)}
          </h1>

          <p
            style={{
              fontSize: "22px",
              lineHeight: 1.4,
              color: "#94a3b8",
              margin: 0,
              textAlign: "center",
            }}
          >
            Open-source issue recommendations matched to technical skills
          </p>
        </div>

        {/* Bottom Section: Top 3 Skills or default pills */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#a855f7",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "14px",
            }}
          >
            {topSkills.length > 0 ? "Top Analyzed Skills" : "Explore Contribution Opportunities"}
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {(topSkills.length > 0 ? topSkills : ["JavaScript", "Python", "TypeScript"]).map(
              (skill) => (
                <div
                  key={skill}
                  style={{
                    padding: "12px 28px",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(147, 51, 234, 0.18)",
                    border: "1.5px solid rgba(168, 85, 247, 0.4)",
                    fontSize: "22px",
                    color: "#f1f5f9",
                    fontWeight: 600,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {escapeText(skill)}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: cacheHeaders,
    }
  );
}
