import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  ThemePreference,
  ResolvedTheme,
  getStoredThemePreference,
  getSystemTheme,
  resolveTheme,
  applyThemeToDocument,
  persistThemePreference,
} from "../utils/theme";
import { useTheme } from "../hooks/useTheme";
import ThemeToggle, { ThemeSegmentedToggle } from "../components/ThemeToggle";

describe("Theme System", () => {
  const originalLocalStorage = window.localStorage;
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn((key: string) => mockStorage[key] ?? null),
        setItem: jest.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockStorage[key];
        }),
        clear: jest.fn(() => {
          mockStorage = {};
        }),
      },
      writable: true,
    });
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-preference");
    document.documentElement.style.colorScheme = "";
  });

  afterAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
  });

  describe("Theme Utility Functions", () => {
    it("getStoredThemePreference returns 'system' when localStorage is empty", () => {
      expect(getStoredThemePreference()).toBe("system");
    });

    it("getStoredThemePreference returns stored valid preference", () => {
      mockStorage["theme"] = "dark";
      expect(getStoredThemePreference()).toBe("dark");

      mockStorage["theme"] = "light";
      expect(getStoredThemePreference()).toBe("light");

      mockStorage["theme"] = "system";
      expect(getStoredThemePreference()).toBe("system");
    });

    it("getStoredThemePreference falls back to 'system' for invalid stored value", () => {
      mockStorage["theme"] = "invalid_value";
      expect(getStoredThemePreference()).toBe("system");
    });

    it("resolveTheme resolves explicit light and dark preferences", () => {
      expect(resolveTheme("light")).toBe("light");
      expect(resolveTheme("dark")).toBe("dark");
    });

    it("resolveTheme resolves 'system' according to media query", () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query.includes("dark"),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      expect(resolveTheme("system")).toBe("dark");

      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      expect(resolveTheme("system")).toBe("light");
    });

    it("applyThemeToDocument updates data-theme, data-theme-preference and colorScheme", () => {
      applyThemeToDocument("system", "dark");
      expect(document.documentElement.dataset.theme).toBe("dark");
      expect(document.documentElement.dataset.themePreference).toBe("system");
      expect(document.documentElement.style.colorScheme).toBe("dark");

      applyThemeToDocument("light", "light");
      expect(document.documentElement.dataset.theme).toBe("light");
      expect(document.documentElement.dataset.themePreference).toBe("light");
      expect(document.documentElement.style.colorScheme).toBe("light");
    });

    it("persistThemePreference writes preference to localStorage", () => {
      persistThemePreference("dark");
      expect(window.localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
      expect(mockStorage["theme"]).toBe("dark");
    });
  });

  describe("useTheme Hook", () => {
    let listeners: Record<string, ((e: any) => void)[]> = {};

    beforeEach(() => {
      listeners = {};
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query.includes("dark"),
        media: query,
        addEventListener: jest.fn((event, cb) => {
          listeners[event] = listeners[event] || [];
          listeners[event].push(cb);
        }),
        removeEventListener: jest.fn((event, cb) => {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter((fn) => fn !== cb);
          }
        }),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));
    });

    function TestHookComponent({
      onRender,
    }: {
      onRender: (hookValues: ReturnType<typeof useTheme>) => void;
    }) {
      const theme = useTheme();
      onRender(theme);
      return (
        <div>
          <span data-testid="pref">{theme.themePreference}</span>
          <span data-testid="resolved">{theme.theme}</span>
          <button onClick={() => theme.setThemePreference("dark")}>Set Dark</button>
          <button onClick={() => theme.setThemePreference("light")}>Set Light</button>
          <button onClick={() => theme.setThemePreference("system")}>Set System</button>
          <button onClick={theme.cycleTheme}>Cycle</button>
          <button onClick={theme.toggleTheme}>Toggle</button>
        </div>
      );
    }

    it("defaults to system preference and responds to preference updates", () => {
      let currentHook!: ReturnType<typeof useTheme>;
      render(<TestHookComponent onRender={(vals) => (currentHook = vals)} />);

      expect(screen.getByTestId("pref").textContent).toBe("system");
      expect(screen.getByTestId("resolved").textContent).toBe("dark");

      act(() => {
        screen.getByText("Set Light").click();
      });

      expect(screen.getByTestId("pref").textContent).toBe("light");
      expect(screen.getByTestId("resolved").textContent).toBe("light");
      expect(document.documentElement.dataset.theme).toBe("light");
    });

    it("cycleTheme cycles system -> light -> dark -> system", () => {
      let currentHook!: ReturnType<typeof useTheme>;
      render(<TestHookComponent onRender={(vals) => (currentHook = vals)} />);

      expect(screen.getByTestId("pref").textContent).toBe("system");

      act(() => {
        screen.getByText("Cycle").click();
      });
      expect(screen.getByTestId("pref").textContent).toBe("light");

      act(() => {
        screen.getByText("Cycle").click();
      });
      expect(screen.getByTestId("pref").textContent).toBe("dark");

      act(() => {
        screen.getByText("Cycle").click();
      });
      expect(screen.getByTestId("pref").textContent).toBe("system");
    });

    it("toggleTheme switches between light and dark", () => {
      render(<TestHookComponent onRender={() => {}} />);

      // Starts as dark (system dark match)
      act(() => {
        screen.getByText("Toggle").click();
      });
      expect(screen.getByTestId("pref").textContent).toBe("light");

      act(() => {
        screen.getByText("Toggle").click();
      });
      expect(screen.getByTestId("pref").textContent).toBe("dark");
    });
  });

  describe("ThemeSegmentedToggle Component", () => {
    it("renders light, dark and system options with correct accessibility attributes", () => {
      const onChange = jest.fn();
      render(<ThemeSegmentedToggle preference="system" onChangePreference={onChange} />);

      const toggleGroup = screen.getByRole("group", { name: /Theme preference/i });
      expect(toggleGroup).toBeInTheDocument();

      const lightBtn = screen.getByTestId("theme-option-light");
      const darkBtn = screen.getByTestId("theme-option-dark");
      const systemBtn = screen.getByTestId("theme-option-system");

      expect(lightBtn).toHaveAttribute("aria-pressed", "false");
      expect(darkBtn).toHaveAttribute("aria-pressed", "false");
      expect(systemBtn).toHaveAttribute("aria-pressed", "true");

      fireEvent.click(lightBtn);
      expect(onChange).toHaveBeenCalledWith("light");

      fireEvent.click(darkBtn);
      expect(onChange).toHaveBeenCalledWith("dark");
    });

    it("renders with compact size styling when specified", () => {
      render(<ThemeSegmentedToggle preference="dark" size="sm" onChangePreference={jest.fn()} />);

      const darkBtn = screen.getByTestId("theme-option-dark");
      expect(darkBtn).toHaveAttribute("aria-pressed", "true");
    });

    it("supports backwards-compatible switch variant via ThemeToggle", () => {
      const onToggle = jest.fn();
      render(<ThemeToggle variant="switch" theme="dark" onToggleTheme={onToggle} />);

      const switchBtn = screen.getByRole("switch");
      expect(switchBtn).toBeInTheDocument();
      expect(switchBtn).toHaveAttribute("aria-checked", "true");

      fireEvent.click(switchBtn);
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });
});
