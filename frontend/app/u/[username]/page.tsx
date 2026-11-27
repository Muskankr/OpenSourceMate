import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Home from "../../page";

const USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const name = decodeURIComponent(username);
  if (!USERNAME_PATTERN.test(name)) {
    return {
      title: "User not found – OpenSourceMate",
      description: "User not found on OpenSourceMate.",
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: "User not found – OpenSourceMate",
        description: "User not found on OpenSourceMate.",
        siteName: "OpenSourceMate",
        images: [
          {
            url: "/opengraph-image",
            width: 1200,
            height: 630,
            alt: "OpenSourceMate – Find open-source issues that fit your skills",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "User not found – OpenSourceMate",
        description: "User not found on OpenSourceMate.",
        images: [
          {
            url: "/twitter-image",
            width: 1200,
            height: 630,
            alt: "OpenSourceMate – Find open-source issues that fit your skills",
          },
        ],
      },
    };
  }

  const title = `${name} on OpenSourceMate`;
  const description = `See the skills and matching open-source issues for @${name} on OpenSourceMate.`;
  const encodedName = encodeURIComponent(name);

  return {
    title,
    description,
    alternates: {
      canonical: `/u/${encodedName}`,
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      siteName: "OpenSourceMate",
      type: "profile",
      images: [
        {
          url: `/u/${encodedName}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${name}'s skill profile and matched issues on OpenSourceMate`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: `/u/${encodedName}/twitter-image`,
          width: 1200,
          height: 630,
          alt: `${name}'s skill profile and matched issues on OpenSourceMate`,
        },
      ],
    },
  };
}

export default async function SharedResult({ params }: Props) {
  const { username } = await params;
  if (!USERNAME_PATTERN.test(decodeURIComponent(username))) notFound();
  return <Home />;
}
