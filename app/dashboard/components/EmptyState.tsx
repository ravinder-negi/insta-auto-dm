import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center dark:border-white/15 dark:bg-white/3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
        {icon}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
