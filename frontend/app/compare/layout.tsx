import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Compare GitHub Profiles",
  description:
    "Compare two GitHub developer profiles side by side. Discover shared programming languages, unique competencies, repository distributions, and skill overlap with OpenSourceMate.",
  alternates: {
    canonical: "/compare",
  },
  openGraph: {
    title: "Compare GitHub Profiles | OpenSourceMate",
    description:
      "Compare two GitHub developer profiles side by side. Discover shared programming languages, unique competencies, and skill overlap.",
    url: "/compare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare GitHub Profiles | OpenSourceMate",
    description:
      "Compare two GitHub developer profiles side by side. Discover shared programming languages and skill overlap.",
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
