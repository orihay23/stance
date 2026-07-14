<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import ThemePicker from "./ThemePicker.vue";
import ThemeStyles from "./ThemeStyles.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #layout-top>
      <ThemeStyles />
    </template>
    <!--
      `nav-bar-content-after` (inside VPNav's own flex row), not
      `layout-top` — layout-top renders in normal document flow, but VPNav
      is `position: fixed`, so content placed there doesn't get pushed
      down, it gets visually overlapped by the fixed nav sitting on top of
      it (found by hand: the picker rendered half-hidden behind the nav
      bar). nav-bar-content-after participates correctly in the nav's own
      layout; ThemePicker.vue keeps its footprint small (a single trigger
      button opening a Popover) specifically so it fits that already-busy
      row without crowding out search/links/the appearance toggle.

      Wrapped in <ClientOnly> because rendering a Popover during Node SSR
      throws ("document is not defined" inside one of its floating-
      position/focus-trap composables) — a real gap, not specific to this
      picker: no existing docs page had ever mounted ANY overlay component
      (Dialog/Popover/Tooltip/etc.) via VitePress's SSR before this one, so
      it was never caught. Fixing detectThemeContext's own SSR-unsafe
      `instanceof HTMLElement` (theme-context.ts) was a small, clearly
      correct, well-tested fix worth keeping regardless; the deeper
      "are all of Popover's positioning/focus-trap composables SSR-safe"
      question is a bigger audit than this phase's scope — this component
      only ever needs to exist client-side anyway (there's nothing
      meaningful to server-render for an interactive theme switcher), so
      ClientOnly sidesteps the whole category cleanly rather than chasing
      down each individual composable.
    -->
    <template #nav-bar-content-after>
      <ClientOnly>
        <ThemePicker />
      </ClientOnly>
    </template>
  </Layout>
</template>
