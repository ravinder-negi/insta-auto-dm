import { HomeHeader } from "./home/HomeHeader";
import { HomeFooter } from "./home/HomeFooter";
import { displayFont, homeCssVars, homeWrapperClass } from "./home/fonts";

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
    <div className={homeWrapperClass} style={homeCssVars}>
      <HomeHeader />

      <main className="mx-auto max-w-[760px] px-6 py-16 sm:px-8 sm:py-20">
        <h1
          className={`${displayFont} m-0 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl`}
        >
          {title}
        </h1>
        <p className="mt-2.5 text-sm text-[var(--muted)]">
          Last updated: {updated}
        </p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-[var(--muted)]">
          {children}
        </div>
      </main>

      <HomeFooter />
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
      <h2 className={`${displayFont} text-lg font-bold tracking-tight text-[var(--ink)]`}>
        {heading}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
