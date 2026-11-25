import type { Metadata } from "next";
import { HomeHeader } from "../_components/home/HomeHeader";
import { HomeFooter } from "../_components/home/HomeFooter";
import { displayFont, homeCssVars, homeWrapperClass } from "../_components/home/fonts";
import { ContactForm } from "@/features/contact/components/ContactForm";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Contact Us — DMLink",
  description: "Have a question about DMLink? Send us a message.",
};

export default function ContactPage() {
  return (
    <div className={homeWrapperClass} style={homeCssVars}>
      <HomeHeader />

      <main className="mx-auto max-w-[540px] px-6 py-16 sm:px-8 sm:py-20">
        <h1
          className={`${displayFont} m-0 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl`}
        >
          Contact us
        </h1>
        <p className="mt-2.5 text-[15px] text-[var(--muted)]">
          Questions, feedback, or need a hand getting set up? Send us a
          message and we&apos;ll reply by email.
        </p>

        <div className="mt-8">
          <ContactForm />
        </div>

        <div className="mt-10 space-y-1.5 border-t border-[var(--line)] pt-6 text-[14px] text-[var(--muted)]">
          <p>
            Email:{" "}
            <a
              href={`mailto:${COMPANY.email}`}
              className="font-medium text-[var(--accent)] underline hover:no-underline"
            >
              {COMPANY.email}
            </a>
          </p>
          <p>Address: {COMPANY.legalName}, {COMPANY.address}</p>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
