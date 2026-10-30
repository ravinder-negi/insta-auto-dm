import Link from "next/link";
import { ArrowLeftIcon, InstagramIcon } from "@/components/icons";

export function RuleFormPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
      <div className="flex min-w-0 flex-col gap-3">
        <Link
          href="/dashboard/rules"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-70"
          style={{ color: "var(--muted)" }}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to AutoDMs
        </Link>

        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: "var(--muted-soft)" }}>
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-[2rem]" style={{ color: "var(--ink)" }}>
            {title}
          </h1>
          <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--muted)" }}>
            {description}
          </p>
        </div>
      </div>

      <div
        className="hidden shrink-0 items-center gap-3.5 rounded-2xl p-4 lg:flex"
        style={{ backgroundImage: "linear-gradient(120deg,var(--tint) 0%,var(--tint2) 100%)" }}
      >
        <span className="ig-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_8px_18px_-8px_rgba(220,39,67,0.7)]">
          <InstagramIcon className="h-6 w-6" />
        </span>
        <div className="max-w-64">
          <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>
            Turn comments into conversations
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
            Automatically reply to Instagram comments and engage your audience 24/7.
          </p>
        </div>
      </div>
    </div>
  );
}
