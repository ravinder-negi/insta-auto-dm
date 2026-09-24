import { StarIcon } from "./dashboard/components/icons";
import { Reveal } from "./components/Reveal";

const TESTIMONIALS = [
  {
    name: "Aisha R.",
    role: "Fitness Coach",
    quote:
      "Comments used to pile up faster than I could reply. Now every keyword gets an instant DM and I capture leads while I sleep.",
  },
  {
    name: "Marcus D.",
    role: "Ecommerce Founder",
    quote:
      "We turned our giveaway comments into an email list in one afternoon. Setup took minutes, no developer needed.",
  },
  {
    name: "Priya N.",
    role: "Content Creator",
    quote:
      "The DMs feel personal, not automated. My audience actually replies back, and I finally have time to create.",
  },
];

export function LandingTestimonials() {
  return (
    <section className="w-full px-6 py-16 sm:px-10 lg:px-25">
      <Reveal className="mx-auto max-w-xl text-center">
        <span className="text-xs font-semibold tracking-widest text-brand-600 uppercase dark:text-brand-400">
          Loved by creators &amp; brands
        </span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          Built for people growing on Instagram
        </h2>
      </Reveal>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal
            key={t.name}
            delay={i * 100}
            className="flex flex-col rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, si) => (
                <StarIcon key={si} className="h-4 w-4" />
              ))}
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white">
                {t.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {t.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.role}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
