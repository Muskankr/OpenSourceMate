import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ContributionPreferencesPanel from "../components/ContributionPreferencesPanel";
import ActivePreferencesBar from "../components/ActivePreferencesBar";
import {
  type MatchingPreferences,
  DEFAULT_MATCHING_PREFERENCES,
  loadMatchingPreferences,
  saveMatchingPreferences,
  resetMatchingPreferences,
  hasActiveMatchingPreferences,
} from "../utils/preferences";

describe("Contribution Preferences Suite (#421)", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("MatchingPreferences Storage Utilities", () => {
    it("returns default preferences when storage is empty", () => {
      const prefs = loadMatchingPreferences();
      expect(prefs).toEqual(DEFAULT_MATCHING_PREFERENCES);
      expect(hasActiveMatchingPreferences(prefs)).toBe(false);
    });

    it("saves and reloads matching preferences", () => {
      const updated: MatchingPreferences = {
        preferredLanguages: ["Python", "Rust"],
        excludedOrgs: ["facebook", "google/angular"],
        maxAgeDays: 30,
        expectedTime: "weekend",
      };

      const ok = saveMatchingPreferences(updated);
      expect(ok).toBe(true);

      const reloaded = loadMatchingPreferences();
      expect(reloaded.preferredLanguages).toEqual(["Python", "Rust"]);
      expect(reloaded.excludedOrgs).toEqual(["facebook", "google/angular"]);
      expect(reloaded.maxAgeDays).toBe(30);
      expect(reloaded.expectedTime).toBe("weekend");
      expect(hasActiveMatchingPreferences(reloaded)).toBe(true);
    });

    it("resets preferences back to defaults in one call", () => {
      saveMatchingPreferences({
        preferredLanguages: ["Go"],
        excludedOrgs: ["badorg"],
        maxAgeDays: 7,
        expectedTime: "quick",
      });

      const reset = resetMatchingPreferences();
      expect(reset).toEqual(DEFAULT_MATCHING_PREFERENCES);
      expect(loadMatchingPreferences()).toEqual(DEFAULT_MATCHING_PREFERENCES);
    });
  });

  describe("ContributionPreferencesPanel Component", () => {
    it("renders closed by default and toggles open", () => {
      const onPrefsChange = jest.fn();
      const onReset = jest.fn();

      render(
        <ContributionPreferencesPanel
          preferences={DEFAULT_MATCHING_PREFERENCES}
          onPreferencesChange={onPrefsChange}
          onReset={onReset}
        />
      );

      const toggleBtn = screen.getByTestId("toggle-preferences-panel-btn");
      expect(toggleBtn).toBeInTheDocument();
      expect(screen.queryByTestId("preferences-panel-content")).not.toBeInTheDocument();

      fireEvent.click(toggleBtn);
      expect(screen.getByTestId("preferences-panel-content")).toBeInTheDocument();
    });

    it("toggles preferred language", () => {
      const onPrefsChange = jest.fn();
      const onReset = jest.fn();

      render(
        <ContributionPreferencesPanel
          preferences={DEFAULT_MATCHING_PREFERENCES}
          onPreferencesChange={onPrefsChange}
          onReset={onReset}
        />
      );

      fireEvent.click(screen.getByTestId("toggle-preferences-panel-btn"));

      const pythonBtn = screen.getByTestId("pref-lang-Python");
      fireEvent.click(pythonBtn);

      expect(onPrefsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          preferredLanguages: ["Python"],
        })
      );
    });

    it("adds and removes excluded organizations", () => {
      const onPrefsChange = jest.fn();
      const onReset = jest.fn();

      const initialPrefs: MatchingPreferences = {
        ...DEFAULT_MATCHING_PREFERENCES,
        excludedOrgs: ["hugecorp"],
      };

      const { rerender } = render(
        <ContributionPreferencesPanel
          preferences={initialPrefs}
          onPreferencesChange={onPrefsChange}
          onReset={onReset}
        />
      );

      fireEvent.click(screen.getByTestId("toggle-preferences-panel-btn"));

      // Check excluded org is shown
      expect(screen.getByText("hugecorp")).toBeInTheDocument();

      // Add another org
      const input = screen.getByTestId("exclude-org-input");
      fireEvent.change(input, { target: { value: "anotherorg" } });
      fireEvent.click(screen.getByTestId("exclude-org-btn"));

      expect(onPrefsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          excludedOrgs: ["hugecorp", "anotherorg"],
        })
      );

      // Remove hugecorp
      const removeBtn = screen.getByRole("button", { name: /Remove exclusion for hugecorp/i });
      fireEvent.click(removeBtn);
      expect(onPrefsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          excludedOrgs: [],
        })
      );
    });

    it("selects max age days and expected time", () => {
      const onPrefsChange = jest.fn();
      const onReset = jest.fn();

      render(
        <ContributionPreferencesPanel
          preferences={DEFAULT_MATCHING_PREFERENCES}
          onPreferencesChange={onPrefsChange}
          onReset={onReset}
        />
      );

      fireEvent.click(screen.getByTestId("toggle-preferences-panel-btn"));

      // Max age
      fireEvent.click(screen.getByTestId("pref-age-30"));
      expect(onPrefsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          maxAgeDays: 30,
        })
      );

      // Expected time
      fireEvent.click(screen.getByTestId("pref-time-weekend"));
      expect(onPrefsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedTime: "weekend",
        })
      );
    });

    it("triggers reset in one click from header and footer", () => {
      const onPrefsChange = jest.fn();
      const onReset = jest.fn();

      const activePrefs: MatchingPreferences = {
        preferredLanguages: ["Python"],
        excludedOrgs: ["someorg"],
        maxAgeDays: 14,
        expectedTime: "quick",
      };

      render(
        <ContributionPreferencesPanel
          preferences={activePrefs}
          onPreferencesChange={onPrefsChange}
          onReset={onReset}
        />
      );

      // Reset button in header
      const quickResetBtn = screen.getByTestId("reset-preferences-quick-btn");
      fireEvent.click(quickResetBtn);
      expect(onReset).toHaveBeenCalledTimes(1);

      // Open panel and click footer reset
      fireEvent.click(screen.getByTestId("toggle-preferences-panel-btn"));
      const fullResetBtn = screen.getByTestId("reset-preferences-full-btn");
      fireEvent.click(fullResetBtn);
      expect(onReset).toHaveBeenCalledTimes(2);
    });
  });

  describe("ActivePreferencesBar Component", () => {
    it("renders nothing when no preferences are configured", () => {
      const onReset = jest.fn();
      const { container } = render(
        <ActivePreferencesBar preferences={DEFAULT_MATCHING_PREFERENCES} onReset={onReset} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("displays active badges and resets in one click", () => {
      const onReset = jest.fn();
      const activePrefs: MatchingPreferences = {
        preferredLanguages: ["Python", "Rust"],
        excludedOrgs: ["hugecorp"],
        maxAgeDays: 60,
        expectedTime: "weekend",
      };

      render(<ActivePreferencesBar preferences={activePrefs} onReset={onReset} />);

      expect(screen.getByTestId("active-preferences-bar")).toBeInTheDocument();
      expect(screen.getByTestId("active-pref-languages")).toHaveTextContent("Languages: Python, Rust");
      expect(screen.getByTestId("active-pref-excluded")).toHaveTextContent("Excluded: hugecorp");
      expect(screen.getByTestId("active-pref-age")).toHaveTextContent("Max Age: 60 days");
      expect(screen.getByTestId("active-pref-time")).toHaveTextContent("Time: A Weekend");

      const resetBtn = screen.getByTestId("reset-active-preferences-btn");
      fireEvent.click(resetBtn);
      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });
});
