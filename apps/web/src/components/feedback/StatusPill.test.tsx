import { render, screen } from "@testing-library/react";

import { StatusPill } from "./StatusPill";

describe("StatusPill", () => {
  it("renders a readable label for availability status", () => {
    render(<StatusPill status="provider_error" />);

    expect(screen.getByText("Providerfout")).toBeInTheDocument();
  });
});
