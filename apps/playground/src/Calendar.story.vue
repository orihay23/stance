<script setup lang="ts">
import { ref } from "vue";
import { Calendar, type CalendarRangeValue } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme } = useStoryTheme();

const singleDate = ref<Date | undefined>(undefined);
const singleFocused = ref(new Date());
const singleDateDark = ref<Date | undefined>(undefined);
const singleFocusedDark = ref(new Date());

const rangeDate = ref<CalendarRangeValue | undefined>(undefined);
const rangeFocused = ref(new Date());

const today = new Date();
const minMaxDate = ref<Date | undefined>(undefined);
const minMaxFocused = ref(new Date());
const min = new Date(today.getFullYear(), today.getMonth(), 5);
const max = new Date(today.getFullYear(), today.getMonth(), 25);

const narrowDate = ref<Date | undefined>(undefined);
const narrowFocused = ref(new Date());
</script>

<template>
  <Story title="Calendar">
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
          <Calendar v-model="singleDate" v-model:focused-date="singleFocused" />
          <p class="text-sm opacity-70">Selected: {{ singleDate?.toDateString() ?? "none" }}</p>
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
          <Calendar v-model="singleDateDark" v-model:focused-date="singleFocusedDark" />
          <p class="text-sm opacity-70">Selected: {{ singleDateDark?.toDateString() ?? "none" }}</p>
        </section>
      </div>
    </Variant>

    <Variant title="Range mode">
      <div class="space-y-4 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <Calendar v-model="rangeDate" v-model:focused-date="rangeFocused" mode="range" />
        <p class="text-sm opacity-70">
          Start: {{ rangeDate?.start?.toDateString() ?? "none" }} — End: {{ rangeDate?.end?.toDateString() ?? "none" }}
        </p>
      </div>
    </Variant>

    <Variant title="Min/max constraints">
      <div class="space-y-4 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <p class="text-sm opacity-70">5th–25th of this month only</p>
        <Calendar v-model="minMaxDate" v-model:focused-date="minMaxFocused" :min="min" :max="max" />
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="space-y-8 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <div v-for="width in [320, 260]" :key="width">
          <h3 class="mb-2 text-sm font-medium opacity-70">{{ width }}px container</h3>
          <div :style="{ width: `${width}px`, border: '1px dashed var(--stance-color-border)', padding: '0.5rem' }">
            <Calendar v-model="narrowDate" v-model:focused-date="narrowFocused" />
          </div>
        </div>
      </div>
    </Variant>
  </Story>
</template>
