<script setup lang="ts">
import { ref } from "vue";

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
    storyId: "src-datatable-story-vue",
    name: "DataTable",
    includes: [],
    summary: "Sorting, client/server pagination, row selection (single/multiple), global + per-column filtering, container-query card collapse.",
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
]);
</script>

# Components

Interactive, live examples for every component live in the Histoire story
build, linked below — this page intentionally doesn't duplicate those
examples. Each entry links to the component's stories (light/dark, states,
responsive behavior) and, where relevant, the sub-components it's used
alongside.

<table>
  <thead>
    <tr>
      <th>Component</th>
      <th>Summary</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="group in groups" :key="group.storyId">
      <td>
        <a :href="storyUrl(group.storyId)" target="_blank" rel="noreferrer">{{ group.name }}</a>
        <span v-if="group.includes.length"> ({{ group.includes.join(", ") }})</span>
      </td>
      <td>{{ group.summary }}</td>
    </tr>
  </tbody>
</table>

## Not yet built

DatePicker, and an exploratory look at TreeTable are planned for the next
component phase.
