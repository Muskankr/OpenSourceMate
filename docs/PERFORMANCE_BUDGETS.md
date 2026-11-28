# Performance & Bundle Size Budgets

OpenSourceMate enforces automated performance checks in continuous integration (CI) to prevent regressions in user experience, load times, and bundle size.

---

## 1. JavaScript Bundle Size Budgets

To keep initial page loads fast and responsive on low-bandwidth and mobile devices, we enforce strict gzipped bundle size budgets on all frontend routes.

### Configuration (`frontend/bundle-budget.json`)

Budgets are configured in `frontend/bundle-budget.json`:

```json
{
  "budgets": [
    {
      "path": "/",
      "name": "Home / Analyzer page",
      "maxSizeKB": 350
    },
    {
      "path": "/compare",
      "name": "Compare page",
      "maxSizeKB": 250
    },
    {
      "path": "/privacy",
      "name": "Privacy page",
      "maxSizeKB": 150
    },
    {
      "path": "/contribute",
      "name": "Contribute page",
      "maxSizeKB": 150
    },
    {
      "path": "shared",
      "name": "Shared Framework Chunks",
      "maxSizeKB": 400
    }
  ]
}
```

### Running the Check Locally

After building the Next.js application, run:

```bash
cd frontend
npm run build
npm run check:bundle-budget
```

The script calculates both uncompressed and gzipped sizes of generated JavaScript chunks and outputs an aligned report. If any route exceeds its budget, the command exits with code 1.

---

## 2. Lighthouse CI Performance & Accessibility

[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) tests both the homepage (`/`) and results page (`/?user=octocat`) during continuous integration.

### Thresholds (`frontend/lighthouserc.json`)

- **Performance**: Minimum score `0.80` (80%)
- **Accessibility**: Minimum score `0.90` (90%)
- **Best Practices**: Minimum score `0.85` (85%)
- **SEO**: Minimum score `0.85` (85%)

### Running Lighthouse Locally

To audit pages locally:

```bash
cd frontend
npm run build
npx @lhci/cli autorun --config=lighthouserc.json
```

---

## 3. How to Update Budgets

When adding essential new features, libraries, or internationalization data that legitimately increase bundle weight or alter Lighthouse metrics:

1. **Verify Optimization First**:
   - Check if heavy dependencies can be dynamic imported (`React.lazy` or `next/dynamic`).
   - Check if smaller alternative packages exist (e.g. date-fns, native Web APIs).
   - Ensure unused code and tree-shaking are functioning.
2. **Discuss with Maintainers**:
   - For substantial changes, mention the bundle impact in your PR description.
3. **Update the Budget Configuration**:
   - Edit `frontend/bundle-budget.json` and adjust the corresponding `maxSizeKB` threshold.
   - If adjusting Lighthouse target scores, update `frontend/lighthouserc.json`.
4. **Document the Rationale in the PR**:
   - Include the `npm run check:bundle-budget` output before and after your changes.
