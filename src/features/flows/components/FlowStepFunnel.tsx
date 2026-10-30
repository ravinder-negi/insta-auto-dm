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
    <div className="viz flex flex-col gap-4 rounded-[30px] border-[1.5px] border-[var(--line)] bg-white p-6">
      <div>
        <h3 className="m-0 text-lg font-extrabold tracking-[-0.01em]">Step funnel</h3>
        <p className="m-0 mt-1 text-sm text-[var(--muted)]">
          How many conversations reached each step, out of {total} started.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {funnel.map((step) => {
          const pct = total > 0 ? Math.round((step.reached / total) * 100) : 0;
          return (
            <div key={step.stepOrder} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-[var(--muted)]">
                  {step.stepOrder}. {step.label}
                </span>
                <span className="shrink-0 font-bold">
                  {step.reached} ({pct}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--neutral-tint)]">
                <div className="h-full rounded-full bg-[var(--viz-series-1)]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
