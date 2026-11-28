import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Home, {
  AnalysisProgressSteps,
  ProfileSkeleton,
  SkillsSkeleton,
  IssuesSkeleton,
  Bar,
} from "../app/page";

jest.mock("../components/ContributorsWall", () => {
  return function MockContributorsWall() {
    return null;
  };
});

jest.mock("../components/UserAuthButton", () => {
  return function MockUserAuthButton() {
    return null;
  };
});

const mockProfile = {
  username: "octocat",
  name: "The Octocat",
  bio: "GitHub mascot and developer advocate.",
  avatar_url: "https://avatars.githubusercontent.com/u/583231?v=4",
  public_repositories: 8,
  followers: 9500,
  following: 9,
  profile_url: "https://github.com/octocat",
};

const mockSkills = {
  skills: [
    { name: "TypeScript", repository_count: 5, percentage: 50 },
    { name: "Python", repository_count: 3, percentage: 30 },
  ],
  total_repositories_analyzed: 8,
};

const mockRecommendations = {
  username: "octocat",
  skills: ["TypeScript", "Python"],
  recommendations: [
    {
      id: 101,
      title: "Add TypeScript type definitions for options parser",
      repository: "octocat/hello-world",
      url: "https://github.com/octocat/hello-world/issues/101",
      state: "open",
      labels: ["good first issue"],
      comments: 3,
      created_at: "2026-10-20T10:00:00Z",
      updated_at: "2026-10-25T14:30:00Z",
      language: "TypeScript",
      match_score: 90,
      match_reasons: ["Matches top language: TypeScript"],
    },
  ],
};

