<script setup lang="ts">
import { ref } from "vue";
import { Card, Grid, Badge } from "@stance/core";

// Defined in .vitepress/config.ts (vite.define) — the single source of
// truth for where the Histoire build lives, so this doesn't re-derive it
// via its own runtime check.
declare const __COMPONENTS_BASE__: string;

function storyUrl(storyId: string) {
  return `${__COMPONENTS_BASE__}story/${storyId}`;
}

const groups = ref([
  {
    storyId: "src-button-story-vue",
    name: "Button",
    includes: [],
    summary: "Primary/secondary/ghost/destructive variants, sizes, loading and icon-only states.",
  },
  {
    storyId: "src-input-story-vue",
    name: "Input",
    includes: [],
    summary: "Text/email/password/number, prefix/suffix slots, invalid + error message state.",
  },
  {
    storyId: "src-checkbox-story-vue",
    name: "Checkbox",
    includes: [],
    summary: "Includes indeterminate state.",
  },
  {
    storyId: "src-radiogroup-story-vue",
    name: "RadioGroup",
    includes: ["Radio"],
    summary: "A labeled group of native radio inputs with roving native keyboard behavior.",
  },
  {
    storyId: "src-switch-story-vue",
    name: "Switch",
    includes: [],
    summary: "A boolean toggle styled as a switch, not a checkbox.",
  },
  {
    storyId: "src-select-story-vue",
    name: "Select",
    includes: [],
    summary: "Native <select> wrapped for consistent styling and error state.",
  },
  {
    storyId: "src-textarea-story-vue",
    name: "Textarea",
    includes: [],
    summary: "Multi-line text input with the same invalid/error pattern as Input.",
  },
  {
    storyId: "src-togglegroup-story-vue",
    name: "ToggleGroup",
    includes: ["ToggleGroupItem"],
    summary: "Single-select segmented control.",
  },
  {
    storyId: "src-dialog-story-vue",
    name: "Dialog",
    includes: [],
    summary: "Modal dialog with focus trapping, Escape-to-close, and alertdialog support.",
  },
  {
    storyId: "src-popover-story-vue",
    name: "Popover",
    includes: ["PopoverTrigger", "PopoverContent"],
    summary: "Anchored floating panel (built on Floating UI) with dismiss-on-outside-click/Escape.",
  },
  {
    storyId: "src-tooltip-story-vue",
    name: "Tooltip",
    includes: [],
    summary: "Hover/focus-triggered hint text; dismissible with Escape.",
  },
  {
    storyId: "src-dropdownmenu-story-vue",
    name: "DropdownMenu",
    includes: ["DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuSeparator"],
    summary: "Anchored menu with roving arrow-key navigation, Home/End, and type-ahead-free item activation.",
  },
  {
    storyId: "src-separator-story-vue",
    name: "Separator",
    includes: [],
    summary: "Horizontal or vertical dividing rule; role=separator by default, or aria-hidden via a decorative prop. Also used internally by DropdownMenuSeparator.",
  },
  {
    storyId: "src-datatable-story-vue",
    name: "DataTable",
    includes: [],
    summary: "Sorting, client/server pagination, row selection (single/multiple), global + per-column filtering, container-query card collapse.",
  },
  {
    storyId: "src-pagination-story-vue",
    name: "Pagination",
    includes: [],
    summary: "Standalone page navigation with windowed ellipsis and an optional page-size picker; also used internally by DataTable.",
  },
  {
    storyId: "src-tabs-story-vue",
    name: "Tabs",
    includes: ["TabList", "Tab", "TabPanel"],
    summary: "Horizontal or vertical, roving-tabindex tab list.",
  },
  {
    storyId: "src-accordion-story-vue",
    name: "Accordion",
    includes: ["AccordionItem", "AccordionHeader", "AccordionContent"],
    summary: "Single- or multiple-open mode, configurable heading level.",
  },
  {
    storyId: "src-toast-story-vue",
    name: "Toast",
    includes: ["ToastRegion"],
    summary: "Imperative useToast() API backed by a shared, visually-positioned toast region.",
  },
  {
    storyId: "src-card-story-vue",
    name: "Card",
    includes: [],
    summary: "Themeable container with header/body/footer slots; optional real <button>/<a> interactive form.",
  },
  {
    storyId: "src-grid-story-vue",
    name: "Grid",
    includes: [],
    summary: "Responsive column layout via container queries or viewport breakpoints; composes with Card.",
  },
  {
    storyId: "src-badge-story-vue",
    name: "Badge",
    includes: [],
    summary: "Decorative by default; pass a label for badges conveying a count or status that matters functionally.",
  },
  {
    storyId: "src-progressbar-story-vue",
    name: "ProgressBar",
    includes: [],
    summary: "Determinate and indeterminate modes, role=progressbar with correct aria-value* attributes.",
  },
  {
    storyId: "src-avatar-story-vue",
    name: "Avatar",
    includes: [],
    summary: "Image with graceful fallback to initials or an icon on load failure or when no image is given.",
  },
  {
    storyId: "src-breadcrumb-story-vue",
    name: "Breadcrumb",
    includes: [],
    summary: "Container-query-driven collapse of intermediate items into a menu once the trail is too long.",
  },
  {
    storyId: "src-splitter-story-vue",
    name: "Splitter",
    includes: ["SplitterPane"],
    summary: "Draggable and keyboard-resizable panes (2+), horizontal or vertical, with per-pane min/max and v-model persisted sizes.",
  },
  {
    storyId: "src-calendar-story-vue",
    name: "Calendar",
    includes: [],
    summary: "Standalone inline WAI-ARIA grid calendar — single-date or range selection, full keyboard support, locale-aware. DatePicker composes this internally for its popover.",
  },
  {
    storyId: "src-datepicker-story-vue",
    name: "DatePicker",
    includes: [],
    summary: "Single-date or range selection via a WAI-ARIA grid dialog, full keyboard support, locale-aware (Intl-based, no date dependency), and a typed-text-input companion.",
  },
  {
    storyId: "src-treetable-story-vue",
    name: "TreeTable",
    includes: [],
    summary: "role=treegrid nested data table — expand/collapse, per-sibling-group sort, ancestor-preserving filter, roving-tabindex keyboard grid, and card-collapse at narrow widths.",
  },
]);
</script>

# Components

Interactive, live examples for every component live in the Histoire story
build, linked below — this page intentionally doesn't duplicate those
examples. Each entry links to the component's stories (light/dark, states,
responsive behavior) and, where relevant, the sub-components it's used
alongside.

<Grid :columns="{ base: 1, sm: 2, lg: 3 }" gap="md">
  <Card v-for="group in groups" :key="group.storyId">
    <h3>
      <a :href="storyUrl(group.storyId)" target="_blank" rel="noreferrer">{{ group.name }}</a>
    </h3>
    <p>{{ group.summary }}</p>
    <Badge v-for="sub in group.includes" :key="sub" variant="neutral">{{ sub }}</Badge>
  </Card>
</Grid>

This completes the initial component list from CLAUDE.md.
