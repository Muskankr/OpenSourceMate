import React from "react";
import { render, screen } from "@testing-library/react";
import TechIcon, { normalizeTechName } from "../components/TechIcon";

describe("TechIcon Component (#299)", () => {
  const commonTechList = [
    { name: "Python", testId: "tech-icon-python" },
    { name: "JavaScript", testId: "tech-icon-javascript" },
    { name: "TypeScript", testId: "tech-icon-typescript" },
    { name: "HTML", testId: "tech-icon-html" },
    { name: "CSS", testId: "tech-icon-css" },
    { name: "React", testId: "tech-icon-react" },
    { name: "Next.js", testId: "tech-icon-nextjs" },
    { name: "Vue", testId: "tech-icon-vue" },
    { name: "Angular", testId: "tech-icon-angular" },
    { name: "Svelte", testId: "tech-icon-svelte" },
    { name: "Node.js", testId: "tech-icon-nodejs" },
    { name: "Java", testId: "tech-icon-java" },
    { name: "Kotlin", testId: "tech-icon-kotlin" },
    { name: "Swift", testId: "tech-icon-swift" },
    { name: "Go", testId: "tech-icon-go" },
    { name: "Rust", testId: "tech-icon-rust" },
    { name: "C++", testId: "tech-icon-cpp" },
    { name: "C", testId: "tech-icon-c" },
    { name: "C#", testId: "tech-icon-csharp" },
    { name: "Ruby", testId: "tech-icon-ruby" },
    { name: "PHP", testId: "tech-icon-php" },
    { name: "Dart", testId: "tech-icon-dart" },
    { name: "Docker", testId: "tech-icon-docker" },
    { name: "SQL", testId: "tech-icon-sql" },
    { name: "GraphQL", testId: "tech-icon-graphql" },
    { name: "Tailwind CSS", testId: "tech-icon-tailwind" },
    { name: "FastAPI", testId: "tech-icon-fastapi" },
    { name: "Django", testId: "tech-icon-django" },
    { name: "Kubernetes", testId: "tech-icon-kubernetes" },
    { name: "Git", testId: "tech-icon-git" },
  ];

  it("renders distinct inline SVG icons for all 25+ common languages and frameworks", () => {
    commonTechList.forEach(({ name, testId }) => {
      const { unmount } = render(<TechIcon name={name} />);
      const icon = screen.getByTestId(testId);
      expect(icon).toBeInTheDocument();
      expect(icon.tagName.toLowerCase()).toBe("svg");
      unmount();
    });
  });

  it("sets aria-hidden='true' and focusable='false' on icons for screen reader accessibility", () => {
    render(<TechIcon name="Python" />);
    const icon = screen.getByTestId("tech-icon-python");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("focusable", "false");
  });

  it("handles case-insensitivity and technology aliases correctly", () => {
    expect(normalizeTechName("PYTHON")).toBe("python");
    expect(normalizeTechName("py")).toBe("python");
    expect(normalizeTechName("JS")).toBe("javascript");
    expect(normalizeTechName("ecmascript")).toBe("javascript");
    expect(normalizeTechName("ts")).toBe("typescript");
    expect(normalizeTechName("reactjs")).toBe("react");
    expect(normalizeTechName("nextjs")).toBe("nextjs");
    expect(normalizeTechName("vue.js")).toBe("vue");
    expect(normalizeTechName("golang")).toBe("go");
    expect(normalizeTechName("cpp")).toBe("cpp");
    expect(normalizeTechName("cplusplus")).toBe("cpp");
    expect(normalizeTechName("csharp")).toBe("csharp");
    expect(normalizeTechName(".net")).toBe("csharp");
    expect(normalizeTechName("postgresql")).toBe("sql");
    expect(normalizeTechName("mysql")).toBe("sql");
    expect(normalizeTechName("k8s")).toBe("kubernetes");
  });

  it("renders neutral fallback icon for unknown languages or empty names", () => {
    const { unmount: u1 } = render(<TechIcon name="UnknownFramework999" />);
    expect(screen.getByTestId("tech-icon-fallback")).toBeInTheDocument();
    u1();

    const { unmount: u2 } = render(<TechIcon name="" />);
    expect(screen.getByTestId("tech-icon-fallback")).toBeInTheDocument();
    u2();
  });

  it("applies theme-specific adaptations in light and dark mode", () => {
    // Next.js: dark mode should have white fill, light mode should have black fill
    const { unmount: uDark } = render(<TechIcon name="Next.js" theme="dark" />);
    const darkNextPath = screen.getByTestId("tech-icon-nextjs").querySelector("path");
    expect(darkNextPath).toHaveAttribute("fill", "#FFFFFF");
    uDark();

    const { unmount: uLight } = render(<TechIcon name="Next.js" theme="light" />);
    const lightNextPath = screen.getByTestId("tech-icon-nextjs").querySelector("path");
    expect(lightNextPath).toHaveAttribute("fill", "#000000");
    uLight();
  });

  it("passes custom classNames through to the svg element", () => {
    render(<TechIcon name="Rust" className="w-8 h-8 custom-rust-class" />);
    const icon = screen.getByTestId("tech-icon-rust");
    expect(icon).toHaveClass("w-8");
    expect(icon).toHaveClass("h-8");
    expect(icon).toHaveClass("custom-rust-class");
  });
});

