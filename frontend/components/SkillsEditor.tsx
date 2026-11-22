"use client";

import React, { useMemo, useState } from "react";
import TechIcon from "./TechIcon";

export interface SkillsEditorProps {
  initialSkills: string[];
  currentSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  onReset: () => void;
  isEdited: boolean;
  theme?: "dark" | "light";
  className?: string;
}

const SKILL_REGEX = /^[a-zA-Z0-9+#.\- ]{1,50}$/;

/**
 * Curated list of known programming languages, frameworks, and tools
 * suggested when users add custom skills and interests.
 */
export const KNOWN_SKILL_SUGGESTIONS: string[] = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "Node.js",
  "Go",
  "Rust",
  "Java",
  "Kotlin",
  "C",
  "C++",
  "C#",
  "Ruby",
  "PHP",
  "Swift",
  "Dart",
  "Flutter",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Linux",
  "Git",
];

export default function SkillsEditor({
  initialSkills,
  currentSkills,
  onSkillsChange,
  onReset,
  isEdited,
  theme = "dark",
  className = "",
}: SkillsEditorProps) {
  const [newSkill, setNewSkill] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === "dark";

  // Fast lookup set of repository-detected skills (case-insensitive)
  const initialSkillsSet = useMemo(() => {
    return new Set(initialSkills.map((s) => s.trim().toLowerCase()));
  }, [initialSkills]);

  // Current active skills set (case-insensitive)
  const currentSkillsSet = useMemo(() => {
    return new Set(currentSkills.map((s) => s.trim().toLowerCase()));
  }, [currentSkills]);

  // Dynamic suggestions filtered from known skills list
  const filteredSuggestions = useMemo(() => {
    const query = newSkill.trim().toLowerCase();
    if (!query) {
      // Suggest up to 6 popular skills not already added
      return KNOWN_SKILL_SUGGESTIONS.filter((s) => !currentSkillsSet.has(s.toLowerCase())).slice(
        0,
        6
      );
    }
    return KNOWN_SKILL_SUGGESTIONS.filter(
      (s) => s.toLowerCase().includes(query) && !currentSkillsSet.has(s.toLowerCase())
    ).slice(0, 8);
  }, [newSkill, currentSkillsSet]);

  const addSkillValue = (skillName: string) => {
    const trimmed = skillName.trim();

    if (!trimmed) {
      setError("Please enter a skill name.");
      return;
    }

    if (trimmed.length > 50) {
      setError("Skill name must be 50 characters or less.");
      return;
    }

    if (!SKILL_REGEX.test(trimmed)) {
      setError(
        "Skill name contains invalid characters. Use letters, numbers, +, #, ., -, or spaces."
      );
      return;
    }

    if (currentSkillsSet.has(trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in your skills list.`);
      return;
    }

    setError(null);
    onSkillsChange([...currentSkills, trimmed]);
    setNewSkill("");
  };

  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    addSkillValue(newSkill);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setError(null);
    const updated = currentSkills.filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase());
    onSkillsChange(updated);
  };

  return (
    <div
      data-testid="skills-editor"
      className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
        isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50/50"
      } ${className}`}
    >
      {/* Header and Reset Button */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold tracking-wide">Manage Custom Skills</h4>
          <p className={`mt-0.5 text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Add skills, coursework, or college tools GitHub cannot detect, or remove technologies to
            tune your recommendations.
          </p>
        </div>

        {isEdited && (
          <button
            type="button"
            data-testid="reset-skills-button"
            onClick={onReset}
            className={`self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isDark
                ? "border-purple-400/30 bg-purple-400/10 text-purple-300 hover:bg-purple-400/20"
                : "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
            }`}
          >
            <span aria-hidden="true">↺</span>
            Reset to detected skills
          </button>
        )}
      </div>

      {/* Note that list was edited by user */}
      {isEdited && (
        <div
          data-testid="skills-edited-note"
          role="status"
          className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
            isDark
              ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
              : "border-amber-300 bg-amber-50 text-amber-800"
          }`}
        >
          <span aria-hidden="true">✏️</span>
          <span>
            <strong>Skill list edited by user:</strong> Issue recommendations have been re-run with
            your customized skill profile.
          </span>
        </div>
      )}

      {/* Removable Skill Chips */}
      <div className="mt-4">
        {currentSkills.length === 0 ? (
          <p
            data-testid="no-skills-notice"
            className={`text-xs italic ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            No active skills. Add a skill below to see matching issues.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Active skills chips">
            {currentSkills.map((skill) => {
              const isAddedByUser = !initialSkillsSet.has(skill.toLowerCase().trim());
              return (
                <span
                  key={skill}
                  data-testid={`skill-chip-${skill}`}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                    isAddedByUser
                      ? isDark
                        ? "border-purple-500/40 bg-purple-500/10 text-purple-200"
                        : "border-purple-400 bg-purple-50 text-purple-900 shadow-xs"
                      : isDark
                        ? "border-white/10 bg-white/5 text-gray-200"
                        : "border-gray-300 bg-white text-gray-800 shadow-xs"
                  }`}
                >
                  <TechIcon name={skill} theme={theme} className="h-3.5 w-3.5 shrink-0" />
                  <span>{skill}</span>

                  {/* Mark as "added by you" */}
                  {isAddedByUser && (
                    <span
                      data-testid={`added-by-you-badge-${skill}`}
                      className={`rounded-md border px-1.5 py-0.2 text-[10px] font-semibold tracking-wide ${
                        isDark
                          ? "border-purple-400/30 bg-purple-400/20 text-purple-300"
                          : "border-purple-300 bg-purple-100 text-purple-800"
                      }`}
                      title="Added by you (not detected in public repositories)"
                    >
                      added by you
                    </span>
                  )}

                  <button
                    type="button"
                    data-testid={`remove-skill-${skill}`}
                    aria-label={`Remove skill ${skill}`}
                    onClick={() => handleRemoveSkill(skill)}
                    className={`ml-1 flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold transition ${
                      isDark
                        ? "text-gray-400 hover:bg-white/10 hover:text-white"
                        : "text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                    }`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Skill Form */}
      <form
        onSubmit={handleAddSkill}
        className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <input
            type="text"
            list="known-skills-suggestions-datalist"
            data-testid="add-skill-input"
            value={newSkill}
            onChange={(e) => {
              setNewSkill(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Add skills (e.g. Rust, Go, Docker, React)..."
            aria-label="Add a custom skill"
            className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${
              isDark
                ? "border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-purple-400"
                : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-600"
            }`}
          />
          <datalist id="known-skills-suggestions-datalist">
            {KNOWN_SKILL_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <button
          type="submit"
          data-testid="add-skill-button"
          className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
        >
          + Add skill
        </button>
      </form>

      {/* Suggestions from the known skill list */}
      {filteredSuggestions.length > 0 && (
        <div
          data-testid="skill-suggestions-container"
          className="mt-3 flex flex-wrap items-center gap-1.5 text-xs"
        >
          <span className={`text-[11px] font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Suggestions:
          </span>
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              data-testid={`skill-suggestion-${suggestion}`}
              onClick={() => addSkillValue(suggestion)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium transition ${
                isDark
                  ? "border-white/10 bg-white/5 text-gray-300 hover:border-purple-400/50 hover:bg-purple-500/10 hover:text-purple-300"
                  : "border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-800"
              }`}
            >
              <span>+ {suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p
          data-testid="skills-editor-error"
          role="alert"
          className="mt-2 text-xs text-red-400 font-medium"
        >
          {error}
        </p>
      )}
    </div>
  );
}
