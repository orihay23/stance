<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  DatePicker,
  NumberField,
  Slider,
  Button,
} from "@stance/core";

// One plausible "event registration" form composing every primitive the
// Phase 15 showcase spec calls for. Validation follows the same
// invalid + #error-slot convention every field component already
// implements (see useErrorSlot) — submitting with required fields empty
// flips each one's `invalid` prop rather than inventing a parallel
// validation UI just for this page.
const form = reactive({
  name: "",
  email: "",
  bio: "",
  country: "",
  plan: "",
  notifications: true,
  contactMethod: "" as string | undefined,
  eventDate: undefined as Date | undefined,
  attendees: 1 as number | undefined,
  budget: 250,
  agreeTerms: false,
});

const submitted = ref(false);
const submittedSuccessfully = ref(false);

const errors = computed(() => ({
  name: submitted.value && form.name.trim() === "",
  email: submitted.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
  country: submitted.value && form.country === "",
  plan: submitted.value && form.plan === "",
  contactMethod: submitted.value && !form.contactMethod,
  eventDate: submitted.value && !form.eventDate,
  attendees: submitted.value && (form.attendees === undefined || form.attendees < 1),
  agreeTerms: submitted.value && !form.agreeTerms,
}));

const hasErrors = computed(() => Object.values(errors.value).some(Boolean));

function onSubmit() {
  submitted.value = true;
  submittedSuccessfully.value = !hasErrors.value;
}
</script>

# Form showcase

A live, interactive form composing ten primitives at once. Change the
palette/density picker in the nav and every field below re-themes together —
that's the point of embedding real components here instead of linking out to
isolated Histoire stories.

<form class="stance-showcase-form" novalidate @submit.prevent="onSubmit">
  <label class="stance-showcase-form__field">
    <span class="stance-showcase-form__label">Full name</span>
    <Input v-model="form.name" :invalid="errors.name" required placeholder="Ada Lovelace">
      <template #error>Enter your name.</template>
    </Input>
  </label>
  <label class="stance-showcase-form__field">
    <span class="stance-showcase-form__label">Email</span>
    <Input v-model="form.email" type="email" :invalid="errors.email" required placeholder="ada@example.com">
      <template #error>Enter a valid email address.</template>
    </Input>
  </label>
  <label class="stance-showcase-form__field">
    <span class="stance-showcase-form__label">Bio (optional)</span>
    <Textarea v-model="form.bio" placeholder="A sentence or two about yourself" />
  </label>
  <label class="stance-showcase-form__field">
    <span class="stance-showcase-form__label">Country</span>
    <Select v-model="form.country" :invalid="errors.country" aria-label="Country" placeholder="Choose a country">
      <option value="us">United States</option>
      <option value="ca">Canada</option>
      <option value="uk">United Kingdom</option>
      <option value="de">Germany</option>
      <template #error>Choose a country.</template>
    </Select>
  </label>
  <div class="stance-showcase-form__field">
    <RadioGroup v-model="form.plan" :invalid="errors.plan">
      <template #legend>Plan</template>
      <Radio value="free">Free</Radio>
      <Radio value="pro">Pro</Radio>
      <Radio value="enterprise">Enterprise</Radio>
      <template #error>Choose a plan.</template>
    </RadioGroup>
  </div>
  <div class="stance-showcase-form__field">
    <Switch v-model="form.notifications">Email me about product updates</Switch>
  </div>
  <div class="stance-showcase-form__field">
    <ToggleGroup v-model="form.contactMethod" :invalid="errors.contactMethod">
      <template #legend>Preferred contact method</template>
      <ToggleGroupItem value="email">Email</ToggleGroupItem>
      <ToggleGroupItem value="phone">Phone</ToggleGroupItem>
      <ToggleGroupItem value="mail">Mail</ToggleGroupItem>
      <template #error>Choose a contact method.</template>
    </ToggleGroup>
  </div>
  <label class="stance-showcase-form__field">
    <span class="stance-showcase-form__label">Event date</span>
    <ClientOnly>
      <DatePicker v-model="form.eventDate" :invalid="errors.eventDate">
        <template #error>Choose a date.</template>
      </DatePicker>
    </ClientOnly>
  </label>
  <label class="stance-showcase-form__field">
    <span class="stance-showcase-form__label">Attendees</span>
    <NumberField v-model="form.attendees" :min="1" :max="20" :invalid="errors.attendees">
      <template #error>Enter at least 1 attendee.</template>
    </NumberField>
  </label>
  <div class="stance-showcase-form__field">
    <span class="stance-showcase-form__label">Budget (USD {{ form.budget }})</span>
    <Slider v-model="form.budget" :min="0" :max="1000" :step="25" :format-options="{ style: 'currency', currency: 'USD' }" />
  </div>
  <div class="stance-showcase-form__field">
    <Checkbox v-model="form.agreeTerms" :invalid="errors.agreeTerms">
      I agree to the terms of service
      <template #error>You must agree to continue.</template>
    </Checkbox>
  </div>
  <div class="stance-showcase-form__actions">
    <Button type="submit">Register</Button>
    <p v-if="submittedSuccessfully" role="status" class="stance-showcase-form__success">
      Registration valid — nothing was actually submitted anywhere.
    </p>
    <p v-else-if="submitted && hasErrors" role="alert" class="stance-showcase-form__error-summary">
      Fix the highlighted fields above.
    </p>
  </div>
</form>
<style>
.stance-showcase-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 32rem;
}

.stance-showcase-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.stance-showcase-form__label {
  font-size: 0.875rem;
  font-weight: 500;
}

.stance-showcase-form__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.stance-showcase-form__success {
  color: var(--stance-color-success, green);
  font-size: 0.875rem;
}

.stance-showcase-form__error-summary {
  color: var(--stance-color-destructive);
  font-size: 0.875rem;
}
</style>
