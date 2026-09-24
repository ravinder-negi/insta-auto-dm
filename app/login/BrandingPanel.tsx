import Link from "next/link";
import {
  BoltIcon,
  ChatIcon,
  InstagramIcon,
  SendIcon,
  TrendingIcon,
  UsersIcon,
} from "@/app/dashboard/components/icons";

const FEATURES = [
  { icon: BoltIcon, title: "Auto replies", desc: "Respond instantly" },
  { icon: UsersIcon, title: "More engagement", desc: "Build real connections" },
  {
    icon: TrendingIcon,
    title: "Grow faster",
    desc: "Turn comments into customers",
  },
];

export function BrandingPanel() {
  return (
    <div className="relative flex flex-1 overflow-hidden bg-zinc-950 lg:min-h-screen">
      <div className="animate-gradient-shift absolute inset-0 bg-[linear-gradient(120deg,#0a0a0f,color-mix(in_srgb,var(--color-brand-800)_45%,#0a0a0f),#0a0a0f_60%)]" />

      <div className="absolute top-1/4 -left-20 h-72 w-72 animate-float rounded-full bg-brand-500/25 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 animate-float-delayed rounded-full bg-brand-500/20 blur-3xl" />

      <svg
        className="absolute inset-x-0 bottom-0 h-2/5 w-full opacity-80"
        viewBox="0 0 800 320"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0 160 C 150 100, 300 220, 480 150 S 700 60, 800 130 V320 H0 Z"
          fill="url(#waveA)"
        />
        <path
          d="M0 220 C 180 260, 340 170, 520 230 S 680 300, 800 220 V320 H0 Z"
          fill="url(#waveB)"
        />
        <defs>
          <linearGradient id="waveA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-800)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-brand-900)" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="waveB" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-brand-900)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--color-brand-800)" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative z-10 flex flex-1 flex-col justify-between p-8 text-white sm:p-12">
        <Link
          href="/"
          className="animate-fade-in-up flex w-fit items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="brand-gradient flex h-10 w-10 items-center justify-center rounded-xl shadow-sm shadow-brand-500/30">
            <BoltIcon className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight">
              Auto DM
            </div>
            <div className="text-xs text-white/50">
              Engage. Automate. Grow.
            </div>
          </div>
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_280px] lg:items-start">
          <div className="animate-fade-in-up max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-white/70 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              Instagram automation
            </span>

            <h1 className="mt-5 text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl">
              Turn conversations
              <br />
              into{" "}
              <span className="bg-[linear-gradient(100deg,var(--color-brand-400),var(--color-brand-gradient-via)_60%,var(--color-brand-gradient-to))] bg-clip-text text-transparent">
                customers.
              </span>
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-base">
              Automate Instagram comments and DMs, engage your audience, and
              never miss an opportunity.
            </p>

            <div
              className="animate-fade-in-up mt-9 flex flex-col gap-4"
              style={{ animationDelay: "0.1s" }}
            >
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/8">
                    <f.icon className="h-4.5 w-4.5 text-brand-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {f.title}
                    </p>
                    <p className="text-xs text-white/50">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="animate-fade-in-up relative hidden h-96 lg:block"
            style={{ animationDelay: "0.2s" }}
          >
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 280 380"
              fill="none"
            >
              <path
                d="M85 55 C 130 110, 55 165, 100 210 S 145 290, 195 320"
                stroke="url(#flowGradient)"
                strokeWidth="1.5"
                className="animate-dash-flow"
              />
              <defs>
                <linearGradient id="flowGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand-400)" />
                  <stop offset="100%" stopColor="var(--color-brand-gradient-to)" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="210" r="3.5" fill="var(--color-brand-300)" className="animate-pulse-soft" />
              <circle
                cx="145"
                cy="290"
                r="3.5"
                fill="var(--color-brand-200)"
                className="animate-pulse-soft"
                style={{ animationDelay: "0.5s" }}
              />
            </svg>

            <div className="absolute top-0 left-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f09433,#e6683c_25%,#dc2743_50%,#cc2366_75%,#bc1888_100%)] shadow-[0_0_40px_-4px_rgba(220,39,67,0.6)]">
              <InstagramIcon className="h-8 w-8 text-white" />
            </div>

            <div className="absolute top-28 left-22 flex max-w-37.5 items-start gap-2 rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-zinc-800 shadow-xl">
              <ChatIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span className="text-xs leading-snug font-medium">
                New comment
                <br />
                &ldquo;GUIDE&rdquo;
              </span>
            </div>

            <div className="brand-gradient absolute top-51 left-2 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-lg shadow-brand-500/40">
              <BoltIcon className="h-3.5 w-3.5" />
              Auto DM sent
            </div>

            <SendIcon className="absolute right-6 bottom-8 h-9 w-9 rotate-45 text-brand-300" />
          </div>
        </div>

        <div
          className="animate-fade-in-up flex items-center gap-3"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          </div>
          <span className="text-xs text-white/40">
            Automate Today. Grow Tomorrow.
          </span>
        </div>
      </div>
    </div>
  );
}
