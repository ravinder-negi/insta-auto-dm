"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Avatar } from "../components/Avatar";
import { ConfirmAction } from "../components/ConfirmAction";
import { RowMenu } from "../components/RowMenu";
import { SearchField, SelectField } from "../components/controls";
import { primaryButtonClass } from "../components/styles";
import { formatDate, formatTime } from "../components/format";
import {
  BoltIcon,
  CopyIcon,
  InstagramIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "../components/icons";
import { Spinner } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import { deleteRule, duplicateRule, toggleRuleActive } from "./actions";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export interface RuleTableRow {
  id: string;
  name: string;
  keyword: string;
  instagram_media_id: string | null;
  require_follow: boolean;
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

export function RulesTable({
  rules,
  accounts,
}: {
  rules: RuleTableRow[];
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
    toast.success(
      searchParams.has("created") ? "Rule created." : "Rule updated."
    );
    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleToggle(id: string, name: string, nextActive: boolean) {
    try {
      await toggleRuleActive(id, nextActive);
      toast.success(`"${name}" ${nextActive ? "activated" : "paused"}.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update rule."));
    }
  }

  async function handleDuplicate(id: string, name: string) {
    try {
      await duplicateRule(id);
      toast.success(`Duplicated "${name}".`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to duplicate rule."));
    }
  }

  async function handleDelete(id: string, name: string) {
    try {
      await deleteRule(id);
      toast.success(`"${name}" deleted.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete rule."));
    }
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rules.filter((rule) => {
      if (accountId !== "all" && rule.accountId !== accountId) return false;
      if (!needle) return true;
      return `${rule.name} ${rule.keyword} ${rule.accountHandle}`
        .toLowerCase()
        .includes(needle);
    });
  }, [rules, query, accountId]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search rules..."
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
        <Link
          href="/dashboard/rules/new"
          className={primaryButtonClass}
        >
          <PlusIcon className="h-4 w-4" />
          New rule
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-black/6 bg-zinc-50/70 dark:border-white/8 dark:bg-white/3">
              <tr>
                <th className={HEAD_CLASS}>Rule name</th>
                <th className={HEAD_CLASS}>Keyword</th>
                <th className={HEAD_CLASS}>Account</th>
                <th className={HEAD_CLASS}>Post/reel</th>
                <th className={HEAD_CLASS}>Status</th>
                <th className={HEAD_CLASS}>Created at</th>
                <th className={HEAD_CLASS}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6 dark:divide-white/8">
              {visible.map((rule) => (
                <tr
                  key={rule.id}
                  className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/3"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          rule.is_active
                            ? "bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
                            : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                        }`}
                      >
                        <BoltIcon className="h-4 w-4" />
                      </span>
                      <span className="font-semibold">{rule.name}</span>
                      {rule.require_follow && (
                        <span
                          title="Requires follow before sending the DM"
                          className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
                        >
                          Follow-gated
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700 dark:bg-white/8 dark:text-zinc-300">
                      {rule.keyword}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={rule.accountHandle}
                        size="sm"
                        muted={!rule.accountActive}
                      />
                      <span className="text-zinc-600 dark:text-zinc-300">
                        @{rule.accountHandle}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-zinc-500">
                    {rule.instagram_media_id ? (
                      <span className="font-mono text-xs">
                        {rule.instagram_media_id}
                      </span>
                    ) : (
                      "All posts"
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge
                      status={
                        !rule.accountActive
                          ? "failed"
                          : rule.is_active
                            ? "active"
                            : "paused"
                      }
                    />
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="text-zinc-600 dark:text-zinc-300">
                      {formatDate(rule.created_at)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {formatTime(rule.created_at)}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <form
                        action={() =>
                          handleToggle(rule.id, rule.name, !rule.is_active)
                        }
                      >
                        <ToggleSwitchButton isActive={rule.is_active} />
                      </form>

                      <Link
                        href={`/dashboard/rules/${rule.id}/edit`}
                        title="Edit rule"
                        aria-label={`Edit ${rule.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>

                      <form action={() => handleDuplicate(rule.id, rule.name)}>
                        <DuplicateRuleButton ruleName={rule.name} />
                      </form>

                      <ConfirmAction
                        action={() => handleDelete(rule.id, rule.name)}
                        title="Delete this rule?"
                        description={`“${rule.name}” will stop replying to comments. This can't be undone.`}
                        confirmLabel="Delete rule"
                        trigger={
                          <button
                            type="button"
                            title="Delete rule"
                            aria-label={`Delete ${rule.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/15"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        }
                      />

                      <RowMenu
                        label={`More actions for ${rule.name}`}
                        items={[
                          {
                            label: "Copy keyword",
                            onSelect: () => {
                              navigator.clipboard?.writeText(rule.keyword);
                              toast.info("Keyword copied to clipboard.");
                            },
                          },
                          {
                            label: "Copy rule ID",
                            onSelect: () => {
                              navigator.clipboard?.writeText(rule.id);
                              toast.info("Rule ID copied to clipboard.");
                            },
                          },
                        ]}
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
            No rules match the current filters.
          </p>
        )}
      </div>
    </div>
  );
}

function DuplicateRuleButton({ ruleName }: { ruleName: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title="Duplicate rule"
      aria-label={`Duplicate ${ruleName}`}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/10 dark:hover:text-zinc-200"
    >
      {pending ? (
        <Spinner className="h-4 w-4 border-current/30 border-t-current" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
    </button>
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
      aria-label={isActive ? "Pause this rule" : "Activate this rule"}
      title={isActive ? "Pause rule" : "Activate rule"}
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
