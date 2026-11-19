import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Source 101: Contributor Resources | OpenSourceMate",
  description:
    "Curated guides, tutorials, and best practices for first-time open source contributors: Git basics, opening pull requests, reading contributing guides, writing issue comments, and communicating with maintainers.",
  openGraph: {
    title: "Open Source 101: Essential Contributor Resources | OpenSourceMate",
    description:
      "A curated collection of essential open source guides covering Git basics, pull requests, contributing guides, and maintainer communication.",
    url: "https://open-source-mate-tawny.vercel.app/resources",
    siteName: "OpenSourceMate",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Source 101: Essential Contributor Resources | OpenSourceMate",
    description:
      "A curated collection of essential open source guides for developers and first-time contributors.",
  },
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
