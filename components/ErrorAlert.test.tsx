import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ErrorAlert from "./ErrorAlert";

describe("ErrorAlert", () => {
  it("shows the error heading", () => {
    render(<ErrorAlert message="Something went wrong." />);

    expect(
      screen.getByText("Unable to complete analysis")
    ).toBeInTheDocument();
  });

  it("shows the supplied error message", () => {
    render(<ErrorAlert message="Please upload your CV as a PDF." />);

    expect(
      screen.getByText("Please upload your CV as a PDF.")
    ).toBeInTheDocument();
  });

  it("uses the alert accessibility role", () => {
    render(<ErrorAlert message="Something went wrong." />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders nothing when the message is empty", () => {
    const { container } = render(<ErrorAlert message="" />);

    expect(container).toBeEmptyDOMElement();
  });
});