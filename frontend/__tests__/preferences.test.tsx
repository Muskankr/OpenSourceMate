/**
 * Unit & Component tests verifying user recommendation preferences panel and storage (Issue #191).
 */

import { render, screen, fireEvent } from "@testing-library/react";
import {
  loadUserPreferences,
  saveUserPreferences,
  resetUserPreferences,
  DEFAULT_PREFERENCES,
  type UserPreferences,
} from "../utils/preferences";
import PreferencesPanel from "../components/PreferencesPanel";

describe("User Recommendation Preferences Suite (Issue #191)", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("preferences.ts Storage Utilities", () => {
    it("returns default preferences when localStorage is empty", () => {
      const prefs = loadUserPreferences();
      expect(prefs.goal).toBe("general");
      expect(prefs.difficulty).toBe("any");
      expect(prefs.timeAvailability).toBe("regular");
      expect(prefs.includeLanguages).toEqual([]);
    });

    it("saves and reloads user preference updates", () => {
      const updated: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        goal: "gsoc",
        difficulty: "intermediate",
        includeLanguages: ["Python", "Rust"],
        timeAvailability: "dedicated",
      };

      const ok = saveUserPreferences(updated);
      expect(ok).toBe(true);

      const reloaded = loadUserPreferences();
      expect(reloaded.goal).toBe("gsoc");
      expect(reloaded.difficulty).toBe("intermediate");
      expect(reloaded.includeLanguages).toContain("Rust");
      expect(reloaded.timeAvailability).toBe("dedicated");
    });

    it("resets preferences back to default values", () => {
      saveUserPreferences({
        ...DEFAULT_PREFERENCES,
        goal: "portfolio",
      });

      const reset = resetUserPreferences();
      expect(reset.goal).toBe("general");
      expect(loadUserPreferences().goal).toBe("general");
    });

    it("handles corrupt localStorage JSON safely without crashing", () => {
      localStorage.setItem("osm_recommendation_preferences_v1", "INVALID_JSON{");
      const prefs = loadUserPreferences();
      expect(prefs.goal).toBe("general");
    });
  });

  describe("PreferencesPanel Component", () => {
    it("renders collapsible header and toggle button", () => {
      render(<PreferencesPanel />);
      expect(
        screen.getByRole("button", { name: /Contribution Match Preferences/i })
      ).toBeInTheDocument();
    });

    it("expands panel and allows changing contribution goal", () => {
      render(<PreferencesPanel />);
      const toggle = screen.getByRole("button", { name: /Contribution Match Preferences/i });
      fireEvent.click(toggle);

      expect(screen.getByText("Contribution Goal")).toBeInTheDocument();
      const gsocBtn = screen.getByRole("button", { name: /Google Summer of Code/i });
      fireEvent.click(gsocBtn);

      const saved = loadUserPreferences();
      expect(saved.goal).toBe("gsoc");
    });

    it("toggles prioritized language inclusions", () => {
      render(<PreferencesPanel />);
      const toggle = screen.getByRole("button", { name: /Contribution Match Preferences/i });
      fireEvent.click(toggle);

      const tsBtn = screen.getByRole("button", { name: /\+ TypeScript/i });
      fireEvent.click(tsBtn);

      const saved = loadUserPreferences();
      expect(saved.includeLanguages).toContain("TypeScript");
    });
  });
});
