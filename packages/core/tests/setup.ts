import "@testing-library/jest-dom/vitest";
import "./axe-matcher";

// jsdom doesn't implement the Pointer Events capture API — stub it as a
// no-op so components using it (Splitter's divider, Slider's thumb) don't
// throw when a test dispatches a pointerdown.
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}

// jsdom doesn't implement scrollIntoView either — stub it as a no-op so
// components that call it (Combobox's active-option highlight) don't throw.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
