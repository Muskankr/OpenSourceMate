import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import ServiceUnavailableBanner from "../components/ServiceUnavailableBanner";

const meta: Meta<typeof ServiceUnavailableBanner> = {
  title: "States/ServiceUnavailableBanner",
  component: ServiceUnavailableBanner,
  tags: ["autodocs"],
  argTypes: {
    statusCode: { control: "number" },
    theme: { control: "radio", options: ["dark", "light"] },
  },
};

export default meta;
type Story = StoryObj<typeof ServiceUnavailableBanner>;

export const GitHubApiDegraded: Story = {
  args: {
    statusCode: 502,
    theme: "dark",
    message: "GitHub API is experiencing elevated latencies. Analysis may take longer than usual.",
  },
};

export const ScheduledMaintenance: Story = {
  args: {
    statusCode: 503,
    theme: "light",
    message: "Performing index maintenance. Searches will resume shortly.",
  },
};
