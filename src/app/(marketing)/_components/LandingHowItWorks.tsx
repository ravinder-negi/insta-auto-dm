import { LandingDashboardPreview } from "./LandingDashboardPreview";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    title: "Connect your Instagram",
    desc: "Link your Instagram account securely.",
  },
  {
    title: "Create your automation",
    desc: "Set keywords and customized messages.",
  },
  {
    title: "Activate and grow",
    desc: "Turn on your rule and start engaging your audience automatically.",
  },
];

export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="w-full scroll-mt-8 px-6 py-10 sm:px-10 sm:py-16 lg:px-25"
    >
      <div className="grid gap-6 sm:gap-10 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-14">
        <Reveal>
          <span className="text-xs font-semibold tracking-widest text-brand-600 uppercase dark:text-brand-400">
            How it works
          </span>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            Get started in <span className="brand-text-gradient">3 easy steps</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Automate your Instagram engagement in just a few minutes.
          </p>

          <ol className="mt-5 space-y-5 sm:mt-8 sm:space-y-8">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative flex gap-3 pl-0 sm:gap-4">
                {i < STEPS.length - 1 && (
                  <span className="absolute top-8 left-4 h-full w-px -translate-x-1/2 bg-zinc-200 sm:top-9 sm:left-4.5 dark:bg-zinc-800" />
                )}
                <div className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm shadow-brand-500/30 sm:h-9 sm:w-9">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {step.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={150} className="flex items-center">
          <LandingDashboardPreview />
        </Reveal>
      </div>
    </section>
  );
}
