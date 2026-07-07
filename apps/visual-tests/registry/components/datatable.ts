import type { ComponentSpec } from "../types";
import { lightDarkCaptures } from "../types";

export const datatable: ComponentSpec = {
  component: "DataTable",
  variants: [
    { variantTitle: "Light + Dark", captures: lightDarkCaptures() },
    { variantTitle: "Empty and loading states", captures: [{ name: "default", selector: "[data-theme]" }] },
    {
      variantTitle: "Responsive (container-query card collapse)",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
    { variantTitle: "Pagination (client mode)", captures: [{ name: "default", selector: "[data-theme]" }] },
    { variantTitle: "Row selection (multiple)", captures: [{ name: "default", selector: "[data-theme]" }] },
    {
      variantTitle: "Filtering (global search + per-column)",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
    {
      variantTitle: "Filtering (Filters disclosure past 4 filterable columns)",
      captures: [{ name: "default", selector: "[data-theme]" }],
    },
  ],
};
