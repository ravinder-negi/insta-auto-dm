/** Primary call-to-action. The solid `bg-brand-600` sits under the gradient so
 *  the white label always has a dark surface behind it. Gradient stops are
 *  admin-configurable — see app/dashboard/admin/appearance and lib/color.ts. */
export const primaryButtonClass =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 bg-gradient-to-br from-[var(--color-brand-gradient-from)] via-[var(--color-brand-gradient-via)] to-[var(--color-brand-gradient-to)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100";

/** Neutral button that sits next to the primary one (Cancel, Manage, …). */
export const secondaryButtonClass =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-white/15 dark:bg-transparent dark:hover:bg-white/10";
