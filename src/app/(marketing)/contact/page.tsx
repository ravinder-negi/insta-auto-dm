import type { Metadata } from "next";
import { LandingHeader } from "../_components/LandingHeader";
import { LandingFooter } from "../_components/LandingFooter";
import { ContactForm } from "@/features/contact/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — Auto DM",
  description: "Have a question about Auto DM? Send us a message.",
};

export default function ContactPage() {
  return (
    <div className="app-surface flex min-h-screen flex-col">
      <LandingHeader />

      <main className="w-full flex-1 px-6 sm:px-10 lg:px-25">
        <div className="mx-auto max-w-xl py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Contact us
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Questions, feedback, or need a hand getting set up? Send us a
            message and we&apos;ll reply by email.
          </p>

          <div className="mt-8">
            <ContactForm />
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
