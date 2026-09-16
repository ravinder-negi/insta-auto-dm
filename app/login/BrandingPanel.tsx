const NODES = [
  { cx: 60, cy: 70, r: 4, delay: "0s" },
  { cx: 220, cy: 40, r: 3, delay: "0.6s" },
  { cx: 320, cy: 140, r: 4, delay: "1.2s" },
  { cx: 140, cy: 200, r: 3, delay: "1.8s" },
  { cx: 260, cy: 250, r: 5, delay: "0.3s" },
];

export function BrandingPanel() {
  return (
    <div className="relative flex flex-1 overflow-hidden bg-zinc-950 lg:min-h-screen">
      <div className="animate-gradient-shift absolute inset-0 bg-[linear-gradient(120deg,#0a0a0f,#171233,#0a0a0f_60%)]" />

      <div className="absolute top-1/4 -left-20 h-72 w-72 animate-float rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 animate-float-delayed rounded-full bg-violet-500/20 blur-3xl" />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 380 320"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          d="M60 70 L220 40 L320 140 L140 200 L260 250"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          className="animate-dash-flow"
        />
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        {NODES.map((n, i) => (
          <circle
            key={i}
            cx={n.cx}
            cy={n.cy}
            r={n.r}
            fill="#a5b4fc"
            className="animate-pulse-soft"
            style={{ animationDelay: n.delay }}
          />
        ))}
      </svg>

      <div className="relative z-10 flex flex-1 flex-col justify-between p-8 text-white sm:p-12">
        <div className="animate-fade-in-up flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <span className="text-sm font-semibold">A</span>
          </div>
          <span className="text-base font-semibold tracking-tight">
            Auto DM
          </span>
        </div>

        <div
          className="animate-fade-in-up max-w-md"
          style={{ animationDelay: "0.1s" }}
        >
          <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Turn conversations into customers.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-base">
            Automatically respond to comments and DMs, engage your audience,
            and never miss an opportunity.
          </p>
        </div>

        <div
          className="animate-fade-in-up hidden text-xs text-white/40 sm:block"
          style={{ animationDelay: "0.2s" }}
        >
          © {new Date().getFullYear()} Auto DM. All rights reserved.
        </div>
      </div>
    </div>
  );
}
