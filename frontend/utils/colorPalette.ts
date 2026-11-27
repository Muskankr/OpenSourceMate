/**
 * Color-blind safe palette definition and accessibility helpers.
 *
 * Implements the standard Okabe-Ito (2008) and Wong (2011) categorical color palette,
 * universally distinguishable by individuals with Deuteranopia, Protanopia, Tritanopia,
 * and Monochromacy.
 *
 * Each token provides:
 * - `fill`: High-contrast solid hex fill
 * - `stroke`: Slightly deeper border accent for clean boundary definition
 * - `text`: Legible label color for dark themes
 * - `lightText`: High contrast text color for light themes
 * - `name`: Semantic color name
 * - `pattern`: Distinct visual texture/pattern identifier so color is never the only signal
 */

export interface ColorBlindSafeColor {
  fill: string;
  stroke: string;
  name: string;
  text: string;
  lightText: string;
  pattern: "solid" | "dots" | "stripes" | "grid" | "crosshatch" | "diagonal" | "waves" | "diamonds";
  symbol: string;
}

/**
 * Universal Okabe-Ito 8-color categorical palette with distinct textures & symbols.
 */
export const COLOR_BLIND_SAFE_PALETTE: ColorBlindSafeColor[] = [
  {
    fill: "#0072B2", // Blue
    stroke: "#005587",
    name: "Blue",
    text: "#70bbfd",
    lightText: "#00446b",
    pattern: "solid",
    symbol: "■",
  },
  {
    fill: "#E69F00", // Orange
    stroke: "#B27B00",
    name: "Orange",
    text: "#ffc966",
    lightText: "#734e00",
    pattern: "stripes",
    symbol: "▲",
  },
  {
    fill: "#009E73", // Bluish Green
    stroke: "#007052",
    name: "Bluish Green",
    text: "#5ce5bb",
    lightText: "#004734",
    pattern: "dots",
    symbol: "●",
  },
  {
    fill: "#F0E442", // Yellow
    stroke: "#C7BC1A",
    name: "Yellow",
    text: "#fff785",
    lightText: "#635d00",
    pattern: "grid",
    symbol: "◆",
  },
  {
    fill: "#CC79A7", // Reddish Purple
    stroke: "#9E4D7A",
    name: "Reddish Purple",
    text: "#f0b3d6",
    lightText: "#69254d",
    pattern: "crosshatch",
    symbol: "★",
  },
  {
    fill: "#56B4E9", // Sky Blue
    stroke: "#2A88BD",
    name: "Sky Blue",
    text: "#a8ddfb",
    lightText: "#185375",
    pattern: "diagonal",
    symbol: "▼",
  },
  {
    fill: "#D55E00", // Vermilion
    stroke: "#9C4500",
    name: "Vermilion",
    text: "#ff9952",
    lightText: "#572600",
    pattern: "waves",
    symbol: "✦",
  },
  {
    fill: "#999999", // Neutral Gray
    stroke: "#666666",
    name: "Gray",
    text: "#d4d4d4",
    lightText: "#404040",
    pattern: "diamonds",
    symbol: "⬡",
  },
];

/**
 * Difficulty / Status color definitions that avoid isolated Red-Green reliance
 * by coupling colors with clear semantic symbols and text labels.
 */
export const ACCESSIBLE_STATUS_PALETTE = {
  easy: {
    fill: "#009E73", // Bluish Green
    border: "border-emerald-600/40",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400",
    symbol: "✓",
    label: "Easy / Beginner",
  },
  medium: {
    fill: "#E69F00", // Orange
    border: "border-amber-600/40",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-400",
    symbol: "◆",
    label: "Medium / Intermediate",
  },
  hard: {
    fill: "#D55E00", // Vermilion (distinguishable from Bluish Green under protanopia/deuteranopia)
    border: "border-orange-600/40",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-400",
    symbol: "▲",
    label: "Hard / Advanced",
  },
  neutral: {
    fill: "#0072B2", // Blue
    border: "border-sky-600/40",
    badgeBg: "bg-sky-500/10",
    badgeText: "text-sky-400",
    symbol: "●",
    label: "Informational",
  },
};

/**
 * Resolves a palette color for an index deterministically.
 */
export function getColorForIndex(index: number): ColorBlindSafeColor {
  const safeIndex = Math.abs(index) % COLOR_BLIND_SAFE_PALETTE.length;
  return COLOR_BLIND_SAFE_PALETTE[safeIndex] ?? COLOR_BLIND_SAFE_PALETTE[0]!;
}

/**
 * Returns accessible SVG pattern definitions for charts to avoid sole color reliance.
 */
export function getSvgPatternId(
  pattern: ColorBlindSafeColor["pattern"],
  idPrefix: string = "cb"
): string {
  return `${idPrefix}-pattern-${pattern}`;
}
