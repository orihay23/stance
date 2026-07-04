<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { Button, Dialog } from "@stance/core";
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

const lightBasicOpen = ref(false);
const lightAlertOpen = ref(false);
const lightNoOutsideCloseOpen = ref(false);

const darkBasicOpen = ref(false);
const darkAlertOpen = ref(false);
const darkNoOutsideCloseOpen = ref(false);
</script>

<template>
  <Story title="Dialog">
    <Variant title="Light">
      <section
        data-theme="neutral"
        class="space-y-6 rounded-lg border p-6"
        :style="{
          background: 'var(--stance-color-background)',
          color: 'var(--stance-color-foreground)',
          borderColor: 'var(--stance-color-border)',
        }"
      >
        <div>
          <h3 class="mb-2 text-sm font-medium opacity-70">Basic dialog</h3>
          <Button @click="lightBasicOpen = true">Open dialog</Button>
          <Dialog v-model="lightBasicOpen" title="Edit profile" description="Update your account details below.">
            <p class="mb-4">Dialog body content goes here.</p>
            <div class="flex justify-end gap-2">
              <Button variant="secondary" @click="lightBasicOpen = false">Cancel</Button>
              <Button @click="lightBasicOpen = false">Save</Button>
            </div>
          </Dialog>
        </div>

        <div>
          <h3 class="mb-2 text-sm font-medium opacity-70">Alert dialog (destructive confirm)</h3>
          <Button variant="destructive" @click="lightAlertOpen = true">Delete account</Button>
          <Dialog
            v-model="lightAlertOpen"
            role="alertdialog"
            title="Delete account?"
            description="This action cannot be undone."
          >
            <div class="flex justify-end gap-2">
              <Button variant="secondary" @click="lightAlertOpen = false">Cancel</Button>
              <Button variant="destructive" @click="lightAlertOpen = false">Delete</Button>
            </div>
          </Dialog>
        </div>

        <div>
          <h3 class="mb-2 text-sm font-medium opacity-70">No outside-click close (Escape/button only)</h3>
          <Button @click="lightNoOutsideCloseOpen = true">Open</Button>
          <Dialog
            v-model="lightNoOutsideCloseOpen"
            title="Must use a button or Escape"
            :close-on-outside-click="false"
          >
            <p class="mb-4">Clicking the backdrop won't close this one.</p>
            <div class="flex justify-end">
              <Button @click="lightNoOutsideCloseOpen = false">Close</Button>
            </div>
          </Dialog>
        </div>
      </section>
    </Variant>

    <Variant title="Dark">
      <section
        data-theme="neutral"
        class="dark space-y-6 rounded-lg border p-6"
        :style="{
          background: 'var(--stance-color-background)',
          color: 'var(--stance-color-foreground)',
          borderColor: 'var(--stance-color-border)',
        }"
      >
        <div>
          <h3 class="mb-2 text-sm font-medium opacity-70">Basic dialog</h3>
          <Button @click="darkBasicOpen = true">Open dialog</Button>
          <Dialog v-model="darkBasicOpen" title="Edit profile" description="Update your account details below.">
            <p class="mb-4">Dialog body content goes here.</p>
            <div class="flex justify-end gap-2">
              <Button variant="secondary" @click="darkBasicOpen = false">Cancel</Button>
              <Button @click="darkBasicOpen = false">Save</Button>
            </div>
          </Dialog>
        </div>

        <div>
          <h3 class="mb-2 text-sm font-medium opacity-70">Alert dialog (destructive confirm)</h3>
          <Button variant="destructive" @click="darkAlertOpen = true">Delete account</Button>
          <Dialog
            v-model="darkAlertOpen"
            role="alertdialog"
            title="Delete account?"
            description="This action cannot be undone."
          >
            <div class="flex justify-end gap-2">
              <Button variant="secondary" @click="darkAlertOpen = false">Cancel</Button>
              <Button variant="destructive" @click="darkAlertOpen = false">Delete</Button>
            </div>
          </Dialog>
        </div>

        <div>
          <h3 class="mb-2 text-sm font-medium opacity-70">No outside-click close (Escape/button only)</h3>
          <Button @click="darkNoOutsideCloseOpen = true">Open</Button>
          <Dialog
            v-model="darkNoOutsideCloseOpen"
            title="Must use a button or Escape"
            :close-on-outside-click="false"
          >
            <p class="mb-4">Clicking the backdrop won't close this one.</p>
            <div class="flex justify-end">
              <Button @click="darkNoOutsideCloseOpen = false">Close</Button>
            </div>
          </Dialog>
        </div>
      </section>
    </Variant>
  </Story>
</template>
