import { Reveal } from "../Reveal";
import { displayFont } from "./fonts";

const CARDS = [
  {
    bg: "bg-[var(--accent)]",
    title: "Follow and email gates",
    desc: "Require a follow before the DM, or collect an email before the content is delivered. Every lead lands in a list for its rule.",
    icon: (
      <>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
  },
  {
    bg: "bg-[var(--violet)]",
    title: "Lead magnets",
    desc: "Offer gated downloads, like guides and checklists, that people unlock inside the conversation.",
    icon: (
      <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14" />
    ),
  },
  {
    bg: "bg-[var(--accent)]",
    title: "Products",
    desc: "Showcase products in your bio and DMs, with a link straight to where people can buy.",
    icon: (
      <path d="M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0" />
    ),
  },
];

export function HomeLeadsMagnets() {
  return (
    <div id="leads" className="relative overflow-hidden bg-[var(--ink)] text-white">
      <div className="ha-blob1 pointer-events-none absolute -top-25 -right-30 h-115 w-115 rounded-full bg-[var(--accent)] opacity-32 blur-[120px]" />
      <div className="ha-blob2 pointer-events-none absolute -bottom-35 -left-30 h-120 w-120 rounded-full bg-[var(--violet)] opacity-40 blur-[120px]" />
      <div className="relative mx-auto flex max-w-[1920px] flex-col gap-14 px-6 py-20 sm:px-8 sm:py-28">
        <div className="flex flex-col items-start gap-4">
          <span className="text-sm font-bold tracking-[0.08em] text-[var(--secondary)] uppercase">
            Leads, magnets and products
          </span>
          <h2
            className={`${displayFont} m-0 max-w-[780px] text-4xl leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-[54px] sm:leading-[1.05]`}
          >
            Grow your list while you chat
          </h2>
          <p className="m-0 max-w-[620px] text-lg text-[var(--muted-faint)]">
            Turn a comment into a follower, an email and a customer, all
            inside the same DM.
          </p>
        </div>

        <div className="flex flex-wrap items-stretch gap-8">
          <div className="flex min-w-0 flex-1 basis-[420px] flex-col gap-5">
            {CARDS.map((card, i) => (
              <Reveal
                key={card.title}
                delay={i * 80}
                className="ha-liftd flex items-start gap-4.5 rounded-[28px] border border-[#342F42] bg-[#211E2B] p-7"
              >
                <span
                  className={`flex h-12 w-12 flex-none items-center justify-center rounded-2xl text-white ${card.bg}`}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {card.icon}
                  </svg>
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className={`${displayFont} m-0 text-2xl font-bold`}>
                    {card.title}
                  </h3>
                  <p className="m-0 text-base text-[var(--muted-faint)]">{card.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal
            delay={240}
            className="relative flex min-w-0 flex-1 basis-[380px] flex-col items-center justify-center gap-6 rounded-[32px] bg-[var(--tint2)] px-6 py-10 text-[var(--ink)]"
          >
            <div className="ha-float2 absolute top-5.5 right-5 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-[13px] font-bold shadow-[0_12px_26px_-12px_color-mix(in srgb, var(--ink) 35%, transparent)]">
              <span className="ha-pdot h-2 w-2 rounded-full bg-[var(--success)]" />
              New link click
            </div>
            <div className="flex w-full max-w-[320px] flex-col items-center gap-3.5">
              <span
                className={`${displayFont} ha-pulsering flex h-21 w-21 items-center justify-center rounded-full bg-[var(--accent)] text-[34px] font-extrabold text-white`}
              >
                B
              </span>
              <div className="text-center">
                <div className={`${displayFont} text-[22px] font-bold`}>
                  @yourbrand
                </div>
                <div className="text-sm text-[var(--neutral-text)]">
                  Your short bio goes here
                </div>
              </div>
              <a
                href="#"
                className="ha-btn flex min-h-13 w-full items-center justify-center rounded-2xl bg-white font-bold"
              >
                Free guide
              </a>
              <a
                href="#"
                className="ha-btn flex min-h-13 w-full items-center justify-center rounded-2xl bg-white font-bold"
              >
                Shop the collection
              </a>
              <a
                href="#"
                className="ha-btn flex min-h-13 w-full items-center justify-center rounded-2xl bg-[var(--ink)] font-bold text-white"
              >
                Book a call
              </a>
              <div className="flex gap-2.5">
                <span className="ha-chiphover h-9 w-9 rounded-full bg-white" />
                <span className="ha-chiphover h-9 w-9 rounded-full bg-white" />
                <span className="ha-chiphover h-9 w-9 rounded-full bg-white" />
              </div>
            </div>
            <div className="max-w-[300px] text-center">
              <div className={`${displayFont} text-xl font-bold`}>
                Link-in-bio builder
              </div>
              <div className="text-sm text-[var(--neutral-text)]">
                Profile, custom links, socials and a theme of your own,
                with link click tracking.
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