describe("Loading Skeletons and Step Progress Feedback", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  describe("Acceptance Criterion 1: Clicking Analyze twice sends one request", () => {
    it("prevents duplicate submissions when clicking Analyze button twice rapidly", async () => {
      let resolveProfile: (val: any) => void;
      const profilePromise = new Promise((resolve) => {
        resolveProfile = resolve;
      });

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/github/users/octocat/skills")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockSkills),
          });
        }
        if (url.includes("/api/github/users/octocat")) {
          return profilePromise.then(() => ({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockProfile),
          }));
        }
        if (url.includes("/api/recommendations")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockRecommendations),
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      render(<Home />);

      const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
      const button = screen.getByTestId("analyze-button");

      fireEvent.change(input, { target: { value: "octocat" } });

      // Click twice in immediate synchronous succession
      fireEvent.click(button);
      fireEvent.click(button);

      // Verify button is disabled and aria-busy is set
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");

      // Verify user fetch endpoint was called only once despite rapid double click
      const userCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call) => call[0].includes("/api/github/users/octocat") && !call[0].includes("/skills")
      );
      expect(userCalls).toHaveLength(1);

      // Finish pending promise
      await act(async () => {
        resolveProfile!({ ok: true });
        jest.runAllTimers();
      });
    });

    it("disables Analyze button and shows Analyzing... label while request is running", async () => {
      let resolveProfile: (val: any) => void;
      const profilePromise = new Promise((resolve) => {
        resolveProfile = resolve;
      });

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/github/users/octocat/skills")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockSkills),
          });
        }
        if (url.includes("/api/github/users/octocat")) {
          return profilePromise.then(() => ({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockProfile),
          }));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockRecommendations),
        });
      });

      render(<Home />);
      const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
      const button = screen.getByTestId("analyze-button");

      fireEvent.change(input, { target: { value: "octocat" } });
      fireEvent.click(button);

      // While request is pending
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent(/Analyzing/i);

      await act(async () => {
        resolveProfile!({ ok: true });
        jest.runAllTimers();
      });
    });
  });

  describe("Acceptance Criterion 2: Skeletons match layout and avoid layout shift", () => {
    it("renders ProfileSkeleton, SkillsSkeleton, and IssuesSkeleton during active analysis", async () => {
      let resolveProfile: (val: any) => void;
      const profilePromise = new Promise((resolve) => {
        resolveProfile = resolve;
      });

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/github/users/octocat/skills")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockSkills),
          });
        }
        if (url.includes("/api/github/users/octocat")) {
          return profilePromise.then(() => ({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockProfile),
          }));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockRecommendations),
        });
      });

      render(<Home />);
      const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
      fireEvent.change(input, { target: { value: "octocat" } });
      fireEvent.click(screen.getByTestId("analyze-button"));

      // Skeleton section should be present
      expect(screen.getByTestId("analysis-loading-section")).toBeInTheDocument();
      expect(screen.getByTestId("profile-skeleton")).toBeInTheDocument();
      expect(screen.getByTestId("skills-skeleton")).toBeInTheDocument();
      expect(screen.getByTestId("issues-skeleton")).toBeInTheDocument();

      await act(async () => {
        resolveProfile!({ ok: true });
        jest.runAllTimers();
      });
    });

    it("verifies skeleton components render appropriate theme styling in dark and light modes", () => {
      // Dark mode render
      const { rerender } = render(
        <div>
          <ProfileSkeleton theme="dark" />
          <SkillsSkeleton theme="dark" />
          <IssuesSkeleton theme="dark" />
          <Bar theme="dark" className="h-4 w-20" />
        </div>
      );

      const profileDark = screen.getByTestId("profile-skeleton");
      const skillsDark = screen.getByTestId("skills-skeleton");
      const issuesDark = screen.getByTestId("issues-skeleton");

      expect(profileDark.className).toContain("border-white/10");
      expect(skillsDark.className).toContain("border-white/10");
      expect(issuesDark.className).toContain("border-purple-500/20");

      // Light mode render
      rerender(
        <div>
          <ProfileSkeleton theme="light" />
          <SkillsSkeleton theme="light" />
          <IssuesSkeleton theme="light" />
          <Bar theme="light" className="h-4 w-20" />
        </div>
      );

      const profileLight = screen.getByTestId("profile-skeleton");
      const skillsLight = screen.getByTestId("skills-skeleton");
      const issuesLight = screen.getByTestId("issues-skeleton");

      expect(profileLight.className).toContain("border-gray-200");
      expect(skillsLight.className).toContain("border-gray-200");
      expect(issuesLight.className).toContain("border-purple-200");
    });
  });

  describe("Acceptance Criterion 3: Progress always ends in results or an error", () => {
    it("displays step progress messages and ends in populated results on success", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockProfile,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSkills,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockRecommendations,
        });

      render(<Home />);
      const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
      fireEvent.change(input, { target: { value: "octocat" } });
      fireEvent.click(screen.getByTestId("analyze-button"));

      // Profile assertion
      expect(await screen.findByText("The Octocat")).toBeInTheDocument();
      expect(screen.getAllByText("@octocat").length).toBeGreaterThan(0);
      expect(screen.getByText("GitHub mascot and developer advocate.")).toBeInTheDocument();

      // Skills assertion
      expect(screen.getAllByText("TypeScript").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Python").length).toBeGreaterThan(0);

      // Recommendations assertion
      await waitFor(() => {
        expect(
          screen.getByText(/Add TypeScript type definitions for options parser/i)
        ).toBeInTheDocument();
        expect(screen.queryByTestId("analysis-loading-section")).not.toBeInTheDocument();
      });
    });

    it("ends cleanly in an error alert and unmounts skeletons when profile fetch fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: "Not found" }),
      });

      render(<Home />);
      const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
      fireEvent.change(input, { target: { value: "nonexistent" } });
      fireEvent.click(screen.getByTestId("analyze-button"));

      expect(
        await screen.findByText(
          /(?:GitHub user 'nonexistent' could not be found|could not be found)/i
        )
      ).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.queryByTestId("analysis-loading-section")).not.toBeInTheDocument();
    });

    it("verifies AnalysisProgressSteps renders polite live region and accessible step markers", () => {
      const mockT = jest.fn((key: string, fallback?: string) => fallback || key);

      const { rerender } = render(
        <AnalysisProgressSteps currentStep="fetching-profile" theme="dark" t={mockT} />
      );

      const container = screen.getByRole("status");
      expect(container).toHaveAttribute("aria-live", "polite");
      expect(screen.getByTestId("step-fetching-profile")).toHaveAttribute("aria-current", "step");

      rerender(<AnalysisProgressSteps currentStep="detecting-skills" theme="dark" t={mockT} />);
      expect(screen.getByTestId("step-detecting-skills")).toHaveAttribute("aria-current", "step");

      rerender(<AnalysisProgressSteps currentStep="finding-issues" theme="dark" t={mockT} />);
      expect(screen.getByTestId("step-finding-issues")).toHaveAttribute("aria-current", "step");
    });
  });
});
