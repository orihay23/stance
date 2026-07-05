<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { Button, ToastRegion, useToast } from "@stance/core";
import { compileTheme, neutral } from "@stance/themes";

let styleEl: HTMLStyleElement | null = null;

onMounted(() => {
  styleEl = document.createElement("style");
  styleEl.textContent = compileTheme(neutral);
  document.head.appendChild(styleEl);
});

onUnmounted(() => {
  styleEl?.remove();
});

const { show } = useToast();
</script>

<template>
  <Story title="Toast">
    <Variant title="Light + Dark (shared region)">
      <div data-theme="neutral" :style="{ color: 'var(--stance-color-foreground)' }">
        <!--
          One ToastRegion, mounted once (as it would be in a real app, near
          the root) — triggers from both the light and dark sections below
          call the same imperative useToast().show() and land in this one
          shared stack, which takes its own theme from where it's mounted,
          not from whichever section triggered a given toast.
        -->
        <ToastRegion />

        <div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
          <section
            class="space-y-3 rounded-lg border p-6"
            :style="{
              background: 'var(--stance-color-background)',
              borderColor: 'var(--stance-color-border)',
            }"
          >
            <h2 class="text-lg font-semibold">Light</h2>
            <div class="flex flex-wrap gap-2">
              <Button
                size="sm"
                @click="show({ title: 'Saved', description: 'Your changes were saved.' })"
              >
                Default
              </Button>
              <Button
                size="sm"
                variant="secondary"
                @click="show({ title: 'Upload complete', variant: 'success' })"
              >
                Success
              </Button>
              <Button
                size="sm"
                variant="destructive"
                @click="show({ title: 'Payment failed', description: 'Please update your card.', variant: 'destructive' })"
              >
                Destructive
              </Button>
              <Button
                size="sm"
                variant="ghost"
                @click="show({ title: 'Session expiring', description: 'You will be signed out in 1 minute.', urgent: true })"
              >
                Urgent (role=alert)
              </Button>
            </div>
          </section>

          <section
            class="dark space-y-3 rounded-lg border p-6"
            :style="{
              background: 'var(--stance-color-background)',
              color: 'var(--stance-color-foreground)',
              borderColor: 'var(--stance-color-border)',
            }"
          >
            <h2 class="text-lg font-semibold">Dark</h2>
            <div class="flex flex-wrap gap-2">
              <Button
                size="sm"
                @click="show({ title: 'Saved', description: 'Your changes were saved.' })"
              >
                Default
              </Button>
              <Button
                size="sm"
                variant="secondary"
                @click="show({ title: 'Upload complete', variant: 'success' })"
              >
                Success
              </Button>
              <Button
                size="sm"
                variant="destructive"
                @click="show({ title: 'Payment failed', description: 'Please update your card.', variant: 'destructive' })"
              >
                Destructive
              </Button>
            </div>
          </section>
        </div>
      </div>
    </Variant>

    <Variant title="Duration and manual dismiss">
      <div class="space-y-4 p-6" data-theme="neutral" :style="{ color: 'var(--stance-color-foreground)' }">
        <ToastRegion />
        <p class="text-sm opacity-70">
          Hover or focus a toast to pause its auto-dismiss timer — it resumes from where it left off, not from the start.
        </p>
        <div class="flex flex-wrap gap-2">
          <Button size="sm" @click="show({ title: 'Default (5s)' })">5s (default)</Button>
          <Button size="sm" variant="secondary" @click="show({ title: 'Long (15s)', duration: 15000 })">
            15s
          </Button>
          <Button size="sm" variant="secondary" @click="show({ title: 'Manual only', duration: null })">
            No auto-dismiss
          </Button>
        </div>
      </div>
    </Variant>
  </Story>
</template>
