import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SkillsEditor from "../components/SkillsEditor";

describe("SkillsEditor Component", () => {
  const initialSkills = ["TypeScript", "Python", "React"];

  it("renders detected skills as removable chips with remove buttons", () => {
    const onSkillsChange = jest.fn();
    const onReset = jest.fn();

    render(
      <SkillsEditor
        initialSkills={initialSkills}
        currentSkills={initialSkills}
        onSkillsChange={onSkillsChange}
        onReset={onReset}
        isEdited={false}
      />
    );

    expect(screen.getByText("Manage Custom Skills")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();

    expect(screen.getByTestId("remove-skill-TypeScript")).toBeInTheDocument();
    expect(screen.getByTestId("remove-skill-Python")).toBeInTheDocument();
    expect(screen.getByTestId("remove-skill-React")).toBeInTheDocument();
  });

  it("calls onSkillsChange with skill removed when remove button is clicked", () => {
    const onSkillsChange = jest.fn();
    const onReset = jest.fn();

    render(
      <SkillsEditor
        initialSkills={initialSkills}
        currentSkills={initialSkills}
        onSkillsChange={onSkillsChange}
        onReset={onReset}
        isEdited={false}
      />
    );

    const removePythonBtn = screen.getByTestId("remove-skill-Python");
    fireEvent.click(removePythonBtn);

    expect(onSkillsChange).toHaveBeenCalledTimes(1);
    expect(onSkillsChange).toHaveBeenCalledWith(["TypeScript", "React"]);
  });

  it("allows adding a new valid skill via input and Add button", () => {
    const onSkillsChange = jest.fn();
    const onReset = jest.fn();

    render(
      <SkillsEditor
        initialSkills={initialSkills}
        currentSkills={initialSkills}
        onSkillsChange={onSkillsChange}
        onReset={onReset}
        isEdited={false}
      />
    );

    const input = screen.getByTestId("add-skill-input");
    const addButton = screen.getByTestId("add-skill-button");

    fireEvent.change(input, { target: { value: "Rust" } });
    fireEvent.click(addButton);

    expect(onSkillsChange).toHaveBeenCalledTimes(1);
    expect(onSkillsChange).toHaveBeenCalledWith(["TypeScript", "Python", "React", "Rust"]);
  });

  it("prevents adding empty or whitespace-only skills", () => {
    const onSkillsChange = jest.fn();
    const onReset = jest.fn();

    render(
      <SkillsEditor
        initialSkills={initialSkills}
        currentSkills={initialSkills}
        onSkillsChange={onSkillsChange}
        onReset={onReset}
        isEdited={false}
      />
    );

    const input = screen.getByTestId("add-skill-input");
    const addButton = screen.getByTestId("add-skill-button");

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(addButton);

    expect(onSkillsChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("skills-editor-error")).toHaveTextContent(
      "Please enter a skill name."
    );
  });

  it("prevents adding duplicate skills case-insensitively", () => {
    const onSkillsChange = jest.fn();
    const onReset = jest.fn();

    render(
      <SkillsEditor
        initialSkills={initialSkills}
        currentSkills={initialSkills}
        onSkillsChange={onSkillsChange}
        onReset={onReset}
        isEdited={false}
      />
    );

    const input = screen.getByTestId("add-skill-input");
    const addButton = screen.getByTestId("add-skill-button");

    fireEvent.change(input, { target: { value: "python" } });
    fireEvent.click(addButton);

    expect(onSkillsChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("skills-editor-error")).toHaveTextContent(
      '"python" is already in your skills list.'
    );
  });

  it("prevents adding skills with invalid characters", () => {
    const onSkillsChange = jest.fn();
    const onReset = jest.fn();

    render(
      <SkillsEditor
        initialSkills={initialSkills}
        currentSkills={initialSkills}
        onSkillsChange={onSkillsChange}
        onReset={onReset}
        isEdited={false}
      />
    );

    const input = screen.getByTestId("add-skill-input");
    const addButton = screen.getByTestId("add-skill-button");

    fireEvent.change(input, { target: { value: "<script>alert(1)</script>" } });
    fireEvent.click(addButton);

    expect(onSkillsChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("skills-editor-error")).toHaveTextContent(
      "Skill name contains invalid characters"
    );
  });

  it("displays edited note and reset button when isEdited is true", () => {
    const onSkillsChange = jest.fn();
    const onReset = jest.fn();

    render(
      <SkillsEditor
        initialSkills={initialSkills}
        currentSkills={["TypeScript", "Rust"]}
        onSkillsChange={onSkillsChange}
        onReset={onReset}
        isEdited={true}
      />
    );

    expect(screen.getByTestId("skills-edited-note")).toBeInTheDocument();
    expect(screen.getByTestId("skills-edited-note")).toHaveTextContent("Skill list edited by user");

    const resetBtn = screen.getByTestId("reset-skills-button");
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("hides edited note and reset button when isEdited is false", () => {
    render(
      <SkillsEditor
        initialSkills={initialSkills}
        currentSkills={initialSkills}
        onSkillsChange={jest.fn()}
        onReset={jest.fn()}
        isEdited={false}
      />
    );

    expect(screen.queryByTestId("skills-edited-note")).not.toBeInTheDocument();
    expect(screen.queryByTestId("reset-skills-button")).not.toBeInTheDocument();
  });

  it("displays empty state notice when currentSkills is empty", () => {
    render(
      <SkillsEditor
        initialSkills={initialSkills}
        currentSkills={[]}
        onSkillsChange={jest.fn()}
        onReset={jest.fn()}
        isEdited={true}
      />
    );

    expect(screen.getByTestId("no-skills-notice")).toBeInTheDocument();
    expect(screen.getByTestId("no-skills-notice")).toHaveTextContent(
      "No active skills. Add a skill below to see matching issues."
    );
  });

  it("marks user-added skills with 'added by you' badge while detected skills do not have it", () => {
    // initialSkills = ["TypeScript", "Python", "React"]
    // currentSkills includes detected skills + user-added "Rust" and "Docker"
    render(
      <SkillsEditor
        initialSkills={initialSkills}
        currentSkills={["TypeScript", "Python", "Rust", "Docker"]}
        onSkillsChange={jest.fn()}
        onReset={jest.fn()}
        isEdited={true}
      />
    );

    // Detected skills do NOT have the badge
    expect(screen.queryByTestId("added-by-you-badge-TypeScript")).not.toBeInTheDocument();
    expect(screen.queryByTestId("added-by-you-badge-Python")).not.toBeInTheDocument();

    // User-added skills DO have the badge
    const rustBadge = screen.getByTestId("added-by-you-badge-Rust");
    expect(rustBadge).toBeInTheDocument();
    expect(rustBadge).toHaveTextContent("added by you");

    const dockerBadge = screen.getByTestId("added-by-you-badge-Docker");
    expect(dockerBadge).toBeInTheDocument();
    expect(dockerBadge).toHaveTextContent("added by you");
  });

  it("renders suggestions from the known skill list and adds suggestion when clicked", () => {
    const onSkillsChange = jest.fn();

    render(
      <SkillsEditor
        initialSkills={initialSkills}
        currentSkills={initialSkills}
        onSkillsChange={onSkillsChange}
        onReset={jest.fn()}
        isEdited={false}
      />
    );

    // Suggestions container should be visible
    expect(screen.getByTestId("skill-suggestions-container")).toBeInTheDocument();

    // Go is in known skills and not in initialSkills
    const goSuggestion = screen.getByTestId("skill-suggestion-Go");
    expect(goSuggestion).toBeInTheDocument();

    fireEvent.click(goSuggestion);
    expect(onSkillsChange).toHaveBeenCalledTimes(1);
    expect(onSkillsChange).toHaveBeenCalledWith(["TypeScript", "Python", "React", "Go"]);
  });

  it("filters suggestions as user types into the add skill input", () => {
    render(
      <SkillsEditor
        initialSkills={initialSkills}
        currentSkills={initialSkills}
        onSkillsChange={jest.fn()}
        onReset={jest.fn()}
        isEdited={false}
      />
    );

    const input = screen.getByTestId("add-skill-input");

    // Type "dock"
    fireEvent.change(input, { target: { value: "dock" } });

    expect(screen.getByTestId("skill-suggestion-Docker")).toBeInTheDocument();
    expect(screen.queryByTestId("skill-suggestion-Go")).not.toBeInTheDocument();
  });
});
