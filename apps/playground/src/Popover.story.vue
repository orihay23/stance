<script setup lang="ts">
import { ref } from "vue";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@stance-dev/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const densityOpenByProfile = ref<Record<string, boolean>>(
  Object.fromEntries(densityProfiles.map((p) => [p.name, false])),
);

// Independent refs per section (not shared across a v-for loop) — sharing a
// single ref across the Light/Dark sections was the exact bug that made
// Dialog's Tab-cycle look broken during its own verification.
const lightInfoOpen = ref(false);
const lightConfirmOpen = ref(false);
const lightTopOpen = ref(false);

const darkInfoOpen = ref(false);
const darkConfirmOpen = ref(false);
const darkTopOpen = ref(false);
</script>

<template>
  <Story title="Popover">
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

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Non-modal (default): info disclosure</h3>
            <Popover v-model="lightInfoOpen">
              <PopoverTrigger>Show info</PopoverTrigger>
              <PopoverContent>
                <p>Non-modal content: Tab can leave it, and the rest of the page stays interactive.</p>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Modal: inline confirm</h3>
            <Popover v-model="lightConfirmOpen" modal>
              <PopoverTrigger variant="destructive">Remove item</PopoverTrigger>
              <PopoverContent>
                <p class="mb-3">Remove this item from the list?</p>
                <div class="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" @click="lightConfirmOpen = false">Cancel</Button>
                  <Button variant="destructive" size="sm" @click="lightConfirmOpen = false">Remove</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Placement: top</h3>
            <Popover v-model="lightTopOpen" placement="top">
              <PopoverTrigger variant="ghost">Show above</PopoverTrigger>
              <PopoverContent>
                <p>Anchored above the trigger.</p>
              </PopoverContent>
            </Popover>
          </div>
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

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Non-modal (default): info disclosure</h3>
            <Popover v-model="darkInfoOpen">
              <PopoverTrigger>Show info</PopoverTrigger>
              <PopoverContent>
                <p>Non-modal content: Tab can leave it, and the rest of the page stays interactive.</p>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Modal: inline confirm</h3>
            <Popover v-model="darkConfirmOpen" modal>
              <PopoverTrigger variant="destructive">Remove item</PopoverTrigger>
              <PopoverContent>
                <p class="mb-3">Remove this item from the list?</p>
                <div class="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" @click="darkConfirmOpen = false">Cancel</Button>
                  <Button variant="destructive" size="sm" @click="darkConfirmOpen = false">Remove</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Placement: top</h3>
            <Popover v-model="darkTopOpen" placement="top">
              <PopoverTrigger variant="ghost">Show above</PopoverTrigger>
              <PopoverContent>
                <p>Anchored above the trigger.</p>
              </PopoverContent>
            </Popover>
          </div>
        </section>
      </div>
    </Variant>

    <Variant title="Density">
      <div class="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4" data-theme-palette="neutral">
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
          <Popover v-model="densityOpenByProfile[profile.name]">
            <PopoverTrigger>Show info</PopoverTrigger>
            <PopoverContent>
              <p>Non-modal content.</p>
            </PopoverContent>
          </Popover>
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] space-y-4 border p-4" :data-theme="storyTheme">
        <Popover v-model="lightInfoOpen">
          <PopoverTrigger class="w-full">Show info</PopoverTrigger>
          <PopoverContent>
            <p>Content still fits and stays anchored to the trigger in a narrow container.</p>
          </PopoverContent>
        </Popover>
      </div>
    </Variant>
  </Story>
</template>
