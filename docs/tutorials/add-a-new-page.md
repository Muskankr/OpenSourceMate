
# Tutorial: Adding a New Frontend Page

This guide explains how to create and register a new frontend page in OpenSourceMate using Next.js App Router.

## 1. Prerequisites

Before creating a page, make sure you have:

- Node.js and npm installed.
- The OpenSourceMate repository cloned locally.
- Frontend dependencies installed.
- Basic knowledge of React, TypeScript, and JSX.

Navigate to the frontend directory:

```bash
cd frontend
npm install
```

## 2. Understand the Project Structure

OpenSourceMate uses Next.js App Router.

Frontend pages are located inside `frontend/app/`.

Relevant existing files:

```text
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── privacy/
│   │   └── page.tsx
│   └── compare/
│       └── page.tsx
├── components/
└── package.json
```

Each folder inside `app/` can represent a URL route when it contains a `page.tsx` file.

For example:

| File | URL |
|---|---|
| `app/page.tsx` | `/` |
| `app/privacy/page.tsx` | `/privacy` |
| `app/compare/page.tsx` | `/compare` |
| `app/about/page.tsx` | `/about` |

Next.js automatically registers these routes. No separate routing configuration is required.

## 3. Create a New Page

For this example, create an About page.

Create the following directory and file:

```bash
mkdir -p app/about
touch app/about/page.tsx
```

## 4. Implement the Page

Open `app/about/page.tsx` and add:

```tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about OpenSourceMate.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#05070d] text-white px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">
          About OpenSourceMate
        </h1>

        <p className="mt-6 text-gray-300 leading-relaxed">
          OpenSourceMate helps developers discover open-source
          contribution opportunities based on their technical skills.
        </p>

        <Link
          href="/"
          className="mt-8 inline-block text-purple-400 hover:underline"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
```

### Understanding the implementation

- `Metadata`: Defines page-specific title and description.
- `Link`: Provides client-side navigation between pages.
- `AboutPage`: The default React component rendered for this route.
- Tailwind CSS: Used for styling the page.

**Important:** Next.js pages are Server Components by default. Only add `"use client"` at the top when the page requires client-side features such as React state, event handlers, or browser APIs.

## 5. Add Navigation Links (If Required)

If users should access the new page through existing navigation, add a link using Next.js `Link`.

Example:

```tsx
import Link from "next/link";

<Link href="/about">
  About Us
</Link>
```

For example, the main navigation can be updated in `frontend/app/page.tsx` or in the relevant reusable navigation component.

Creating a page does not automatically add it to the navigation menu.

## 6. Run the Application

From the `frontend/` directory, run:

```bash
npm run dev
```

Open the following URL:

```text
http://localhost:3000/about
```

Verify that the About page loads correctly.

## 7. Build Verification

Run the production build:

```bash
npm run build
```

If the build succeeds, Next.js has successfully compiled the new page.

You can also run the frontend test suite:

```bash
npm test -- --runInBand
```

## 8. Common Mistakes

| Mistake | Solution |
|---|---|
| Creating a page outside `app/` | Place route files inside `frontend/app/`. |
| Missing `page.tsx` | Use the exact filename `page.tsx`. |
| Using `useState` without client mode | Add `"use client"` at the top. |
| Incorrect navigation path | Use the route generated from the folder structure. |
| Forgetting metadata | Export a `metadata` object when appropriate. |
| Page not accessible through navigation | Add a `Link` to the relevant navigation component. |

## 9. Completion Checklist

Before submitting your changes, verify:

- [ ] Created the page inside the correct `frontend/app/` directory.
- [ ] Used `page.tsx` as the filename.
- [ ] Implemented the page using React and TypeScript.
- [ ] Added appropriate page metadata.
- [ ] Used Next.js `Link` for internal navigation.
- [ ] Added navigation links if required.
- [ ] Verified the page in the browser.
- [ ] Ran `npm run build` successfully.
- [ ] Checked that existing frontend functionality remains unaffected.
