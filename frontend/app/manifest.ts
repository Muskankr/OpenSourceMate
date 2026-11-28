import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpenSourceMate",
    short_name: "OpenSourceMate",
    description:
      "Discover open-source issues matched to your skills, explore contribution opportunities, and find your next project.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070d",
    theme_color: "#7c3aed",
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    categories: ["developer-tools", "productivity", "utilities"],
    shortcuts: [
      {
        name: "Compare Profiles",
        short_name: "Compare",
        description: "Compare two GitHub developer profiles side by side",
        url: "/compare",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
