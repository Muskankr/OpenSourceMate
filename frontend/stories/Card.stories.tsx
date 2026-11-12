import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../components/ui/Card";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "interactive", "glass"],
    },
    theme: {
      control: "radio",
      options: ["dark", "light"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const DefaultDark: Story = {
  args: {
    theme: "dark",
    variant: "default",
    children: (
      <div>
        <h4 className="font-bold text-base mb-1">Standard Card</h4>
        <p className="text-xs text-slate-400">Default container with subtle borders.</p>
      </div>
    ),
  },
};

export const InteractiveLight: Story = {
  args: {
    theme: "light",
    variant: "interactive",
    children: (
      <div>
        <h4 className="font-bold text-base mb-1">Interactive Card</h4>
        <p className="text-xs text-slate-600">Elevates on hover with smooth animation.</p>
      </div>
    ),
  },
};

export const GlassEffect: Story = {
  args: {
    theme: "dark",
    variant: "glass",
    children: (
      <div>
        <h4 className="font-bold text-base text-emerald-400 mb-1">Glassmorphic Card</h4>
        <p className="text-xs text-slate-400">Backdrop blurred background for floating controls.</p>
      </div>
    ),
  },
};
