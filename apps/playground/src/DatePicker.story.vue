<script setup lang="ts">
import { ref } from "vue";
import { DatePicker, type DatePickerRangeValue } from "@stance-dev/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const densityDateByProfile = ref<Record<string, Date | undefined>>(
  Object.fromEntries(densityProfiles.map((p) => [p.name, undefined])),
);

const singleDate = ref<Date | undefined>(undefined);
const singleDateDark = ref<Date | undefined>(undefined);
const rangeDate = ref<DatePickerRangeValue | undefined>(undefined);

const today = new Date();
const minMaxDate = ref<Date | undefined>(undefined);
const min = new Date(today.getFullYear(), today.getMonth(), 5);
const max = new Date(today.getFullYear(), today.getMonth(), 25);

const localeDate = ref<Date | undefined>(undefined);
const narrowDate = ref<Date | undefined>(undefined);
</script>

<template>
  <Story title="DatePicker">
    <Variant title="Light + Dark (single date)">
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
          <label class="block text-sm font-medium" for="date-single-light">Appointment date</label>
          <DatePicker id="date-single-light" v-model="singleDate" />
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
          <label class="block text-sm font-medium" for="date-single-dark">Appointment date</label>
          <DatePicker id="date-single-dark" v-model="singleDateDark" />
          <p class="text-sm opacity-70">Selected: {{ singleDateDark?.toDateString() ?? "none" }}</p>
        </section>
      </div>
    </Variant>

    <Variant title="Density">
      <div class="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4" data-theme-palette="neutral">
        <section
          v-for="profile in densityProfiles"
          :key="profile.name"
          :data-theme-density="profile.name"
          class="space-y-2 rounded-lg border p-4"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-sm font-semibold capitalize">{{ profile.name }}</h2>
          <label class="block text-sm font-medium" :for="`date-density-${profile.name}`">Appointment date</label>
          <DatePicker :id="`date-density-${profile.name}`" v-model="densityDateByProfile[profile.name]" />
        </section>
      </div>
    </Variant>

    <Variant title="Range mode">
      <div class="space-y-4 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <label class="block text-sm font-medium" for="date-range">Trip dates</label>
        <DatePicker id="date-range" v-model="rangeDate" mode="range" />
        <p class="text-sm opacity-70">
          Start: {{ rangeDate?.start?.toDateString() ?? "none" }} — End: {{ rangeDate?.end?.toDateString() ?? "none" }}
        </p>
      </div>
    </Variant>

    <Variant title="Min/max constraints">
      <div class="space-y-4 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <label class="block text-sm font-medium" for="date-minmax">Booking date (5th–25th of this month only)</label>
        <DatePicker id="date-minmax" v-model="minMaxDate" :min="min" :max="max" />
      </div>
    </Variant>

    <Variant title="Locale (de-DE, Monday-start week)">
      <div class="space-y-4 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <label class="block text-sm font-medium" for="date-locale">Datum</label>
        <DatePicker id="date-locale" v-model="localeDate" locale="de-DE" />
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="space-y-8 p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <div v-for="width in [320, 260]" :key="width">
          <h3 class="mb-2 text-sm font-medium opacity-70">{{ width }}px container</h3>
          <div :style="{ width: `${width}px`, border: '1px dashed var(--stance-color-border)', padding: '0.5rem' }">
            <label class="mb-1 block text-sm font-medium" :for="`date-narrow-${width}`">Date</label>
            <DatePicker :id="`date-narrow-${width}`" v-model="narrowDate" />
          </div>
        </div>
      </div>
    </Variant>
  </Story>
</template>
