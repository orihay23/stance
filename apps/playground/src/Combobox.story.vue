<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxOption } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, densityProfiles } = useStoryTheme();

const COUNTRIES = [
  "Argentina",
  "Belgium",
  "Canada",
  "Denmark",
  "Egypt",
  "France",
  "Germany",
  "Hungary",
  "Iceland",
  "Japan",
];

function filterCountries(query: string) {
  return COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()));
}

const lightSelected = ref<string>();
const lightQuery = ref("");
const lightOptions = computed(() => filterCountries(lightQuery.value));

const darkSelected = ref<string>();
const darkQuery = ref("");
const darkOptions = computed(() => filterCountries(darkQuery.value));

// A consumer with a pre-selected value already knows its label (e.g. it
// came back from the same fetch as the id) — Combobox doesn't infer
// display text from modelValue on its own (see the design doc, §1: it
// doesn't own the input's text), so inputValue is seeded to match here,
// same as any other v-model'd text input.
const preselectedSelected = ref("France");
const preselectedQuery = ref("France");
const preselectedOptions = computed(() => filterCountries(preselectedQuery.value));

const disabledSelected = ref("Canada");
const disabledQuery = ref("Canada");
const disabledOptions = computed(() => filterCountries(disabledQuery.value));

const multiSelected = ref<string[]>(["Canada", "Japan"]);
const multiQuery = ref("");
const multiOptions = computed(() => filterCountries(multiQuery.value));

// Demonstrates C2's async contract for real: the consumer (this story) owns
// the fetch/debounce entirely — Combobox only consumes the resulting
// loading/error/results state via ComboboxContent's props. Typing "fail"
// simulates a failed request, to show the error slot without needing a
// real flaky network call. The 600ms delay is deliberately visible on
// screen (not asserted on in the visual-test baseline, which only captures
// this variant's deterministic resting state before any typing — a live
// timer mid-flight isn't something a screenshot test should race against).
const asyncSelected = ref<string>();
const asyncQuery = ref("");
const asyncLoading = ref(false);
const asyncError = ref<string>();
const asyncResults = ref<string[]>([]);
let asyncTimer: ReturnType<typeof setTimeout> | undefined;

watch(asyncQuery, (query) => {
  clearTimeout(asyncTimer);
  asyncError.value = undefined;
  if (!query) {
    asyncLoading.value = false;
    asyncResults.value = [];
    return;
  }
  asyncLoading.value = true;
  asyncTimer = setTimeout(() => {
    asyncLoading.value = false;
    if (query.trim().toLowerCase() === "fail") {
      asyncError.value = "Search failed. Please try again.";
      asyncResults.value = [];
      return;
    }
    asyncResults.value = filterCountries(query);
  }, 600);
});
onUnmounted(() => clearTimeout(asyncTimer));

const densitySelectedByProfile = ref<Record<string, string | undefined>>(
  Object.fromEntries(densityProfiles.map((p) => [p.name, undefined])),
);
const densityQueryByProfile = ref<Record<string, string>>(
  Object.fromEntries(densityProfiles.map((p) => [p.name, ""])),
);
function densityOptionsFor(name: string) {
  return filterCountries(densityQueryByProfile.value[name] ?? "");
}
</script>

