<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { Accordion, AccordionContent, AccordionHeader, AccordionItem } from "@stance/core";
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

const lightSingle = ref("shipping");
const darkSingle = ref("shipping");
const multiple = ref<string[]>(["shipping"]);
const narrowSingle = ref("shipping");
</script>

<template>
  <Story title="Accordion">
    <Variant title="Light + Dark (single-open)">
      <div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
        <section
          data-theme="neutral"
          class="rounded-lg border p-6"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="mb-4 text-lg font-semibold">Light</h2>
          <Accordion v-model="lightSingle">
            <AccordionItem value="shipping">
              <AccordionHeader>Shipping</AccordionHeader>
              <AccordionContent>Orders ship within 2 business days via standard courier.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="returns">
              <AccordionHeader>Returns</AccordionHeader>
              <AccordionContent>Returns are accepted within 30 days of delivery.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="warranty" disabled>
              <AccordionHeader>Warranty (disabled)</AccordionHeader>
              <AccordionContent>Not applicable for this demo.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section
          data-theme="neutral"
          class="dark rounded-lg border p-6"
          :style="{
            background: 'var(--stance-color-background)',
            color: 'var(--stance-color-foreground)',
            borderColor: 'var(--stance-color-border)',
          }"
        >
          <h2 class="mb-4 text-lg font-semibold">Dark</h2>
          <Accordion v-model="darkSingle">
            <AccordionItem value="shipping">
              <AccordionHeader>Shipping</AccordionHeader>
              <AccordionContent>Orders ship within 2 business days via standard courier.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="returns">
              <AccordionHeader>Returns</AccordionHeader>
              <AccordionContent>Returns are accepted within 30 days of delivery.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="warranty" disabled>
              <AccordionHeader>Warranty (disabled)</AccordionHeader>
              <AccordionContent>Not applicable for this demo.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </Variant>

    <Variant title="Multiple-open mode">
      <div class="p-6" data-theme="neutral" :style="{ color: 'var(--stance-color-foreground)' }">
        <Accordion v-model="multiple" type="multiple">
          <AccordionItem value="shipping">
            <AccordionHeader>Shipping</AccordionHeader>
            <AccordionContent>Orders ship within 2 business days via standard courier.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="returns">
            <AccordionHeader>Returns</AccordionHeader>
            <AccordionContent>Returns are accepted within 30 days of delivery.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="warranty">
            <AccordionHeader>Warranty</AccordionHeader>
            <AccordionContent>Two-year limited warranty on manufacturing defects.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Variant>

    <Variant title="Narrow container (responsive check)">
      <div class="mx-auto max-w-[240px] border p-4" data-theme="neutral" :style="{ color: 'var(--stance-color-foreground)' }">
        <Accordion v-model="narrowSingle">
          <AccordionItem value="shipping">
            <AccordionHeader>Shipping</AccordionHeader>
            <AccordionContent>Orders ship within 2 business days via standard courier, even in a narrow column.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="returns">
            <AccordionHeader>Returns</AccordionHeader>
            <AccordionContent>Returns are accepted within 30 days of delivery.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Variant>
  </Story>
</template>
