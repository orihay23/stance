<script setup lang="ts">
import { ref } from "vue";
import { Collapsible } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme } = useStoryTheme();

const open = ref(true);
const openDark = ref(true);
const disabledOpen = ref(false);
</script>

<template>
  <Story title="Collapsible">
    <Variant title="Light + Dark">
      <div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
        <section
          :data-theme="storyTheme"
          class="space-y-6 rounded-lg border p-6"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-lg font-semibold">Light</h2>

          <Collapsible v-model="open">
            <template #trigger>What's included in the Pro plan?</template>
            Unlimited projects, priority support, and advanced analytics — billed monthly or annually.
          </Collapsible>
        </section>

        <section
          :data-theme="storyTheme"
          class="dark space-y-6 rounded-lg border p-6"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-lg font-semibold">Dark</h2>

          <Collapsible v-model="openDark">
            <template #trigger>What's included in the Pro plan?</template>
            Unlimited projects, priority support, and advanced analytics — billed monthly or annually.
          </Collapsible>
        </section>
      </div>
    </Variant>

    <Variant title="Disabled">
      <div class="space-y-4 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <Collapsible v-model="disabledOpen" disabled>
          <template #trigger>Unavailable while your account is suspended</template>
          This content can't be reached — the trigger is disabled.
        </Collapsible>
      </div>
    </Variant>
  </Story>
</template>
