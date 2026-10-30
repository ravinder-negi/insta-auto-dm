import type { ReactNode } from "react";

/** Dot-pattern hero banner shared by the AutoDMs and DM Flows list pages —
 *  same visual language as the accounts page hero, just light instead of dark. */
export function AutomationHero({
  eyebrow = "Automation",
  titlePlain,
  titleAccent,
  description,
  actions,
}: {
  eyebrow?: string;
  titlePlain: string;
  titleAccent: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[40px] border"
      style={{
        borderColor: "var(--line)",
        backgroundColor: "#fff",
        backgroundImage: "radial-gradient(#DDD6EC 1.2px,transparent 1.2px)",
        backgroundSize: "30px 30px",
      }}
    >
      <div
        aria-hidden="true"
        className="animate-float pointer-events-none absolute -top-32 -left-22 h-[380px] w-[380px] rounded-full opacity-70 blur-[90px]"
        style={{ backgroundColor: "var(--tint)" }}
      />
      <div
        aria-hidden="true"
        className="animate-float-delayed pointer-events-none absolute -top-20 -right-24 h-[420px] w-[420px] rounded-full opacity-80 blur-[100px]"
        style={{ backgroundColor: "var(--secondary-pale-border)" }}
      />

      <div className="relative flex flex-wrap items-center justify-between gap-7 p-9 sm:p-11">
        <div className="flex min-w-0 flex-1 basis-[380px] flex-col items-start gap-3.5">
          <span
            className="inline-flex items-center gap-2.5 rounded-full border py-1.5 pr-4 pl-3 text-xs font-bold tracking-widest uppercase"
            style={{ borderColor: "var(--line)", backgroundColor: "#fff", color: "var(--muted)" }}
          >
            <span className="animate-pulse-soft h-2 w-2 rounded-full" style={{ backgroundColor: "var(--success)" }} />
            {eyebrow}
          </span>
          <h1
            className="text-[clamp(2.5rem,4.6vw,3.75rem)] leading-[1.03] font-extrabold tracking-tight"
            style={{ color: "var(--ink)" }}
          >
            {titlePlain}
            <span style={{ color: "var(--primary)" }}>{titleAccent}</span>
          </h1>
          <p className="max-w-[520px] text-lg" style={{ color: "var(--muted)" }}>
            {description}
          </p>
        </div>

        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}
