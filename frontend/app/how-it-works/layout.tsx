import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "How It Works & FAQ | OpenSourceMate",
  description:
    "Learn how OpenSourceMate reads public GitHub data, detects skills, matches open-source issues, and handles your privacy and data storage.",
  alternates: {
    canonical: "/how-it-works",
  },
  openGraph: {
    title: "How It Works & FAQ | OpenSourceMate",
    description:
      "Understand how OpenSourceMate analyzes public GitHub data, extracts skills, scores issues, and protects your privacy.",
    url: "https://opensource-mate.vercel.app/how-it-works",
    siteName: "OpenSourceMate",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works & FAQ | OpenSourceMate",
    description:
      "Understand how OpenSourceMate analyzes public GitHub data, extracts skills, scores issues, and protects your privacy.",
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
