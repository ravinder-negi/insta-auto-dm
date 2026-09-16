import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  /** Controls aligned to the right of the title on wide screens. */
  actions?: ReactNode;
  /** Full-height decoration (illustration/banner) next to the title block. */
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase dark:text-zinc-500">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-[2rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
      )}
      {aside}
    </div>
  );
}
