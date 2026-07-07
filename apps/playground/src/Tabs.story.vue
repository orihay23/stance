<script setup lang="ts">
import { ref } from "vue";
import { Tab, TabList, TabPanel, Tabs } from "@stance/core";
import { useStoryTheme } from "./useStoryTheme";

const { storyTheme, themes } = useStoryTheme();

const lightActive = ref("account");
const darkActive = ref("account");
const verticalActive = ref("account");
const narrowActive = ref("account");
</script>

<template>
  <Story title="Tabs">
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
          <Tabs v-model="lightActive">
            <TabList>
              <Tab value="account">Account</Tab>
              <Tab value="billing">Billing</Tab>
              <Tab value="team" disabled>Team (disabled)</Tab>
              <Tab value="settings">Settings</Tab>
            </TabList>
            <TabPanel value="account">Account details go here.</TabPanel>
            <TabPanel value="billing">Billing history and payment methods.</TabPanel>
            <TabPanel value="team">Team members (disabled for this demo).</TabPanel>
            <TabPanel value="settings">General settings.</TabPanel>
          </Tabs>
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
          <Tabs v-model="darkActive">
            <TabList>
              <Tab value="account">Account</Tab>
              <Tab value="billing">Billing</Tab>
              <Tab value="team" disabled>Team (disabled)</Tab>
              <Tab value="settings">Settings</Tab>
            </TabList>
            <TabPanel value="account">Account details go here.</TabPanel>
            <TabPanel value="billing">Billing history and payment methods.</TabPanel>
            <TabPanel value="team">Team members (disabled for this demo).</TabPanel>
            <TabPanel value="settings">General settings.</TabPanel>
          </Tabs>
        </section>
      </div>
    </Variant>

    <Variant title="Vertical orientation">
      <div class="p-6" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <Tabs v-model="verticalActive" orientation="vertical">
          <TabList>
            <Tab value="account">Account</Tab>
            <Tab value="billing">Billing</Tab>
            <Tab value="settings">Settings</Tab>
          </TabList>
          <TabPanel value="account">Account details go here.</TabPanel>
          <TabPanel value="billing">Billing history and payment methods.</TabPanel>
          <TabPanel value="settings">General settings.</TabPanel>
        </Tabs>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] border p-4" :data-theme="storyTheme" :style="{ color: 'var(--stance-color-foreground)' }">
        <Tabs v-model="narrowActive">
          <TabList>
            <Tab value="account">Account</Tab>
            <Tab value="billing">Billing</Tab>
            <Tab value="settings">Settings</Tab>
          </TabList>
          <TabPanel value="account">Account details go here, wrapping normally in a narrow column.</TabPanel>
          <TabPanel value="billing">Billing history and payment methods.</TabPanel>
          <TabPanel value="settings">General settings.</TabPanel>
        </Tabs>
      </div>
    </Variant>
  </Story>
</template>
