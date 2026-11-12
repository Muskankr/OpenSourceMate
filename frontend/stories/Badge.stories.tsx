import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../components/ui/Badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["emerald", "blue", "purple", "amber", "rose", "slate"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
    theme: {
      control: "radio",
      options: ["dark", "light"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Emerald: Story = {
  args: {
    children: "TypeScript",
    variant: "emerald",
    theme: "dark",
  },
};

export const Blue: Story = {
  args: {
    children: "React",
    variant: "blue",
    theme: "dark",
  },
};

export const Purple: Story = {
  args: {
    children: "Step 01",
    variant: "purple",
    theme: "dark",
  },
};

export const Amber: Story = {
  args: {
    children: "Attention",
    variant: "amber",
    theme: "dark",
  },
};

export const Rose: Story = {
  args: {
    children: "Failed",
    variant: "rose",
    theme: "dark",
  },
};
