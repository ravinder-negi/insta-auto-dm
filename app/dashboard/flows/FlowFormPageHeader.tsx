import Link from "next/link";
import { ArrowLeftIcon, LayersIcon } from "../components/icons";
import { PageHeader } from "../components/PageHeader";

export function FlowFormPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/dashboard/flows"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to flows
      </Link>

      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        aside={
          <div className="hidden items-center gap-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 p-4 lg:flex dark:from-indigo-500/10 dark:to-violet-500/10">
            <span className="ig-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_8px_18px_-8px_rgba(220,39,67,0.7)]">
              <LayersIcon className="h-6 w-6" />
            </span>
            <div className="max-w-64">
              <p className="text-sm font-semibold">Turn one comment into a conversation</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Send a sequence of DMs that branch on how someone replies.
              </p>
            </div>
          </div>
        }
      />
    </div>
  );
}
