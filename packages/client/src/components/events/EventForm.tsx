import { useState } from "react";
import type { FormEvent } from "react";
import { EventCategory } from "@eventhub/shared";
import { Input, Select, Textarea } from "../ui/Field";
import Button from "../ui/Button";
import { eventCategoryLabel } from "../../lib/enumLabels";
import "./EventForm.css";

export interface EventFormValues {
  title: string;
  description: string;
  category: EventCategory;
  location: string;
  date: string;
  maxCapacity: string;
}

const emptyValues: EventFormValues = {
  title: "",
  description: "",
  category: EventCategory.Technology,
  location: "",
  date: "",
  maxCapacity: "",
};

function validate(form: EventFormValues) {
  const errors: Partial<Record<keyof EventFormValues, string>> = {};

  if (form.title.trim().length < 3) errors.title = "Give the event a longer title.";
  if (form.description.trim().length < 10) errors.description = "Add a bit more detail.";
  if (form.maxCapacity && (isNaN(Number(form.maxCapacity)) || Number(form.maxCapacity) <= 0)) {
    errors.maxCapacity = "Capacity must be a positive number.";
  }

  return errors;
}

interface EventFormProps {
  initialValues?: Partial<EventFormValues>;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: EventFormValues) => void;
}

export default function EventForm({
  initialValues,
  submitLabel,
  submittingLabel,
  isSubmitting,
  onSubmit,
}: EventFormProps) {
  const [form, setForm] = useState<EventFormValues>({ ...emptyValues, ...initialValues });
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormValues, string>>>({});

  function update<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    onSubmit(form);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <Input
        label="Title"
        htmlFor="event-title"
        value={form.title}
        onChange={(e) => update("title", e.target.value)}
        error={errors.title}
      />
      <Textarea
        label="Description"
        htmlFor="event-description"
        value={form.description}
        onChange={(e) => update("description", e.target.value)}
        error={errors.description}
      />
      <Select
        label="Category"
        htmlFor="event-category"
        value={form.category}
        onChange={(e) => update("category", Number(e.target.value) as EventCategory)}
      >
        {Object.entries(eventCategoryLabel).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      <div className="event-form__row">
        <Input
          label="Location (optional)"
          htmlFor="event-location"
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
        />
        <Input
          label="Date & time (optional)"
          htmlFor="event-date"
          type="datetime-local"
          value={form.date}
          onChange={(e) => update("date", e.target.value)}
        />
      </div>

      <Input
        label="Max capacity (optional)"
        htmlFor="event-capacity"
        type="number"
        min={1}
        value={form.maxCapacity}
        onChange={(e) => update("maxCapacity", e.target.value)}
        error={errors.maxCapacity}
      />

      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
