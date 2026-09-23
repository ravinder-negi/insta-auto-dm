import {
  BoltIcon,
  ChartIcon,
  ClockIcon,
  UsersIcon,
} from "./dashboard/components/icons";
import { Reveal } from "./components/Reveal";

const REASONS = [
  {
    icon: ClockIcon,
    tint: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    title: "Save time",
    desc: "Automate repetitive replies and focus on your business.",
  },
  {
    icon: BoltIcon,
    tint: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300",
    title: "Respond instantly",
    desc: "Never miss an opportunity with 24/7 automation.",
  },
  {
    icon: UsersIcon,
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
    title: "Capture leads",
    desc: "Collect followers and email addresses easily.",
  },
  {
    icon: ChartIcon,
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300",
    title: "Track performance",
    desc: "See what's working and optimize for better results.",
  },
];

export function LandingWhyChoose() {
  return (
    <section
      id="why-choose"
      className="w-full bg-brand-50/60 px-6 py-16 sm:px-10 lg:px-25 dark:bg-zinc-900/40"
    >
      <Reveal>
        <span className="text-xs font-semibold tracking-widest text-brand-600 uppercase dark:text-brand-400">
          Why choose Auto DM
        </span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          A smarter way to grow on Instagram
        </h2>
      </Reveal>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((r, i) => (
          <Reveal
            key={r.title}
            delay={i * 100}
            className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.tint}`}
            >
              <r.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {r.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {r.desc}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
