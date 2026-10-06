import { LandingHeader } from "./LandingHeader";
import { LandingFooter } from "./LandingFooter";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-surface flex min-h-screen flex-col">
      <LandingHeader />

      <main className="w-full flex-1 px-6 sm:px-10 lg:px-25">
        <div className="mx-auto max-w-3xl py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {title}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Last updated: {updated}
          </p>

          <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {children}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {heading}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
