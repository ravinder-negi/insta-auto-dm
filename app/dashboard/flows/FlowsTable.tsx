"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Avatar } from "../components/Avatar";
import { ConfirmAction } from "../components/ConfirmAction";
import { SearchField, SelectField } from "../components/controls";
import { primaryButtonClass } from "../components/styles";
import { formatDate, formatTime } from "../components/format";
import {
  InstagramIcon,
  LayersIcon,
  MailIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "../components/icons";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import { deleteFlow, toggleFlowActive } from "./actions";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export interface FlowTableRow {
  id: string;
  name: string;
  trigger_keyword: string;
  instagram_media_id: string | null;
  step_count: number;
  is_active: boolean;
  created_at: string;
  accountId: string | null;
  accountHandle: string;
  accountActive: boolean;
}

export interface AccountFilterOption {
  id: string;
  handle: string;
}

const HEAD_CLASS =
  "px-5 py-3 text-left text-[11px] font-semibold tracking-[0.08em] text-zinc-400 uppercase";

export function FlowsTable({
  flows,
  accounts,
}: {
  flows: FlowTableRow[];
  accounts: AccountFilterOption[];
}) {
  const [query, setQuery] = useState("");
  const [accountId, setAccountId] = useState("all");
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastShown = useRef(false);

  useEffect(() => {
    if (toastShown.current) return;
    if (!searchParams.has("created") && !searchParams.has("updated")) return;
    toastShown.current = true;
    toast.success(searchParams.has("created") ? "Flow created." : "Flow updated.");
    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleToggle(id: string, name: string, nextActive: boolean) {
    try {
      await toggleFlowActive(id, nextActive);
      toast.success(`"${name}" ${nextActive ? "activated" : "paused"}.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update flow."));
    }
  }

  async function handleDelete(id: string, name: string) {
    try {
      await deleteFlow(id);
      toast.success(`"${name}" deleted.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete flow."));
    }
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return flows.filter((flow) => {
      if (accountId !== "all" && flow.accountId !== accountId) return false;
      if (!needle) return true;
      return `${flow.name} ${flow.trigger_keyword} ${flow.accountHandle}`
        .toLowerCase()
        .includes(needle);
    });
  }, [flows, query, accountId]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search flows..."
          className="sm:w-64"
        />
        <SelectField
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
          aria-label="Filter by account"
          icon={<InstagramIcon className="h-4 w-4" />}
          className="sm:w-56"
        >
          <option value="all">All accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              @{account.handle}
            </option>
          ))}
        </SelectField>
        <Link href="/dashboard/flows/new" className={primaryButtonClass}>
          <PlusIcon className="h-4 w-4" />
          New flow
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-black/6 bg-zinc-50/70 dark:border-white/8 dark:bg-white/3">
              <tr>
                <th className={HEAD_CLASS}>Flow name</th>
                <th className={HEAD_CLASS}>Trigger keyword</th>
                <th className={HEAD_CLASS}>Steps</th>
                <th className={HEAD_CLASS}>Account</th>
                <th className={HEAD_CLASS}>Status</th>
                <th className={HEAD_CLASS}>Created at</th>
                <th className={HEAD_CLASS}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6 dark:divide-white/8">
              {visible.map((flow) => (
                <tr
                  key={flow.id}
                  className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/3"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          flow.is_active
                            ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
                            : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                        }`}
                      >
                        <LayersIcon className="h-4 w-4" />
                      </span>
                      <span className="font-semibold">{flow.name}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700 dark:bg-white/8 dark:text-zinc-300">
                      {flow.trigger_keyword}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-zinc-500">{flow.step_count}</td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={flow.accountHandle}
                        size="sm"
                        muted={!flow.accountActive}
                      />
                      <span className="text-zinc-600 dark:text-zinc-300">
                        @{flow.accountHandle}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge
                      status={
                        !flow.accountActive
                          ? "failed"
                          : flow.is_active
                            ? "active"
                            : "paused"
                      }
                    />
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="text-zinc-600 dark:text-zinc-300">
                      {formatDate(flow.created_at)}
                    </p>
                    <p className="text-xs text-zinc-400">{formatTime(flow.created_at)}</p>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <form
                        action={() => handleToggle(flow.id, flow.name, !flow.is_active)}
                      >
                        <ToggleSwitchButton isActive={flow.is_active} />
                      </form>

                      <Link
                        href={`/dashboard/flows/${flow.id}/leads`}
                        title="View collected emails"
                        aria-label={`View emails collected by ${flow.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                      >
                        <MailIcon className="h-4 w-4" />
                      </Link>

                      <Link
                        href={`/dashboard/flows/${flow.id}/edit`}
                        title="Edit flow"
                        aria-label={`Edit ${flow.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>

                      <ConfirmAction
                        action={() => handleDelete(flow.id, flow.name)}
                        title="Delete this flow?"
                        description={`“${flow.name}” will stop starting for new comments, and any conversations in progress will stop advancing. This can't be undone.`}
                        confirmLabel="Delete flow"
                        trigger={
                          <button
                            type="button"
                            title="Delete flow"
                            aria-label={`Delete ${flow.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/15"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visible.length === 0 && (
          <p className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-zinc-500">
            <SearchIcon className="h-4 w-4" />
            No flows match the current filters.
          </p>
        )}
      </div>
    </div>
  );
}

function ToggleSwitchButton({ isActive }: { isActive: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      role="switch"
      aria-checked={isActive}
      disabled={pending}
      aria-label={isActive ? "Pause this flow" : "Activate this flow"}
      title={isActive ? "Pause flow" : "Activate flow"}
      className={`relative flex h-6 w-11 items-center rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
        isActive ? "brand-gradient" : "bg-zinc-200 dark:bg-zinc-700"
      }`}
    >
      {pending ? (
        <span className="mx-auto h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/60 border-t-white" />
      ) : (
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
            isActive ? "translate-x-5" : "translate-x-0"
          }`}
        />
      )}
    </button>
  );
}
