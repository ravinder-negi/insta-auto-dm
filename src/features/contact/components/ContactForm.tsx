"use client";

import { useActionState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from "@/components/icons";
import {
  submitContactMessage,
  type ContactMessageState,
} from "@/features/contact/actions/submit-contact-message";

const fieldClass =
  "w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none transition-all duration-200 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<
    ContactMessageState,
    FormData
  >(submitContactMessage, undefined);

  if (state && "success" in state) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-6 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--success-tint)] text-[var(--success-text)]">
          <CheckIcon className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-semibold text-[var(--ink)]">
          Message sent
        </h2>
        <p className="max-w-sm text-sm text-[var(--muted)]">
          Thanks for reaching out — we&apos;ll get back to you by email soon.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-white p-6"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-[var(--ink)]">
          Name
        </label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Jane Doe"
            className={`${fieldClass} pl-10`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-[var(--ink)]">
          Email
        </label>
        <div className="relative">
          <MailIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={`${fieldClass} pl-10`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-medium text-[var(--ink)]">
          Phone
        </label>
        <div className="relative">
          <PhoneIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+1 555 123 4567"
            className={`${fieldClass} pl-10`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-medium text-[var(--ink)]">
          How can we help?
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Tell us a bit about what you need…"
          className={fieldClass}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
      >
        {pending ? "Sending…" : "Send message"}
        {!pending && <ArrowRightIcon className="h-4 w-4" />}
      </button>
    </form>
  );
}
