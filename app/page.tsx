import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingHeader } from "./LandingHeader";
import { LandingShowcase } from "./LandingShowcase";
import { LandingFeatures } from "./LandingFeatures";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingWhyChoose } from "./LandingWhyChoose";
import { LandingTestimonials } from "./LandingTestimonials";
import { LandingFaq } from "./LandingFaq";
import { LandingCta } from "./LandingCta";
import { LandingFooter } from "./LandingFooter";
import {
  ArrowRightIcon,
  BoltIcon,
  ChartIcon,
  SparkleIcon,
  UsersIcon,
} from "./dashboard/components/icons";

const STATS = [
  {
    icon: BoltIcon,
    title: "Instant replies",
    desc: "Engage your audience 24/7",
  },
  {
    icon: UsersIcon,
    title: "More engagement",
    desc: "Turn followers into customers",
  },
  {
    icon: ChartIcon,
    title: "Save time",
    desc: "Focus on what matters",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="app-surface flex min-h-screen flex-col">
      <LandingHeader />

      <main className="w-full flex-1 px-6 sm:px-10 lg:px-25">
        <div className="grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-8 lg:py-16">
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
            <span className="animate-fade-in-up inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold tracking-wide text-brand-700 uppercase dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-300">
              <SparkleIcon className="h-3.5 w-3.5" />
              Automate Instagram engagement
            </span>

            <h1 className="animate-fade-in-up mt-3 text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 [animation-delay:120ms] sm:text-4xl lg:text-5xl dark:text-zinc-50">
              Turn Instagram engagement into{" "}
              <span className="brand-text-gradient">conversations.</span>
            </h1>

            <p className="animate-fade-in-up mt-3 text-base leading-relaxed text-zinc-600 [animation-delay:240ms] dark:text-zinc-400">
              Automatically send personalized DMs when people comment on
              your posts or reels. Engage your audience, capture
              leads, and grow your business — on autopilot.
            </p>

            <div className="animate-fade-in-up mt-4 flex flex-col items-center gap-3 [animation-delay:360ms] sm:flex-row lg:items-start">
              <Link
                href="/signup"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-transform hover:scale-[1.02]"
              >
                Get started free
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                See how it works
              </a>
            </div>
            <p className="animate-fade-in-up mt-3 text-sm text-zinc-500 [animation-delay:420ms] dark:text-zinc-500">
              Set up in minutes. No credit card required.
            </p>
          </div>

          <div className="animate-fade-in-up [animation-delay:200ms]">
            <LandingShowcase />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 border-t border-zinc-200/70 py-8 sm:grid-cols-3 dark:border-zinc-800">
          {STATS.map((s, i) => (
            <div
              key={s.title}
              style={{ animationDelay: `${420 + i * 100}ms` }}
              className="animate-fade-in-up flex items-center justify-center gap-3 text-center sm:justify-start sm:text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {s.title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <LandingFeatures />
      <LandingHowItWorks />
      <LandingWhyChoose />
      <LandingTestimonials />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
