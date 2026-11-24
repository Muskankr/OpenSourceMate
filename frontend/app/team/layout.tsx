import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Team Skill Matrix",
  description:
    "Analyze up to five GitHub profiles together. Discover shared technologies, complete team coverage, and single-expert competencies with OpenSourceMate.",
  alternates: {
    canonical: "/team",
  },
  openGraph: {
    title: "Team Skill Matrix | OpenSourceMate",
    description:
      "Analyze up to five GitHub profiles together. Discover shared technologies, complete team coverage, and single-expert competencies.",
    url: "/team",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Team Skill Matrix | OpenSourceMate",
    description:
      "Analyze up to five GitHub profiles together. Discover shared technologies and coverage overlap.",
  },
};

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
