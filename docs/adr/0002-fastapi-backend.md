# ADR-0002: Use FastAPI for the backend

- Status: Accepted
- Date: 2026-11-14

## Context

The frontend needs a Python REST API for GitHub profile data, skill analysis, and issue recommendations. The existing backend uses asynchronous routes and HTTP requests, Pydantic schemas, and generated OpenAPI documentation.

## Decision

Use FastAPI for the backend. The backend is FastAPI, not Django.

## Consequences

Async endpoints and Pydantic validation fit the existing service and API structure, and OpenAPI documentation is generated from the routes and schemas. The project does not use Django's integrated ORM or admin; adopting Django would require a deliberate architectural change.
