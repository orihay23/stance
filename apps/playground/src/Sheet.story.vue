<script setup lang="ts">
import { ref } from "vue";
import { Button, Sheet } from "@stance-dev/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, densityProfiles } = useStoryTheme();

const densityOpenByProfile = ref<Record<string, boolean>>(
  Object.fromEntries(densityProfiles.map((p) => [p.name, false])),
);

const lightRightOpen = ref(false);
const lightLeftOpen = ref(false);
const lightTopOpen = ref(false);
const lightBottomOpen = ref(false);

const darkRightOpen = ref(false);
const darkLeftOpen = ref(false);
const darkTopOpen = ref(false);
const darkBottomOpen = ref(false);
</script>

<template>
  <Story title="Sheet">
    <Variant title="Light + Dark">
      <div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
        <section
          :data-theme="storyTheme"
          class="space-y-4 rounded-lg border p-6"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-lg font-semibold">Light</h2>

          <div class="flex flex-wrap gap-2">
            <Button @click="lightRightOpen = true">Open right</Button>
            <Button @click="lightLeftOpen = true">Open left</Button>
            <Button @click="lightTopOpen = true">Open top</Button>
            <Button @click="lightBottomOpen = true">Open bottom</Button>
          </div>

          <Sheet v-model="lightRightOpen" side="right" title="Filters" description="Narrow down the results below.">
            <p class="mb-4">Sheet body content goes here.</p>
            <div class="flex justify-end gap-2">
              <Button variant="secondary" @click="lightRightOpen = false">Cancel</Button>
              <Button @click="lightRightOpen = false">Apply</Button>
            </div>
          </Sheet>
          <Sheet v-model="lightLeftOpen" side="left" title="Navigation">
            <p class="mb-4">Sheet body content goes here.</p>
            <Button @click="lightLeftOpen = false">Close</Button>
          </Sheet>
          <Sheet v-model="lightTopOpen" side="top" title="Announcement">
            <p class="mb-4">Sheet body content goes here.</p>
            <Button @click="lightTopOpen = false">Close</Button>
          </Sheet>
          <Sheet v-model="lightBottomOpen" side="bottom" title="Quick actions">
            <p class="mb-4">Sheet body content goes here.</p>
            <Button @click="lightBottomOpen = false">Close</Button>
          </Sheet>
        </section>

        <section
          :data-theme="storyTheme"
          class="dark space-y-4 rounded-lg border p-6"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-lg font-semibold">Dark</h2>

          <div class="flex flex-wrap gap-2">
            <Button @click="darkRightOpen = true">Open right</Button>
            <Button @click="darkLeftOpen = true">Open left</Button>
            <Button @click="darkTopOpen = true">Open top</Button>
            <Button @click="darkBottomOpen = true">Open bottom</Button>
          </div>

          <Sheet v-model="darkRightOpen" side="right" title="Filters" description="Narrow down the results below.">
            <p class="mb-4">Sheet body content goes here.</p>
            <div class="flex justify-end gap-2">
              <Button variant="secondary" @click="darkRightOpen = false">Cancel</Button>
              <Button @click="darkRightOpen = false">Apply</Button>
            </div>
          </Sheet>
          <Sheet v-model="darkLeftOpen" side="left" title="Navigation">
            <p class="mb-4">Sheet body content goes here.</p>
            <Button @click="darkLeftOpen = false">Close</Button>
          </Sheet>
          <Sheet v-model="darkTopOpen" side="top" title="Announcement">
            <p class="mb-4">Sheet body content goes here.</p>
            <Button @click="darkTopOpen = false">Close</Button>
          </Sheet>
          <Sheet v-model="darkBottomOpen" side="bottom" title="Quick actions">
            <p class="mb-4">Sheet body content goes here.</p>
            <Button @click="darkBottomOpen = false">Close</Button>
          </Sheet>
        </section>
      </div>
    </Variant>

    <Variant title="Density">
      <div class="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4" data-theme-palette="neutral">
        <section
          v-for="profile in densityProfiles"
          :key="profile.name"
          :data-theme-density="profile.name"
          class="space-y-3 rounded-lg border p-4"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-sm font-semibold capitalize">{{ profile.name }}</h2>
          <Button size="sm" @click="densityOpenByProfile[profile.name] = true">Open right</Button>
          <Sheet
            v-model="densityOpenByProfile[profile.name]"
            side="right"
            title="Filters"
            description="Narrow down the results below."
          >
            <p class="mb-4">Sheet body content goes here.</p>
            <div class="flex justify-end gap-2">
              <Button variant="secondary" @click="densityOpenByProfile[profile.name] = false">Cancel</Button>
              <Button @click="densityOpenByProfile[profile.name] = false">Apply</Button>
            </div>
          </Sheet>
        </section>
      </div>
    </Variant>
  </Story>
</template>
