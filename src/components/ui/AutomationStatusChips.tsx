export type AutomationStatusFilter = "all" | "active" | "paused" | "disabled";

const CHIP_DOTS: Record<AutomationStatusFilter, string> = {
  all: "var(--violet)",
  active: "var(--success)",
  paused: "var(--warning)",
  disabled: "var(--primary)",
};

const CHIP_LABELS: Record<AutomationStatusFilter, string> = {
  all: "All",
  active: "Active",
  paused: "Paused",
  disabled: "Account paused",
};

/** Filter-by-status pills shared by the AutoDMs and DM Flows list toolbars.
 *  "Disabled" means the rule/flow's own account is paused or disconnected,
 *  so it can never fire regardless of its own is_active flag. */
export function AutomationStatusChips({
  counts,
  value,
  onChange,
}: {
  counts: Record<AutomationStatusFilter, number>;
  value: AutomationStatusFilter;
  onChange: (next: AutomationStatusFilter) => void;
}) {
  return (
    <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2.5">
      {(Object.keys(CHIP_LABELS) as AutomationStatusFilter[]).map((key) => {
        const on = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={on}
            className="inline-flex min-h-[44px] items-center gap-2.5 rounded-full border py-0 pr-2 pl-4.5 text-[15px] font-bold transition-transform hover:-translate-y-0.5"
            style={{
              borderColor: on ? "var(--ink)" : "var(--line)",
              backgroundColor: on ? "var(--ink)" : "#fff",
              color: on ? "#fff" : "var(--ink)",
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHIP_DOTS[key] }} />
            <span>{CHIP_LABELS[key]}</span>
            <span
              className="inline-flex h-[30px] min-w-[30px] items-center justify-center rounded-full px-2 text-sm"
              style={{
                backgroundColor: on ? "rgba(255,255,255,.18)" : "var(--neutral-tint)",
                color: on ? "#fff" : "var(--neutral-text)",
              }}
            >
              {counts[key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
