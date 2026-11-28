"use client";

import React, { useEffect, useState } from "react";
import type { ContributorProgram } from "../types/api";
import { getProgramsConfig, findProgram } from "../utils/programs";
import { fetchPrograms } from "../utils/apiClient";

export interface ProgramSelectorProps {
  value: string;
  onChange: (programId: string) => void;
  programs?: ContributorProgram[];
  theme?: "dark" | "light";
  disabled?: boolean;
  className?: string;
  showBadge?: boolean;
}

export default function ProgramSelector({
  value,
  onChange,
  programs: initialPrograms,
  theme = "dark",
  disabled = false,
  className = "",
  showBadge = true,
}: ProgramSelectorProps) {
  const isDark = theme === "dark";
  const [programsList, setProgramsList] = useState<ContributorProgram[]>(
    initialPrograms || getProgramsConfig()
  );

  useEffect(() => {
    if (initialPrograms && initialPrograms.length > 0) {
      setProgramsList(initialPrograms);
      return;
    }

    let isMounted = true;
    fetchPrograms()
      .then((res) => {
        if (isMounted && res.programs && res.programs.length > 0) {
          setProgramsList(res.programs);
        }
      })
      .catch(() => {
        // Fall back to bundled static programs configuration
        if (isMounted) {
          setProgramsList(getProgramsConfig());
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initialPrograms]);

  const activeProgram = findProgram(value, programsList);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor="issue-program-filter"
          className={`block text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          Contributor Program
        </label>
        {activeProgram && showBadge && (
          <span
            data-testid="active-program-badge"
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide border ${
              isDark
                ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                : "border-purple-300 bg-purple-50 text-purple-700"
            }`}
            title={`Filtered for ${activeProgram.name}: labels [${activeProgram.labels.join(
              ", "
            )}] / topics [${activeProgram.topics.join(", ")}]`}
          >
            <span aria-hidden="true">🎯</span>
            <span className="truncate max-w-[120px]">{activeProgram.name}</span>
          </span>
        )}
      </div>

      <select
        id="issue-program-filter"
        data-testid="program-filter-select"
        aria-label="Filter by contributor program"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
          isDark
            ? "border-white/10 bg-[#0c101d] text-white focus:border-purple-400"
            : "border-gray-300 bg-white text-gray-900 focus:border-purple-600"
        }`}
      >
        <option value="">All Programs (No filter)</option>
        {programsList.map((prog) => (
          <option key={prog.id} value={prog.id}>
            {prog.name}
          </option>
        ))}
      </select>
    </div>
  );
}
