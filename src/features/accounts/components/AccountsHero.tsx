import { CheckIcon, ChatIcon, PlusIcon } from "@/components/icons";
import { ConnectAccountButton } from "./ConnectAccountButton";

const RING_CIRCUMFERENCE = 339.3; // 2 * PI * 54, the SVG arc radius below

export function AccountsHero({
  total,
  active,
  paused,
  repliesSent,
}: {
  total: number;
  active: number;
  paused: number;
  repliesSent: number;
}) {
  const activeLen = total ? (active / total) * RING_CIRCUMFERENCE : 0;
  const pausedLen = total ? (paused / total) * RING_CIRCUMFERENCE : 0;

  return (
    <div
      className="relative overflow-hidden rounded-[40px] text-white"
      style={{
        backgroundColor: "var(--ink)",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1.2px,transparent 1.2px)",
        backgroundSize: "30px 30px",
      }}
    >
      <div
        aria-hidden="true"
        className="animate-float pointer-events-none absolute -top-36 -left-24 h-[420px] w-[420px] rounded-full opacity-38 blur-[120px]"
        style={{ backgroundColor: "var(--primary)" }}
      />
      <div
        aria-hidden="true"
        className="animate-float-delayed pointer-events-none absolute -right-20 -bottom-40 h-[460px] w-[460px] rounded-full opacity-50 blur-[120px]"
        style={{ backgroundColor: "var(--violet)" }}
      />

      <div className="relative flex flex-wrap items-center gap-10 p-8 sm:p-12">
        <div className="flex min-w-0 flex-1 basis-[380px] flex-col items-start gap-5">
          <span
            className="inline-flex items-center gap-2.5 rounded-full border py-1.5 pr-4 pl-3 text-xs font-bold tracking-widest uppercase"
            style={{ borderColor: "rgba(255,255,255,0.2)", color: "#E4DEF7" }}
          >
            <span className="animate-pulse-soft h-2 w-2 rounded-full" style={{ backgroundColor: "var(--violet)" }} />
            Instagram accounts
          </span>
          <h1 className="text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.05] font-extrabold tracking-tight">
            Your accounts, on{" "}
            <span className="relative inline-block" style={{ color: "var(--secondary)" }}>
              autopilot
            </span>
          </h1>
          <p className="max-w-md text-lg" style={{ color: "var(--muted-faint)" }}>
            Connect the accounts you want to automate comment replies for, then pause or switch
            any of them in one tap.
          </p>
          <ConnectAccountButton
            className="inline-flex min-h-[54px] items-center gap-2.5 rounded-full px-7 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: "var(--primary)", boxShadow: "0 16px 30px -12px color-mix(in srgb, var(--primary) 60%, transparent)" }}
          >
            <PlusIcon className="h-4.5 w-4.5" />
            Connect Instagram account
          </ConnectAccountButton>
        </div>

        <div className="relative flex min-w-0 flex-1 basis-[280px] flex-col items-center gap-5">
          <div
            aria-hidden="true"
            className="animate-float-pill absolute -top-4 right-0 z-10 hidden items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_16px_30px_-12px_rgba(0,0,0,0.45)] sm:flex"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: "var(--tint)" }}>
              <ChatIcon className="h-3.5 w-3.5 text-[var(--violet)]" />
            </span>
            New comment!
          </div>
          <div
            aria-hidden="true"
            className="animate-float-pill-delayed absolute top-16 -left-6 z-10 hidden items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_16px_30px_-12px_rgba(0,0,0,0.45)] sm:flex"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3DD9A0]/15">
              <CheckIcon className="h-3.5 w-3.5 text-[#3DD9A0]" />
            </span>
            Auto reply sent!
          </div>
          <div className="relative h-[180px] w-[180px]">
            <svg width="180" height="180" viewBox="0 0 140 140" aria-hidden="true" className="-rotate-90">
              <circle cx="70" cy="70" r="54" fill="none" strokeWidth="13" stroke="rgba(255,255,255,0.1)" />
              <circle
                cx="70"
                cy="70"
                r="54"
                fill="none"
                strokeWidth="13"
                strokeLinecap="round"
                stroke="#3DD9A0"
                strokeDasharray={`${activeLen} ${RING_CIRCUMFERENCE}`}
                className="transition-[stroke-dasharray] duration-700 ease-out"
              />
              <circle
                cx="70"
                cy="70"
                r="54"
                fill="none"
                strokeWidth="13"
                strokeLinecap="round"
                stroke="#F5B84B"
                strokeDasharray={`${pausedLen} ${RING_CIRCUMFERENCE}`}
                strokeDashoffset={-activeLen}
                className="transition-[stroke-dasharray] duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <span className="text-[2.6rem] font-extrabold tracking-tight">
                {active}
                <span className="text-2xl" style={{ color: "var(--muted-faint)" }}>
                  /{total}
                </span>
              </span>
              <span className="mt-1.5 text-[13px] font-semibold" style={{ color: "var(--muted-faint)" }}>
                accounts live
              </span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            <span
              className="rounded-full border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <span style={{ color: "#3DD9A0" }}>●</span> {active} active
            </span>
            <span
              className="rounded-full border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <span style={{ color: "#F5B84B" }}>●</span> {paused} paused
            </span>
            <span
              className="rounded-full border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <span style={{ color: "var(--violet)" }}>●</span> {repliesSent} replies sent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
