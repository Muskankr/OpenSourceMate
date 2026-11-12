import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../components/ui/Button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    theme: {
      control: "radio",
      options: ["dark", "light"],
    },
    isLoading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const PrimaryDark: Story = {
  args: {
    children: "Analyze Profile",
    variant: "primary",
    theme: "dark",
    size: "md",
  },
};

export const PrimaryLight: Story = {
  args: {
    children: "Analyze Profile",
    variant: "primary",
    theme: "light",
    size: "md",
  },
};

export const Secondary: Story = {
  args: {
    children: "Compare Developers",
    variant: "secondary",
    theme: "dark",
    size: "md",
  },
};

export const LoadingState: Story = {
  args: {
    children: "Fetching Repositories...",
    variant: "primary",
    isLoading: true,
    theme: "dark",
  },
};

export const Danger: Story = {
  args: {
    children: "Clear History",
    variant: "danger",
    theme: "dark",
  },
};
