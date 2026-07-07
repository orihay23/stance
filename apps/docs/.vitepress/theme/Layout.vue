<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import ThemeStyles from "./ThemeStyles.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #layout-top>
      <ThemeStyles />
    </template>
  </Layout>
</template>
