# Embeddable SVG Skill Badge

OpenSourceMate provides dynamic, embeddable SVG skill badges designed for developer profile READMEs on GitHub and GitLab.

The badge queries the user's analyzed skill profile, extracts their top 3 languages/technologies, and renders a compact, high-contrast SVG badge that updates automatically.

---

## 1. Badge Endpoints

The badge is accessible over HTTP GET via:

```http
GET /api/badge/{username}.svg
GET /api/badge/{username}
GET /api/v1/badge/{username}.svg
GET /api/v1/badge/{username}
```

### URL Parameters & Query Strings

- `username` _(path, required)_: Public GitHub username (1–39 alphanumeric chars or single hyphens).
- `theme` _(query, optional)_: Color theme. Options: `dark` (default), `light`.
- `refresh` _(query, optional)_: Set to `true` to bypass in-memory caching and fetch fresh profile analysis.

---

## 2. Markdown Embed Snippet

To embed the badge on your GitHub profile README:

```markdown
[![OpenSourceMate Skills](https://opensourcemate.org/api/badge/<USERNAME>.svg)](https://opensourcemate.org/?user=<USERNAME>)
```

Replace `<USERNAME>` with your GitHub handle.

### Example Preview

For user `octocat` with skills **TypeScript**, **Python**, and **Go**:

```markdown
[![OpenSourceMate Skills](https://opensourcemate.org/api/badge/octocat.svg)](https://opensourcemate.org/?user=octocat)
```

The badge displays:

- OpenSourceMate brand pill with a vibrant purple highlight (`#7c3aed`).
- Up to 3 top skills separated by dots (`•`).
- Clean SVG typography using standard system font stacks (`Segoe UI`, `SF Pro`, `Inter`, `Roboto`, `Helvetica Neue`, sans-serif).

---

## 3. Reliability, Neutral Fallbacks & GitHub Camo Proxy

GitHub proxies external README images through **GitHub Camo** (`camo.githubusercontent.com`).

To prevent Camo from caching broken image placeholders or failing under API limits:

1. **Never returns broken images**: If a profile is private, has no public repositories, encounters upstream GitHub rate limits (HTTP 429), or is not found (404), the endpoint responds with **HTTP 200** and a graceful neutral fallback SVG badge (e.g. `skills: none detected` or `skills: unavailable`).
2. **Strict Sanitization & XML Escaping**: All dynamic strings (username, skill names) are strictly escaped with `html.escape(..., quote=True)` to prevent SVG/XML injection and XSS vulnerabilities.
3. **Optimized Caching Headers**:
   - Successful profiles: `Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400`
   - Temporary errors / rate-limits: `Cache-Control: public, max-age=300, s-maxage=300`
   - `Content-Type: image/svg+xml; charset=utf-8`

---

## 4. Copy Badge in UI

On the OpenSourceMate results page, a dedicated **Copy badge Markdown** button is available in the action bar next to "Copy link" and "Export".

Clicking this button copies the markdown snippet directly to the contributor's clipboard with instant visual confirmation ("Badge copied!").
