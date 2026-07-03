import type { AxeResults } from "axe-core";
import axe from "axe-core";
import { expect } from "vitest";

interface AxeMatchers<R = unknown> {
  toHaveNoViolations: () => R;
}

declare module "vitest" {
  interface Assertion<T = any> extends AxeMatchers<T> {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

expect.extend({
  toHaveNoViolations(results: AxeResults) {
    const { violations } = results;
    const pass = violations.length === 0;
    return {
      pass,
      message: () =>
        pass
          ? "expected accessibility violations, but none were found"
          : `expected no accessibility violations, but found ${violations.length}:\n\n${violations
              .map((violation) => `${violation.id} (${violation.impact}): ${violation.help}\n${violation.helpUrl}`)
              .join("\n\n")}`,
    };
  },
});

export async function runAxe(container: Element): Promise<AxeResults> {
  return axe.run(container);
}
