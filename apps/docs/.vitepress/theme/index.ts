import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { Avatar, Badge, Breadcrumb, Card, Grid, ProgressBar } from "@stance/core";
// @stance/core's structural CSS is a separate build artifact (Vite library
// mode extracts component CSS rather than injecting it via the JS import) —
// every consumer, including this docs site, has to import it explicitly.
import "@stance/core/style.css";
import Layout from "./Layout.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("StanceCard", Card);
    app.component("StanceGrid", Grid);
    app.component("StanceBadge", Badge);
    app.component("StanceBreadcrumb", Breadcrumb);
    app.component("StanceAvatar", Avatar);
    app.component("StanceProgressBar", ProgressBar);
  },
} satisfies Theme;
