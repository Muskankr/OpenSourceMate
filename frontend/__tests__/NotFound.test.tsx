import React from "react";
import { render, screen } from "@testing-library/react";
import NotFound from "../app/not-found";

describe("NotFound Page", () => {
  it("renders 404 heading and explanatory message", () => {
    render(<NotFound />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText(/ERROR 404 • ROUTE NOT FOUND/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Looks like you've wandered into unmapped territory/i)
    ).toBeInTheDocument();
  });

  it("provides functional navigation links to Home and Analyzer", () => {
    render(<NotFound />);

    const homeLinks = screen.getAllByRole("link", { name: /Home/i });
    expect(homeLinks.length).toBeGreaterThan(0);
    expect(homeLinks[0]).toHaveAttribute("href", "/");

    const analyzerLinks = screen.getAllByRole("link", { name: /Analyzer/i });
    expect(analyzerLinks.length).toBeGreaterThan(0);
    expect(analyzerLinks[0]).toHaveAttribute("href", "/#analyzer");
  });
});
