"use client";

import React, { useEffect, useState } from "react";
import {
  getCachedRequirements,
  getRepoRequirements,
  DEFAULT_UNKNOWN_REQUIREMENTS,
  type ContributionRequirementsResult,
} from "../utils/repoRequirements";

export interface ContributionRequirementsChipsProps {
  repository: string;
  theme?: "dark" | "light";
  requirements?: ContributionRequirementsResult;
  className?: string;
}

export default function ContributionRequirementsChips({
  repository,
  theme = "dark",
  requirements,
  className = "",
}: ContributionRequirementsChipsProps) {
  const isDark = theme === "dark";

  // Check cache synchronously to avoid layout shifts
  const initialResult = React.useMemo(() => {
    if (requirements) return requirements;
    return getCachedRequirements(repository);
  }, [repository, requirements]);

  const [result, setResult] = useState<ContributionRequirementsResult>(
    () => initialResult || DEFAULT_UNKNOWN_REQUIREMENTS(repository)
  );

  useEffect(() => {
    if (requirements) {
      setResult(requirements);
      return;
    }
    if (initialResult) return;

    let isMounted = true;
    getRepoRequirements(repository).then((res) => {
      if (isMounted) {
        setResult(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [repository, requirements, initialResult]);

  const { contributing, code_of_conduct, license, cla_dco } = result;

  const getChipStyle = (detected: boolean) => {
    if (detected) {
      return isDark
        ? "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:border-purple-400 hover:bg-purple-500/20"
        : "border-purple-200 bg-purple-50 text-purple-800 hover:border-purple-300 hover:bg-purple-100";
    }
    return isDark
      ? "border-slate-800 bg-slate-800/40 text-slate-400"
      : "border-gray-200 bg-gray-50 text-gray-500";
  };

  return (
    <div
      data-testid="contribution-requirements-container"
      className={`flex flex-wrap items-center gap-1.5 text-[11px] ${className}`}
      aria-label="Repository Contribution Requirements"
    >
      {/* 1. CONTRIBUTING.md Chip */}
      {contributing.detected && contributing.url ? (
        <a
          href={contributing.url}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="chip-contributing"
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium transition-colors hover:underline ${getChipStyle(
            true
          )}`}
          title="View CONTRIBUTING.md on GitHub"
          aria-label="Contributing Guide: Present. Open on GitHub in a new tab"
        >
          <span aria-hidden="true">📄</span>
          <span>Contributing</span>
        </a>
      ) : (
        <span
          data-testid="chip-contributing-unknown"
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-normal ${getChipStyle(
            false
          )}`}
          title="Contributing guide not detected"
        >
          <span aria-hidden="true">📄</span>
          <span>Contributing: unknown</span>
        </span>
      )}

      {/* 2. CODE_OF_CONDUCT.md Chip */}
      {code_of_conduct.detected && code_of_conduct.url ? (
        <a
          href={code_of_conduct.url}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="chip-coc"
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium transition-colors hover:underline ${getChipStyle(
            true
          )}`}
          title={`View ${code_of_conduct.name || "Code of Conduct"} on GitHub`}
          aria-label="Code of Conduct: Present. Open on GitHub in a new tab"
        >
          <span aria-hidden="true">📜</span>
          <span>{code_of_conduct.name || "Code of Conduct"}</span>
        </a>
      ) : (
        <span
          data-testid="chip-coc-unknown"
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-normal ${getChipStyle(
            false
          )}`}
          title="Code of Conduct not detected"
        >
          <span aria-hidden="true">📜</span>
          <span>Code of Conduct: unknown</span>
        </span>
      )}

      {/* 3. Licence Chip */}
      {license.detected && license.url ? (
        <a
          href={license.url}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="chip-license"
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium transition-colors hover:underline ${getChipStyle(
            true
          )}`}
          title={`View ${license.name || "License"} on GitHub`}
          aria-label={`License: ${license.name || "Present"}. Open on GitHub in a new tab`}
        >
          <span aria-hidden="true">⚖️</span>
          <span>{license.name || "License"}</span>
        </a>
      ) : (
        <span
          data-testid="chip-license-unknown"
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-normal ${getChipStyle(
            false
          )}`}
          title="Licence file not detected"
        >
          <span aria-hidden="true">⚖️</span>
          <span>License: unknown</span>
        </span>
      )}

      {/* 4. CLA / DCO Chip */}
      {cla_dco.detected && cla_dco.url ? (
        <a
          href={cla_dco.url}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="chip-cla-dco"
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium transition-colors hover:underline ${getChipStyle(
            true
          )}`}
          title={`View ${cla_dco.name || "CLA/DCO"} on GitHub`}
          aria-label={`${cla_dco.name || "CLA/DCO requirement"}. Open on GitHub in a new tab`}
        >
          <span aria-hidden="true">✍️</span>
          <span>{cla_dco.name || "CLA/DCO"}</span>
        </a>
      ) : (
        <span
          data-testid="chip-cla-dco-unknown"
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-normal ${getChipStyle(
            false
          )}`}
          title="CLA/DCO requirement not detected"
        >
          <span aria-hidden="true">✍️</span>
          <span>CLA/DCO: unknown</span>
        </span>
      )}
    </div>
  );
}
