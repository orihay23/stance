import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import PipelineCheck from "./fixtures/PipelineCheck.vue";

describe("test pipeline smoke check", () => {
  it("renders via @testing-library/vue", () => {
    render(PipelineCheck, { props: { label: "Click me" } });
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("has no axe accessibility violations", async () => {
    const { container } = render(PipelineCheck, { props: { label: "Click me" } });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
