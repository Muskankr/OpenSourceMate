import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserAuthButton from "../components/UserAuthButton";
import * as apiClient from "../utils/apiClient";

jest.mock("../utils/apiClient", () => ({
  fetchAuthStatus: jest.fn(),
  logoutUser: jest.fn(),
  getApiBaseUrl: jest.fn(() => "http://localhost:8000"),
}));

describe("UserAuthButton component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders unauthenticated sign-in link with read-only notice", async () => {
    (apiClient.fetchAuthStatus as jest.Mock).mockResolvedValueOnce({
      authenticated: false,
      using_visitor_token: false,
    });

    render(<UserAuthButton theme="dark" />);

    // Initially loading state
    expect(screen.getByText(/Checking auth/i)).toBeInTheDocument();

    // Resolves to sign-in link
    await waitFor(() => {
      const signInLink = screen.getByRole("link", { name: /Sign in with GitHub/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute("href", "http://localhost:8000/api/auth/login");
    });
  });

  it("renders authenticated status with username, badge, and sign-out button", async () => {
    (apiClient.fetchAuthStatus as jest.Mock).mockResolvedValueOnce({
      authenticated: true,
      username: "alice_dev",
      avatar_url: "https://avatar.png",
      using_visitor_token: true,
    });

    render(<UserAuthButton theme="dark" />);

    await waitFor(() => {
      expect(screen.getByText("@alice_dev")).toBeInTheDocument();
      expect(screen.getByText(/Personal Limit Active/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Sign out/i })).toBeInTheDocument();
    });
  });

  it("triggers logout when sign-out button is clicked", async () => {
    (apiClient.fetchAuthStatus as jest.Mock).mockResolvedValueOnce({
      authenticated: true,
      username: "bob_dev",
      using_visitor_token: true,
    });
    (apiClient.logoutUser as jest.Mock).mockResolvedValueOnce({
      success: true,
      authenticated: false,
    });

    render(<UserAuthButton theme="light" />);

    await waitFor(() => {
      expect(screen.getByText("@bob_dev")).toBeInTheDocument();
    });

    const logoutBtn = screen.getByRole("button", { name: /Sign out/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(apiClient.logoutUser).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("link", { name: /Sign in with GitHub/i })).toBeInTheDocument();
    });
  });
});
