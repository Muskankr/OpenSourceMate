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
      <p data-testid="fallback">{t("non.existent.path", "Default Fallback")}</p>
    </div>
  );
}

describe("Internationalization (i18n) Scaffolding", () => {
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
    expect(screen.getByTestId("hero-title")).toHaveTextContent("Turn your GitHub history into");
    expect(screen.getByTestId("fallback")).toHaveTextContent("Default Fallback");
  });

  it("switches language to Hindi and updates document lang", () => {
    render(
      <I18nProvider>
        <LanguageSwitcher />
        <TestConsumer />
      </I18nProvider>
    );

    const select = screen.getByLabelText(/language/i);
    fireEvent.change(select, { target: { value: "hi" } });

    expect(screen.getByTestId("current-locale")).toHaveTextContent("hi");
    expect(screen.getByTestId("hero-title")).toHaveTextContent("अपने गिटहब इतिहास को बदलें");
    expect(document.documentElement.lang).toBe("hi");
    expect(localStorage.getItem("preferred_locale")).toBe("hi");
  });

  it("persists language selection across reloads", () => {
    localStorage.setItem("preferred_locale", "hi");

    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>
    );

    expect(screen.getByTestId("current-locale")).toHaveTextContent("hi");
    expect(screen.getByTestId("hero-title")).toHaveTextContent("अपने गिटहब इतिहास को बदलें");
  });
});
