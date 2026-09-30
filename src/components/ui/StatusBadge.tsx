const STYLES: Record<string, { pill: string; dot: string; label: string }> = {
  active: {
    pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    dot: "bg-emerald-500",
    label: "Active",
  },
  inactive: {
    pill: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    dot: "bg-zinc-400",
    label: "Inactive",
  },
  paused: {
    pill: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500",
    label: "Paused",
  },
  sent: {
    pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    dot: "bg-emerald-500",
    label: "Sent",
  },
  processing: {
    pill: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500",
    label: "Processing",
  },
  failed: {
    pill: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    dot: "bg-rose-500",
    label: "Failed",
  },
  follow_prompt_sent: {
    pill: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
    dot: "bg-brand-500",
    label: "Follow prompt sent",
  },
  skipped_already_prompted: {
    pill: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    dot: "bg-zinc-400",
    label: "Already prompted",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? {
    pill: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    dot: "bg-zinc-400",
    label: status,
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
