import Link from "next/link";
import { ArrowRightIcon, SendIcon } from "./dashboard/components/icons";
import { Reveal } from "./components/Reveal";

export function LandingCta() {
  return (
    <section className="w-full px-6 pb-16 sm:px-10 lg:px-25">
      <Reveal className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-50 via-brand-100 to-rose-50 px-8 py-12 sm:px-14 dark:from-brand-900/20 dark:via-brand-800/10 dark:to-rose-900/10">
        <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-semibold tracking-widest text-brand-600 uppercase dark:text-brand-400">
              Ready to grow?
            </span>
            <h2 className="mt-2 max-w-md text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              Ready to automate your Instagram?
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Turn comments into customers and grow your business with Auto
              DM.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Link
              href="/signup"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold whitespace-nowrap text-white shadow-lg shadow-brand-500/30 transition-transform hover:scale-[1.02]"
            >
              Get started
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Set up in minutes. No credit card required.
            </p>
          </div>
        </div>

        <SendIcon className="animate-float pointer-events-none absolute right-10 bottom-6 hidden h-10 w-10 -rotate-12 text-brand-300 sm:block dark:text-brand-700" />
      </Reveal>
    </section>
  );
}
