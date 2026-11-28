import React from "react";
import { render, screen } from "@testing-library/react";
import SkillsToLearn from "../components/SkillsToLearn";
import { SkillItem } from "../types/api";

describe("SkillsToLearn Component", () => {
  const mockCustomMapping = {
    Python: ["FastAPI", "Django", "Pandas", "PyTorch", "Celery", "Flask"],
    JavaScript: ["TypeScript", "React", "Node.js"],
    React: ["Next.js", "Tailwind CSS", "Redux"],
  };

  describe("Acceptance Criterion 3: Users with no detected skills see a helpful message", () => {
    it("renders helpful message when skills array is empty", () => {
      render(<SkillsToLearn skills={[]} />);
      expect(screen.getByTestId("skills-to-learn-empty")).toBeInTheDocument();
      expect(screen.getByText(/No skills detected yet/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Connect repositories or add skills to discover which nearby skills unlock more open-source contribution opportunities/i
        )
      ).toBeInTheDocument();
    });

    it("renders helpful message when skills is null or undefined", () => {
      const { rerender } = render(<SkillsToLearn skills={null} />);
      expect(screen.getByTestId("skills-to-learn-empty")).toBeInTheDocument();
      expect(screen.getByText(/No skills detected yet/i)).toBeInTheDocument();

      rerender(<SkillsToLearn skills={undefined} />);
      expect(screen.getByTestId("skills-to-learn-empty")).toBeInTheDocument();
      expect(screen.getByText(/No skills detected yet/i)).toBeInTheDocument();
    });
  });

  describe("Acceptance Criterion 1: Suggestions exclude skills the user already has", () => {
    it("excludes skills user already possesses and shows top three nearby suggestions", () => {
      // User has Python and FastAPI -> FastAPI should be excluded, showing top 3 remaining (Pandas, PyTorch, Django)
      render(<SkillsToLearn skills={["Python", "fastapi"]} customMapping={mockCustomMapping} />);

      expect(screen.queryByText("FastAPI")).not.toBeInTheDocument();
      expect(screen.getByText("Pandas")).toBeInTheDocument();
      expect(screen.getByText("PyTorch")).toBeInTheDocument();
      expect(screen.getByText("Django")).toBeInTheDocument();
    });

    it("renders nothing (null) when user already has all suggested companion skills", () => {
      const { container } = render(
        <SkillsToLearn
          skills={["React", "Next.js", "Tailwind CSS", "Redux"]}
          customMapping={mockCustomMapping}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Acceptance Criterion 2: Adding a relationship needs only a config change", () => {
    it("immediately reflects new relationships from a config change", () => {
      const updatedConfig = {
        Rust: ["WebAssembly", "Tokio", "Tauri"],
      };

      render(<SkillsToLearn skills={["Rust"]} customMapping={updatedConfig} />);

      expect(screen.getByText("WebAssembly")).toBeInTheDocument();
      expect(screen.getByText("Tokio")).toBeInTheDocument();
      expect(screen.getByText("Tauri")).toBeInTheDocument();
      expect(screen.getAllByText(/Pairs with/i).length).toBe(3);
      expect(screen.getAllByText("Rust").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Unlocked Issues Count & Top Three Display", () => {
    it("renders top three suggestions with unlocked issue count badges", () => {
      render(<SkillsToLearn skills={["Python"]} customMapping={mockCustomMapping} />);

      expect(screen.getByRole("region", { name: /Skills to learn next/i })).toBeInTheDocument();
      expect(screen.getByText("Skills to learn next")).toBeInTheDocument();
      expect(screen.getByText(/LEARNING PATHS/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Top nearby skills that unlock more open-source contribution opportunities/i
        )
      ).toBeInTheDocument();

      // Verify top 3 suggestions rendered
      expect(screen.getByText("FastAPI")).toBeInTheDocument();
      expect(screen.getByText("Pandas")).toBeInTheDocument();
      expect(screen.getByText("Django")).toBeInTheDocument();
      // 4th and beyond should not be rendered
      expect(screen.queryByText("Celery")).not.toBeInTheDocument();
      expect(screen.queryByText("Flask")).not.toBeInTheDocument();

      // Check unlock badges
      expect(screen.getByTestId("unlock-badge-FastAPI")).toHaveTextContent(/issues unlocked/i);
      expect(screen.getByTestId("unlock-badge-Pandas")).toHaveTextContent(/issues unlocked/i);
      expect(screen.getByTestId("unlock-badge-Django")).toHaveTextContent(/issues unlocked/i);
    });

    it("shows the detected skill context 'Pairs with Python'", () => {
      render(<SkillsToLearn skills={["Python"]} customMapping={mockCustomMapping} />);

      const pairsWithTags = screen.getAllByText(/Pairs with/i);
      expect(pairsWithTags.length).toBe(3);
      expect(screen.getAllByText("Python").length).toBeGreaterThanOrEqual(1);
    });

    it("handles SkillItem objects passed from API response", () => {
      const userSkills: SkillItem[] = [
        {
          name: "React",
          repository_count: 4,
          percentage: 60,
          proficiency: "Strong",
        },
      ];

      render(<SkillsToLearn skills={userSkills} customMapping={mockCustomMapping} />);

      expect(screen.getByText("Next.js")).toBeInTheDocument();
      expect(screen.getByText("Tailwind CSS")).toBeInTheDocument();
      expect(screen.getByText("Redux")).toBeInTheDocument();
    });

    it("renders properly in light theme without errors", () => {
      const { container } = render(
        <SkillsToLearn skills={["React"]} theme="light" customMapping={mockCustomMapping} />
      );

      const section = container.querySelector("section");
      expect(section).toBeInTheDocument();
      expect(section?.className).toContain("bg-purple-50/40");
    });

    it("renders properly in dark theme without errors", () => {
      const { container } = render(
        <SkillsToLearn skills={["React"]} theme="dark" customMapping={mockCustomMapping} />
      );

      const section = container.querySelector("section");
      expect(section).toBeInTheDocument();
      expect(section?.className).toContain("bg-white/[0.025]");
    });
  });
});
