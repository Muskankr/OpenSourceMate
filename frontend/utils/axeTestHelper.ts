import axe from "axe-core";

export interface AxeCheckOptions {
  rules?: Record<string, { enabled: boolean }>;
  runOnly?: {
    type: "tag" | "rule";
    values: string[];
  };
}

export interface AxeViolation {
  id: string;
  impact?: "minor" | "moderate" | "serious" | "critical" | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary?: string;
  }>;
}

/**
 * Runs axe accessibility evaluation on an HTML element or container.
 * Fails when any 'serious' or 'critical' violations are found.
 */
export async function checkA11yViolations(
  container: Element,
  options?: AxeCheckOptions
): Promise<{
  violations: AxeViolation[];
  seriousOrCriticalViolations: AxeViolation[];
  passes: boolean;
}> {
  const defaultOptions: axe.RunOptions = {
    runOnly: options?.runOnly || {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    },
    rules: {
      // Allow disabling or customizing individual rules if needed in test context
      ...options?.rules,
    },
  };

  const results = await axe.run(container, defaultOptions);

  const seriousOrCritical = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical"
  );

  return {
    violations: results.violations as AxeViolation[],
    seriousOrCriticalViolations: seriousOrCritical as AxeViolation[],
    passes: seriousOrCritical.length === 0,
  };
}

/**
 * Jest matcher utility to assert zero serious or critical accessibility violations
 */
export async function assertNoSeriousA11yViolations(
  container: Element,
  options?: AxeCheckOptions
): Promise<void> {
  const { seriousOrCriticalViolations, passes } = await checkA11yViolations(container, options);

  if (!passes) {
    const errorDetails = seriousOrCriticalViolations
      .map(
        (v) =>
          `[${v.impact?.toUpperCase()}] ${v.id}: ${v.help} (${v.helpUrl})\n` +
          v.nodes.map((n) => `  - Node: ${n.html}\n    Summary: ${n.failureSummary}`).join("\n")
      )
      .join("\n\n");

    throw new Error(
      `Found ${seriousOrCriticalViolations.length} serious/critical accessibility violation(s):\n\n${errorDetails}`
    );
  }
}
