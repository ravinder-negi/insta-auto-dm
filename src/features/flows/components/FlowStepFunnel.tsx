export interface FunnelStep {
  stepOrder: number;
  label: string;
  reached: number;
}

export function FlowStepFunnel({
  funnel,
  total,
}: {
  funnel: FunnelStep[];
  total: number;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-black/6 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
      <div>
        <h3 className="text-sm font-semibold">Step funnel</h3>
        <p className="text-xs text-zinc-500">
          How many conversations reached each step, out of {total} started.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {funnel.map((step) => {
          const pct = total > 0 ? Math.round((step.reached / total) * 100) : 0;
          return (
            <div key={step.stepOrder} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-zinc-600 dark:text-zinc-300">
                  {step.stepOrder}. {step.label}
                </span>
                <span className="shrink-0 font-medium text-zinc-700 dark:text-zinc-200">
                  {step.reached} ({pct}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/8">
                <div
                  className="brand-gradient h-full rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
