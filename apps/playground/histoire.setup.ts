import { defineSetupVue3 } from "@histoire/plugin-vue";
import ThemeSwitcherWrapper from "./src/ThemeSwitcherWrapper.vue";
import "./src/style.css";

export const setupVue3 = defineSetupVue3(({ addWrapper }) => {
  addWrapper(ThemeSwitcherWrapper);
});
