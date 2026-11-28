# Internationalization (i18n): English & Hindi Interface

## Overview

Many students and developers in India and worldwide are starting out in open source. To make OpenSourceMate more approachable, the application features an internationalization (i18n) system supporting both English (`en`) and Hindi (`hi`), designed with extensible JSON translation dictionaries and zero-reload instant reactivity.

## Key Features & Acceptance Criteria

1. **Zero-Reload Language Switching**: Switching languages updates all visible text dynamically across the application without requiring a full page refresh.
2. **English Fallback**: If a key is missing or undefined in the active locale (e.g. `hi`), the system automatically resolves the key from the canonical English (`en`) dictionary before falling back to any default string or path.
3. **Preservation of Technical Terms**: Technical names such as programming languages ("Python", "TypeScript"), repository names (`owner/repo`), GitHub issue labels ("Good First Issue", "Help Wanted"), and open-source programs ("GSoC", "NSoC", "Hacktoberfest") remain untranslated to maintain developer clarity and tooling compatibility.
4. **Layout Resilience for Longer Scripts**: Hindi text often contains vowel signs and conjunct characters that occupy more horizontal space than English words. The UI utilizes CSS properties like `break-words`, `min-w-0`, and flexible grid/flex wrapping to prevent layout breakage or overflow across mobile and desktop viewport sizes.
5. **Preference Persistence**: User language preference is stored in browser `localStorage` under `preferred_locale` and automatically updates the root HTML attribute (`document.documentElement.lang`) for proper screen reader pronunciation and font rendering.

---

## Architecture & Directory Structure

```text
frontend/
├── messages/
│   ├── en.json               # Canonical English translation dictionary
│   └── hi.json               # Full Hindi translation dictionary
├── utils/
│   └── i18n.tsx              # React Context, Provider, useI18n hook, & fallback engine
├── components/
│   ├── LanguageSwitcher.tsx  # Accessible language selector dropdown
│   └── OfflineBanner.tsx     # Localized offline detection banner
└── __tests__/
    └── i18n.test.tsx         # Unit tests verifying fallback, persistence, & rendering
```

### 1. Translation Dictionaries (`frontend/messages/`)

Strings are grouped into namespaces for clean organization:

- `common`: Brand name, theme toggle labels, language options, and offline states.
- `nav`: Top navbar navigation links, skip link, and mobile drawer accessibility labels.
- `hero`: Tagline, title, subtitle, CTA buttons, and example prompt.
- `analyzer`: GitHub username input, button labels, loading states, and search history.
- `profile`: Profile analysis headings, link sharing, and technical skill descriptions.
- `recommendations`: Matched issues badge, filters (language, label, program), score sliders, and empty states.
- `howItWorks`: Three-step onboarding workflow descriptions.
- `footer`: Legal links, tour trigger, and copyright statements.

### 2. Context & Hook (`frontend/utils/i18n.tsx`)

The `useI18n()` hook exposes:
- `locale`: The currently active locale code (`"en" | "hi"`).
- `setLocale(newLocale)`: Switches locale, updates React state, saves to `localStorage`, and sets `document.documentElement.lang`.
- `t(path, fallbackOrParams?, params?)`: Resolves dot-delimited nested keys (e.g., `t("nav.analyzer")`), with parameter interpolation (e.g., `t("recommendations.showingCount", { filtered: 5, total: 10 })`).

---

## How to Add Another Language

Adding a new language (such as Spanish `es`, Tamil `ta`, or German `de`) is straightforward:

### Step 1: Create the Translation Dictionary
Create a new file in `frontend/messages/<locale>.json` (for example, `frontend/messages/es.json`) copying the structure of `frontend/messages/en.json`:

```json
{
  "common": {
    "brandName": "OpenSourceMate",
    "language": {
      "select": "Idioma",
      "en": "English",
      "hi": "हिन्दी",
      "es": "Español"
    }
  },
  "nav": {
    "analyzer": "Analizador",
    "howItWorks": "Cómo funciona"
  }
}
```

> [!NOTE]
> You do not need to translate every key immediately. Missing keys will automatically fall back to the English dictionary. Keep technical terms like "TypeScript", "Python", "Good First Issue", and "Help Wanted" untranslated.

### Step 2: Register the Locale in `frontend/utils/i18n.tsx`

1. Import the new JSON file:
   ```tsx
   import esMessages from "../messages/es.json";
   ```
2. Update the `Locale` union type:
   ```tsx
   export type Locale = "en" | "hi" | "es";
   ```
3. Add the dictionary to `messageRegistry`:
   ```tsx
   const messageRegistry: Record<Locale, any> = {
     en: enMessages,
     hi: hiMessages,
     es: esMessages,
   };
   ```

### Step 3: Add the Option to `frontend/components/LanguageSwitcher.tsx`

Add the new `<option>` to the language select element:

```tsx
<select
  id="language-select"
  value={locale}
  onChange={(e) => setLocale(e.target.value as Locale)}
  aria-label={t("common.language.select", "Language")}
  className="..."
>
  <option value="en">English</option>
  <option value="hi">हिन्दी</option>
  <option value="es">Español</option>
</select>
```

### Step 4: Verify with Automated Tests

Run the i18n test suite to verify that the new language loads correctly and falls back to English when keys are omitted:

```bash
npm --prefix frontend test -- --testPathPattern="i18n" --watchAll=false
```
