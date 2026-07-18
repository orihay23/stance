<script setup lang="ts">
import { Button, ToastRegion, useToast } from "@stance-dev/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const { show } = useToast();
</script>

<template>
  <Story title="Toast">
    <Variant title="Light + Dark (shared region)">
      <div :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
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

    <Variant title="Density">
      <!--
        Each section mounts its own ToastRegion — since useToast()'s store is
        a module-level singleton (shared by every ToastRegion instance, see
        useToast.ts), one show() call fans out to all 4 regions at once, each
        rendering the same toast styled per its own section's density.

        The `density-toast-region` class overrides the component's default
        `position: fixed` so the 4 regions render in normal flow side by side
        instead of stacking on top of each other in the viewport corner. This
        can't be a plain Tailwind utility (e.g. `static`): Tailwind v4 wraps
        its own output in `@layer utilities`, and stance's own :where()
        component styles are deliberately unlayered — per the CSS cascade
        layers spec, unlayered rules always beat layered ones regardless of
        specificity or order, so a layered utility class can never win
        against stance's :where() styles no matter how low their specificity
        is. (This is a real, load-bearing gap in the ":where() lets a single
        Tailwind class win" story — see design-docs/theme-axes.md's note on
        it; out of scope to fix here since it affects every component, not
        just this one story.) The plain, unlayered selector below sidesteps
        it the same way stance's own internal overrides would have to.
      -->
      <div class="p-6" data-theme-palette="neutral">
        <div class="mb-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <section
            v-for="profile in densityProfiles"
            :key="profile.name"
            :data-theme-density="profile.name"
            class="rounded-lg border p-4"
            :style="{
              background: 'var(--stance-color-background)',
              color: 'var(--stance-color-foreground)',
              borderColor: 'var(--stance-color-border)',
            }"
          >
            <h2 class="mb-3 text-sm font-semibold capitalize">{{ profile.name }}</h2>
            <ToastRegion class="density-toast-region" />
          </section>
        </div>
        <Button size="sm" @click="show({ title: 'Saved', description: 'Your changes were saved.' })">
          Show toast (appears in every density above)
        </Button>
      </div>
    </Variant>

    <Variant title="Duration and manual dismiss">
      <div class="space-y-4 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
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

<style>
.density-toast-region {
  position: static;
}
</style>
