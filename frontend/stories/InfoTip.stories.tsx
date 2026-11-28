import type { Meta, StoryObj } from "@storybook/react";
import InfoTip from "../components/ui/InfoTip";

const meta: Meta<typeof InfoTip> = {
  title: "Components/InfoTip",
  component: InfoTip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    term: {
      control: "text",
      description: "Optional term name to display as bold header in tooltip",
    },
    content: {
      control: "text",
      description: "Detailed explanatory text displayed inside the popover",
    },
    position: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
      description: "Position relative to the trigger button",
    },
    size: {
      control: "select",
      options: ["sm", "md"],
      description: "Size of the trigger circle icon",
    },
  },
};

export default meta;
type Story = StoryObj<typeof InfoTip>;

export const SkillTerm: Story = {
  args: {
    term: "Skill",
    content:
      "Derived from language byte distributions, commit frequencies, and project dependencies.",
    position: "top",
    size: "sm",
  },
};

export const PublicDataOnlyTerm: Story = {
  args: {
    term: "Public Data Only",
    content: "Analysis only inspects public GitHub repositories and public event history.",
    position: "bottom",
    size: "md",
  },
};

export const AnalyzedRepositoriesTerm: Story = {
  args: {
    term: "Analyzed Repositories",
    content:
      "Repositories actively owned or contributed to by this user, excluding forks by default.",
    position: "top",
    size: "sm",
  },
};
