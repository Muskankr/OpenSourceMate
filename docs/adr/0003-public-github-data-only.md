# ADR-0003: Use public GitHub data for analysis

- Status: Accepted
- Date: 2026-11-14

## Context

OpenSourceMate analyzes developer profiles to identify skills and contribution opportunities. The backend retrieves profile and repository information and searches GitHub issues through the GitHub REST API.

## Decision

Limit GitHub-sourced profile and contribution analysis to publicly available profiles, repositories, and issues. An optional GitHub token may raise API rate limits; it does not make private repository data part of the analysis.

## Consequences

Analysis works without granting access to private repositories, but cannot include private work and may not represent a developer's complete experience. Requests remain subject to GitHub API availability and rate limits.
