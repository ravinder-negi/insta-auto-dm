"use client";

import { useActionState } from "react";
import { fieldClass } from "@/components/ui/controls";
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

export function ContactForm() {
  const [state, formAction, pending] = useActionState<
    ContactMessageState,
    FormData
  >(submitContactMessage, undefined);

  if (state && "success" in state) {
    return (
      <div className="animate-fade-in-up flex flex-col items-center gap-3 rounded-2xl border border-zinc-200/70 bg-white px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
          <CheckIcon className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Message sent
        </h2>
        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          Thanks for reaching out — we&apos;ll get back to you by email soon.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200/70 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="name"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Name
        </label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
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
        <label
          htmlFor="email"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email
        </label>
        <div className="relative">
          <MailIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
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
        <label
          htmlFor="phone"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Phone
        </label>
        <div className="relative">
          <PhoneIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
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
        <label
          htmlFor="message"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
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
        <p className="animate-fade-in-up text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="brand-gradient mt-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
      >
        {pending ? "Sending…" : "Send message"}
        {!pending && <ArrowRightIcon className="h-4 w-4" />}
      </button>
    </form>
  );
}
