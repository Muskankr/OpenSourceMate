import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

export interface SkeletonProps {
  type?: "card" | "line" | "circle";
  theme?: "dark" | "light";
}

export const Skeleton: React.FC<SkeletonProps> = ({ type = "card", theme = "dark" }) => {
  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-slate-800" : "bg-slate-200";

  if (type === "circle") {
    return <div className={`w-16 h-16 rounded-full animate-pulse ${bgClass}`} />;
  }

  if (type === "line") {
    return (
      <div className="space-y-2 w-full max-w-md">
        <div className={`h-4 rounded animate-pulse ${bgClass} w-3/4`} />
        <div className={`h-4 rounded animate-pulse ${bgClass} w-1/2`} />
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-6 border animate-pulse ${
        isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-full ${bgClass}`} />
        <div className="space-y-2 flex-1">
          <div className={`h-4 rounded ${bgClass} w-1/3`} />
          <div className={`h-3 rounded ${bgClass} w-1/4`} />
        </div>
      </div>
      <div className={`h-16 rounded ${bgClass} w-full`} />
    </div>
  );
};

const meta: Meta<typeof Skeleton> = {
  title: "States/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  argTypes: {
    type: { control: "select", options: ["card", "line", "circle"] },
    theme: { control: "radio", options: ["dark", "light"] },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const CardSkeletonDark: Story = {
  args: { type: "card", theme: "dark" },
};

export const CardSkeletonLight: Story = {
  args: { type: "card", theme: "light" },
};

export const TextLines: Story = {
  args: { type: "line", theme: "dark" },
};
