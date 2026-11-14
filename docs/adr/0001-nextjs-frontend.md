# ADR-0001: Use Next.js for the frontend

- Status: Accepted
- Date: 2026-11-14

## Context

OpenSourceMate needs a browser UI for profile analysis and recommendations, backed by reusable React components and typed API calls. The frontend is implemented in `frontend/` with the Next.js App Router, TypeScript, and React.

## Decision

Use Next.js as the frontend framework, with the App Router for application routes and layouts.

## Consequences

The UI, shared components, and route structure use one established framework and its build tooling. Frontend development and deployment require the Node.js toolchain, and API requests depend on the configured backend URL.
