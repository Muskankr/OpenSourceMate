import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contribute to OpenSourceMate | Good First Issues",
  description:
    "Explore open beginner-friendly good-first-issues and contribute to OpenSourceMate. Find frontend, backend, and documentation issues ready for contributors.",
  openGraph: {
    title: "Contribute to OpenSourceMate | Good First Issues",
    description:
      "Explore open beginner-friendly good-first-issues and contribute to OpenSourceMate.",
    url: "https://opensource-mate.vercel.app/contribute",
    siteName: "OpenSourceMate",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contribute to OpenSourceMate | Good First Issues",
    description:
      "Explore open beginner-friendly good-first-issues and contribute to OpenSourceMate.",
  },
};

export default function ContributeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
