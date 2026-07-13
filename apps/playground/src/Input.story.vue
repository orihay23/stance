<script setup lang="ts">
import { ref } from "vue";
import { Input, type InputType } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes, densityProfiles } = useStoryTheme();

const types: InputType[] = ["text", "email", "password", "number"];

const textValue = ref("");
const emailValue = ref("");
const passwordValue = ref("");
const numberValue = ref("");
const invalidValue = ref("not-an-email");
const amountValue = ref("");
</script>

<template>
  <Story title="Input">
    <Variant title="Light + Dark">
      <div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
        <section
          v-for="mode in ['light', 'dark']"
          :key="mode"
          :data-theme="storyTheme"
          :class="['space-y-6 rounded-lg border p-6', mode === 'dark' && 'dark']"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-lg font-semibold capitalize">{{ mode }}</h2>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Types</h3>
            <div class="space-y-2">
              <Input
                v-for="type in types"
                :key="type"
                :type="type"
                :placeholder="type"
                :aria-label="type"
                :model-value="
                  type === 'text'
                    ? textValue
                    : type === 'email'
                      ? emailValue
                      : type === 'password'
                        ? passwordValue
                        : numberValue
                "
                @update:model-value="
                  (v) => {
                    if (type === 'text') textValue = v;
                    else if (type === 'email') emailValue = v;
                    else if (type === 'password') passwordValue = v;
                    else numberValue = v;
                  }
                "
              />
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">States</h3>
            <div class="space-y-2">
              <Input placeholder="Default" aria-label="Default" />
              <Input placeholder="Disabled" aria-label="Disabled" disabled />
              <Input placeholder="Readonly" aria-label="Readonly" readonly model-value="Can't edit this" />
              <Input
                placeholder="Invalid"
                aria-label="Email"
                invalid
                :model-value="invalidValue"
                @update:model-value="invalidValue = $event"
              >
                <template #error>Please enter a valid email address.</template>
              </Input>
            </div>
          </div>

          <div>
            <h3 class="mb-2 text-sm font-medium opacity-70">Prefix / suffix slots</h3>
            <div class="space-y-2">
              <Input
                placeholder="0.00"
                aria-label="Amount"
                :model-value="amountValue"
                @update:model-value="amountValue = $event"
              >
                <template #prefix>$</template>
                <template #suffix>USD</template>
              </Input>
            </div>
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
          class="space-y-3 rounded-lg border p-4"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="text-sm font-semibold capitalize">{{ profile.name }}</h2>
          <Input placeholder="Default" aria-label="Default" />
        </section>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] space-y-3 border p-4" :data-theme="storyTheme">
        <Input placeholder="Narrow field" aria-label="Narrow field" />
        <Input placeholder="With adornments" aria-label="With adornments">
          <template #prefix>$</template>
          <template #suffix>USD</template>
        </Input>
      </div>
    </Variant>
  </Story>
</template>
