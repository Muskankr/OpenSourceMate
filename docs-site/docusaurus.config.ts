import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
  title: "OpenSourceMate Documentation",
  tagline: "Find open-source issues that fit your skills",
  // Set DOCS_SITE_URL in the eventual hosting environment. The fallback keeps
  // local development and CI builds deterministic until hosting is confirmed.
  url: process.env.DOCS_SITE_URL ?? "http://localhost:3000",
  baseUrl: "/",
  organizationName: "Muskankr",
  projectName: "OpenSourceMate",
  // Some existing links intentionally target repository files outside docs/.
  // Keep them as GitHub-readable Markdown links while reporting them in builds.
  onBrokenLinks: "warn",
  markdown: {
    format: "md",
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },
  trailingSlash: false,

  presets: [
    [
      "classic",
      {
        docs: {
          path: "../docs",
          routeBasePath: "docs",
          sidebarPath: "./sidebars.ts",
          showLastUpdateTime: false,
          showLastUpdateAuthor: false,
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      },
    ],
  ],

  themeConfig: {
    image: "img/opensource-mate-social-card.svg",
    navbar: {
      title: "OpenSourceMate",
      logo: {
        alt: "OpenSourceMate logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Documentation",
        },
        {
          href: "https://github.com/Muskankr/OpenSourceMate",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            { label: "Getting Started", to: "/docs/DEPLOYMENT" },
            { label: "Tutorials", to: "/docs/tutorials" },
            { label: "API Reference", to: "/docs/api-v1-and-openapi-docs" },
          ],
        },
        {
          title: "Project",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/Muskankr/OpenSourceMate",
            },
            {
              label: "Contributing",
              href: "https://github.com/Muskankr/OpenSourceMate/blob/main/CONTRIBUTING.md",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} OpenSourceMate contributors. MIT License.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },

  plugins: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
        docsDir: "../docs",
        language: ["en"],
      },
    ],
  ],
};

export default config;
