"use client";

import { useState, type FormEvent } from "react";

import { buttonVariants } from "@/components/ui/button";

const fieldClassName =
  "field-shell w-full min-w-0 max-w-full rounded-[20px] px-4 py-3 text-sm";

type DemoContactFormState = {
  name: string;
  contact: string;
  topic: string;
  message: string;
};

const initialForm: DemoContactFormState = {
  name: "",
  contact: "",
  topic: "General support",
  message: "",
};

export function ContactFormDemo() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setForm(initialForm);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-[0.68rem] uppercase tracking-[0.22em] text-midnightbrown/62">
            Name
          </span>
          <input
            className={fieldClassName}
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Your name"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-[0.68rem] uppercase tracking-[0.22em] text-midnightbrown/62">
            Email or phone
          </span>
          <input
            className={fieldClassName}
            value={form.contact}
            onChange={(event) =>
              setForm((current) => ({ ...current, contact: event.target.value }))
            }
            placeholder="you@example.com"
            required
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-[0.68rem] uppercase tracking-[0.22em] text-midnightbrown/62">
          Topic
        </span>
        <select
          className={fieldClassName}
          value={form.topic}
          onChange={(event) =>
            setForm((current) => ({ ...current, topic: event.target.value }))
          }
        >
          <option>General support</option>
          <option>Order help</option>
          <option>Returns draft question</option>
          <option>Seller interest</option>
          <option>Community/reporting</option>
          <option>AI Assistant Beta</option>
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-[0.68rem] uppercase tracking-[0.22em] text-midnightbrown/62">
          Message
        </span>
        <textarea
          rows={5}
          className={`${fieldClassName} rounded-[24px]`}
          value={form.message}
          onChange={(event) =>
            setForm((current) => ({ ...current, message: event.target.value }))
          }
          placeholder="Tell SKXNZ what you need help with."
          required
        />
      </label>

      {submitted ? (
        <p className="rounded-[20px] border border-teal/20 bg-teal/[0.08] px-4 py-3 text-sm leading-6 text-midnightbrown">
          Demo contact request captured locally in this interface only. Real support
          routing is planned before public launch.
        </p>
      ) : null}

      <button type="submit" className={buttonVariants({ variant: "primary", size: "lg" })}>
        Send Demo Request
      </button>
    </form>
  );
}
