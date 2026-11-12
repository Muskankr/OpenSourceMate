# Tutorial: Add a Frontend Component with a Test

This tutorial explains how to create a reusable React component in OpenSourceMate and write a corresponding test using Jest and React Testing Library.

It follows the existing frontend project structure and testing conventions.

## 1. Understand the frontend structure

The frontend uses Next.js App Router, React, and TypeScript.

The relevant directories and files are:

| Path | Purpose |
|---|---|
| `frontend/components/` | Reusable React components |
| `frontend/components/ui/` | Shared UI primitives |
| `frontend/__tests__/` | Frontend component and application tests |
| `frontend/jest.config.mjs` | Jest configuration |
| `frontend/jest.setup.ts` | Test environment setup |
| `frontend/package.json` | Frontend dependencies and scripts |

Before creating a component, inspect existing examples:

```text
frontend/components/BackToTopButton.tsx
frontend/__tests__/BackToTopButton.test.tsx
```

These demonstrate the project's component and test conventions.

## 2. Understand the existing component pattern

The existing `BackToTopButton.tsx` demonstrates several useful practices:

- TypeScript interfaces for component props.
- Default values for optional props.
- React state and effects for interactive behavior.
- Accessible button labels.
- Cleanup of event listeners when the component unmounts.

It starts with:

```tsx
"use client";

import React, { useState, useEffect } from "react";
```

The `"use client"` directive is necessary for components that use client-side React hooks and browser interactions.

A component that does not use client-side hooks or browser APIs may not need this directive.

## 3. Create a new component

For this tutorial, create a simple reusable `WelcomeBanner` component.

Navigate to the frontend directory:

```bash
cd frontend
```

Create:

```text
components/WelcomeBanner.tsx
```

Add the following code:

```tsx
import React from "react";

export interface WelcomeBannerProps {
  title: string;
  message: string;
}

export default function WelcomeBanner({
  title,
  message,
}: WelcomeBannerProps) {
  return (
    <section
      aria-labelledby="welcome-title"
      className="rounded-xl border border-slate-700 bg-slate-900 p-6"
    >
      <h2
        id="welcome-title"
        className="text-xl font-semibold text-white"
      >
        {title}
      </h2>

      <p className="mt-2 text-slate-300">
        {message}
      </p>
    </section>
  );
}
```

The component accepts two required props:

- `title`: The heading displayed in the banner.
- `message`: The supporting message.

Using an interface makes the component's expected properties explicit and allows TypeScript to catch incorrect usage.

The `aria-labelledby` attribute associates the section with its heading, improving accessibility.

## 4. Create a component test

Open the frontend test directory:

```text
frontend/__tests__/
```

Create:

```text
frontend/__tests__/WelcomeBanner.test.tsx
```

Add the following test:

```tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import WelcomeBanner from "../components/WelcomeBanner";

describe("WelcomeBanner Component", () => {
  it("renders the supplied title", () => {
    render(
      <WelcomeBanner
        title="Welcome to OpenSourceMate"
        message="Explore open-source opportunities."
      />
    );

    expect(
      screen.getByRole("heading", {
        name: "Welcome to OpenSourceMate",
      })
    ).toBeInTheDocument();
  });

  it("renders the supplied message", () => {
    render(
      <WelcomeBanner
        title="Welcome"
        message="Explore open-source opportunities."
      />
    );

    expect(
      screen.getByText("Explore open-source opportunities.")
    ).toBeInTheDocument();
  });

  it("associates the section with its heading", () => {
    render(
      <WelcomeBanner
        title="Welcome"
        message="Start contributing today."
      />
    );

    expect(
      screen.getByRole("region", { name: "Welcome" })
    ).toBeInTheDocument();
  });
});
```

The test uses:

- `render()` to render the React component.
- `screen.getByRole()` to find elements using their accessible roles and names.
- `screen.getByText()` to locate displayed text.
- `toBeInTheDocument()` to check that elements are rendered.

These match the existing React Testing Library conventions in the repository.

## 5. Understand the Jest configuration

Open:

```text
frontend/jest.config.mjs
```

The repository uses `next/jest` to configure Jest for Next.js.

Important configuration options include:

```ts
const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
```

Their purposes are:

- `coverageProvider`: Uses V8 for code coverage.
- `testEnvironment`: Uses jsdom to provide a browser-like environment.
- `setupFilesAfterEnv`: Loads the shared test setup after Jest initializes.
- `moduleNameMapper`: Resolves imports that use the `@/` alias.

The `frontend/jest.setup.ts` file imports:

```ts
import "@testing-library/jest-dom";
```

This enables DOM-specific matchers such as `toBeInTheDocument()` and `toHaveAttribute()`.

You normally do not need to modify Jest configuration when adding a regular component test.

## 6. Run the component test

From the frontend directory, run:

```bash
npm test -- --runInBand __tests__/WelcomeBanner.test.tsx
```

The `--runInBand` option runs Jest tests serially in the current process.

A successful run should show that all three tests pass.

To run the complete frontend test suite:

```bash
npm test -- --runInBand
```

To run ESLint:

```bash
npm run lint
```

## 7. Common mistakes

**Forgetting the correct file extension**

Use `.tsx` for TypeScript files containing JSX.

**Incorrect component import path**

The test imports the component from:

```tsx
import WelcomeBanner from "../components/WelcomeBanner";
```

Check relative paths when creating tests.

**Using browser APIs in a Server Component**

Components that use browser APIs, React hooks, or client-side event handlers need the `"use client"` directive.

**Missing accessibility attributes**

Prefer semantic HTML elements and accessible labels. Tests should query elements by role and accessible name where possible.

**Forgetting test setup**

The shared `jest.setup.ts` file loads `@testing-library/jest-dom`. Do not remove this setup when adding tests.

**Changing Jest configuration unnecessarily**

A normal React component test should use the existing configuration. Avoid changing global test settings unless the new functionality genuinely requires it.

## 8. Completion checklist

- [ ] Created the component inside `frontend/components/`.
- [ ] Used TypeScript and defined appropriate component props.
- [ ] Followed existing component conventions.
- [ ] Added accessibility attributes where appropriate.
- [ ] Created the test inside `frontend/__tests__/`.
- [ ] Used React Testing Library for rendering and assertions.
- [ ] Ran the individual component test.
- [ ] Confirmed that the tests pass.
- [ ] Avoided unnecessary changes to Jest configuration or unrelated application files.

The component contribution is complete when the component follows the existing frontend conventions and its tests verify the expected rendered behavior.