<template>
  <Story title="Combobox">
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
          <label for="combobox-light-country" class="text-sm font-medium">Country</label>
          <Combobox v-model="lightSelected" v-model:input-value="lightQuery">
            <ComboboxInput id="combobox-light-country" placeholder="Search countries…" />
            <ComboboxContent>
              <ComboboxOption v-for="country in lightOptions" :key="country" :value="country">
                {{ country }}
              </ComboboxOption>
            </ComboboxContent>
          </Combobox>
          <p class="text-sm opacity-70">Selected: {{ lightSelected || "(none)" }}</p>
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
          <label for="combobox-dark-country" class="text-sm font-medium">Country</label>
          <Combobox v-model="darkSelected" v-model:input-value="darkQuery">
            <ComboboxInput id="combobox-dark-country" placeholder="Search countries…" />
            <ComboboxContent>
              <ComboboxOption v-for="country in darkOptions" :key="country" :value="country">
                {{ country }}
              </ComboboxOption>
            </ComboboxContent>
          </Combobox>
          <p class="text-sm opacity-70">Selected: {{ darkSelected || "(none)" }}</p>
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
          <label :for="`combobox-density-${profile.name}`" class="text-sm font-medium">Country</label>
          <Combobox v-model="densitySelectedByProfile[profile.name]" v-model:input-value="densityQueryByProfile[profile.name]">
            <ComboboxInput :id="`combobox-density-${profile.name}`" placeholder="Search countries…" />
            <ComboboxContent>
              <ComboboxOption v-for="country in densityOptionsFor(profile.name)" :key="country" :value="country">
                {{ country }}
              </ComboboxOption>
            </ComboboxContent>
          </Combobox>
        </section>
      </div>
    </Variant>

    <Variant title="Pre-selected value">
      <div class="max-w-sm space-y-2 p-6" :data-theme="storyTheme">
        <label for="combobox-preselected" class="text-sm font-medium">Country</label>
        <Combobox v-model="preselectedSelected" v-model:input-value="preselectedQuery">
          <ComboboxInput id="combobox-preselected" placeholder="Search countries…" />
          <ComboboxContent>
            <ComboboxOption v-for="country in preselectedOptions" :key="country" :value="country">
              {{ country }}
            </ComboboxOption>
          </ComboboxContent>
        </Combobox>
      </div>
    </Variant>

    <Variant title="Disabled">
      <div class="max-w-sm space-y-2 p-6" :data-theme="storyTheme">
        <label for="combobox-disabled" class="text-sm font-medium">Country</label>
        <Combobox v-model="disabledSelected" v-model:input-value="disabledQuery" disabled>
          <ComboboxInput id="combobox-disabled" placeholder="Search countries…" />
          <ComboboxContent>
            <ComboboxOption v-for="country in disabledOptions" :key="country" :value="country">
              {{ country }}
            </ComboboxOption>
          </ComboboxContent>
        </Combobox>
      </div>
    </Variant>

    <Variant title="Multi-select with tags">
      <div class="max-w-sm space-y-2 p-6" :data-theme="storyTheme">
        <label for="combobox-multi" class="text-sm font-medium">Countries</label>
        <Combobox v-model="multiSelected" v-model:input-value="multiQuery" multiple>
          <ComboboxInput id="combobox-multi" placeholder="Search countries…" />
          <ComboboxContent>
            <ComboboxOption v-for="country in multiOptions" :key="country" :value="country">
              {{ country }}
            </ComboboxOption>
          </ComboboxContent>
        </Combobox>
        <p class="text-sm opacity-70">Selected: {{ multiSelected.length ? multiSelected.join(", ") : "(none)" }}</p>
      </div>
    </Variant>

    <Variant title="Async search (simulated network)">
      <div class="max-w-sm space-y-2 p-6" :data-theme="storyTheme">
        <label for="combobox-async" class="text-sm font-medium">Country</label>
        <Combobox v-model="asyncSelected" v-model:input-value="asyncQuery">
          <ComboboxInput id="combobox-async" placeholder="Type to search…" />
          <ComboboxContent :loading="asyncLoading" :error="asyncError">
            <ComboboxOption v-for="country in asyncResults" :key="country" :value="country">
              {{ country }}
            </ComboboxOption>
            <template #empty>Type at least one letter to search.</template>
          </ComboboxContent>
        </Combobox>
        <p class="text-sm opacity-70">
          Simulates a real network request (~600ms) — the story owns fetching/debouncing entirely, Combobox only
          consumes the resulting loading/error/results state. Type "fail" to see the error state.
        </p>
      </div>
    </Variant>
  </Story>
</template>
