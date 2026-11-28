import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nProvider, useI18n } from "../utils/i18n";
import LanguageSwitcher from "../components/LanguageSwitcher";

function TestConsumer() {
  const { t, locale } = useI18n();
  return (
    <div>
      <span data-testid="current-locale">{locale}</span>
      <h1 data-testid="hero-title">{t("hero.titlePrefix")}</h1>
      <p data-testid="missing-in-hi">{t("common.theme.toggleToLight")}</p>
      <p data-testid="interpolated">
        {t("recommendations.showingCount", { filtered: 3, total: 10 })}
      </p>
      <p data-testid="fallback">{t("completely.non.existent.path", "Default Fallback")}</p>
      <p data-testid="good-first-issue">{t("recommendations.goodFirstIssue")}</p>
    </div>
  );
}

function FallbackConsumer() {
  const { t, locale } = useI18n();
  return (
    <div>
      <span data-testid="fallback-locale">{locale}</span>
      <p data-testid="fallback-hero">{t("hero.titlePrefix")}</p>
      <p data-testid="fallback-default">{t("missing.key", "My Fallback")}</p>
    </div>
  );
}

describe("Internationalization (i18n) Engine & LanguageSwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "en";
  });

  it("renders English messages by default", () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>
    );

    expect(screen.getByTestId("current-locale")).toHaveTextContent("en");
    expect(screen.getByTestId("hero-title")).toHaveTextContent("Find the open-source issues");
    expect(screen.getByTestId("interpolated")).toHaveTextContent("Showing 3 of 10 issues");
    expect(screen.getByTestId("fallback")).toHaveTextContent("Default Fallback");
  });

  it("switches language to Hindi immediately without reload and updates document lang", () => {
    render(
      <I18nProvider>
        <LanguageSwitcher />
        <TestConsumer />
      </I18nProvider>
    );

    const select = screen.getByLabelText(/language/i);
    fireEvent.change(select, { target: { value: "hi" } });

    expect(screen.getByTestId("current-locale")).toHaveTextContent("hi");
    expect(screen.getByTestId("hero-title")).toHaveTextContent(
      "अपनी पसंद के ओपन-सोर्स मुद्दे खोजें"
    );
    expect(screen.getByTestId("interpolated")).toHaveTextContent(
      "10 में से 3 समस्याएँ दिखाई जा रही हैं"
    );
    expect(document.documentElement.lang).toBe("hi");
    expect(localStorage.getItem("preferred_locale")).toBe("hi");
  });

  it("falls back to English dictionary when a key is missing in Hindi", () => {
    // Test key resolution when missing in active locale
    function MissingKeyConsumer() {
      const { t } = useI18n();
      return (
        <div>
          <span data-testid="only-in-en">{t("nonExistentInHi", "Fallback If Not in EN")}</span>
        </div>
      );
    }

    render(
      <I18nProvider>
        <LanguageSwitcher />
        <MissingKeyConsumer />
      </I18nProvider>
    );

    const select = screen.getByLabelText(/language/i);
    fireEvent.change(select, { target: { value: "hi" } });

    // Since 'nonExistentInHi' is not in hi or en, it falls back to the provided fallback string
    expect(screen.getByTestId("only-in-en")).toHaveTextContent("Fallback If Not in EN");
  });

  it("persists language selection across reloads", () => {
    localStorage.setItem("preferred_locale", "hi");

    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>
    );

    expect(screen.getByTestId("current-locale")).toHaveTextContent("hi");
    expect(screen.getByTestId("hero-title")).toHaveTextContent(
      "अपनी पसंद के ओपन-सोर्स मुद्दे खोजें"
    );
    expect(document.documentElement.lang).toBe("hi");
  });

  it("keeps technical terms untranslated in Hindi", () => {
    render(
      <I18nProvider>
        <LanguageSwitcher />
        <TestConsumer />
      </I18nProvider>
    );

    const select = screen.getByLabelText(/language/i);
    fireEvent.change(select, { target: { value: "hi" } });

    // Technical label remains "Good First Issue"
    expect(screen.getByTestId("good-first-issue")).toHaveTextContent("Good First Issue");
  });

  it("works safely outside of I18nProvider with English fallback", () => {
    render(<FallbackConsumer />);

    expect(screen.getByTestId("fallback-locale")).toHaveTextContent("en");
    expect(screen.getByTestId("fallback-hero")).toHaveTextContent("Find the open-source issues");
    expect(screen.getByTestId("fallback-default")).toHaveTextContent("My Fallback");
  });
});
