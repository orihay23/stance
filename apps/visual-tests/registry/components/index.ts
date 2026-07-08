import type { ComponentSpec } from "../types";
import { accordion } from "./accordion";
import { avatar } from "./avatar";
import { badge } from "./badge";
import { breadcrumb } from "./breadcrumb";
import { button } from "./button";
import { calendar } from "./calendar";
import { card } from "./card";
import { checkbox } from "./checkbox";
import { datatable } from "./datatable";
import { datepicker } from "./datepicker";
import { dialog } from "./dialog";
import { dropdownmenu } from "./dropdownmenu";
import { grid } from "./grid";
import { input } from "./input";
import { pagination } from "./pagination";
import { popover } from "./popover";
import { progressbar } from "./progressbar";
import { radiogroup } from "./radiogroup";
import { select } from "./select";
import { separator } from "./separator";
import { skeleton } from "./skeleton";
import { splitter } from "./splitter";
import { switchComponent } from "./switch";
import { tabs } from "./tabs";
import { textarea } from "./textarea";
import { toast } from "./toast";
import { togglegroup } from "./togglegroup";
import { tooltip } from "./tooltip";
import { treetable } from "./treetable";

// One entry per shipped component — see design-docs/visual-testing.md for
// the rollout plan. ThemeTokens is deliberately excluded: it's a docs/
// reference page, not a shipped component.
export const components: ComponentSpec[] = [
  accordion,
  avatar,
  badge,
  breadcrumb,
  button,
  calendar,
  card,
  checkbox,
  datatable,
  datepicker,
  dialog,
  dropdownmenu,
  grid,
  input,
  pagination,
  popover,
  progressbar,
  radiogroup,
  select,
  separator,
  skeleton,
  splitter,
  switchComponent,
  tabs,
  textarea,
  toast,
  togglegroup,
  tooltip,
  treetable,
];
