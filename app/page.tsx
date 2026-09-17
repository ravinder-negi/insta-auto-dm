import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingHeader } from "./LandingHeader";
import { LandingShowcase } from "./LandingShowcase";
import {
  ArrowRightIcon,
  BoltIcon,
  InfinityIcon,
  ShieldIcon,
  SparkleIcon,
  TrendingIcon,
  UsersIcon,
} from "./dashboard/components/icons";

const FEATURES = [
  {
    icon: BoltIcon,
    tint: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300",
    title: "Instant replies",
    desc: "Engage 24/7",
  },
  {
    icon: UsersIcon,
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
    title: "More followers",
    desc: "Build real connections",
  },
  {
    icon: TrendingIcon,
    tint: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300",
    title: "Grow faster",
    desc: "Turn comments into customers",
  },
];

const TRUST = [
  { icon: ShieldIcon, label: "Secure & Private" },
  { icon: InfinityIcon, label: "Reliable Automation" },
  { icon: BoltIcon, label: "Built for Growth" },
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
    <div className="app-surface flex h-screen flex-col overflow-hidden">
      <LandingHeader />

      <main className="flex w-full flex-1 flex-col overflow-hidden px-25 pt-1 pb-4">
        <div className="grid flex-1 items-center gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold tracking-wide text-brand-700 uppercase dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-300">
              <SparkleIcon className="h-3.5 w-3.5" />
              Automate Instagram engagement
            </span>

            <h1 className="mt-3 text-3xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-50">
              Auto-DM Instagram{" "}
              <span className="brand-text-gradient">commenters</span> who say
              the magic word
            </h1>

            <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Connect an Instagram account, set a keyword-to-DM rule, and
              every matching comment gets an instant private reply.
            </p>

            <div className="mt-4 flex flex-col items-center gap-2 lg:items-start">
              <Link
                href="/signup"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-transform hover:scale-[1.02]"
              >
                Get started
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Set up in minutes. No credit card required.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col items-center gap-2 text-center lg:flex-row lg:items-start lg:text-left"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${f.tint}`}
                  >
                    <f.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {f.title}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <LandingShowcase />
        </div>

        <div className="mt-3 flex flex-col items-center gap-3 border-t border-zinc-200/70 pt-3 dark:border-zinc-800">
          <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
            Trusted by modern businesses
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {TRUST.map((t) => (
              <div
                key={t.label}
                className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400"
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
