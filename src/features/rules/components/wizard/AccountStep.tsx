"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { fieldClass } from "@/components/ui/controls";
import { CheckIcon, InstagramIcon, PlusIcon } from "@/components/icons";
import type { RuleWizardAccountOption } from "./shared";

export function AccountStep({
  accounts,
  selectedAccountId,
  onSelectAccount,
  name,
  onNameChange,
}: {
  accounts: RuleWizardAccountOption[];
  selectedAccountId: string;
  onSelectAccount: (id: string) => void;
  name: string;
  onNameChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-7">
      <fieldset>
        <div className="flex items-center justify-between gap-3">
          <legend className="text-sm font-semibold">Instagram account</legend>
          <Link
            href="/dashboard/accounts"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Connect another
          </Link>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          The account whose comments this AutoDM listens to.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {accounts.map((account) => {
            const active = account.id === selectedAccountId;

            return (
              <button
                key={account.id}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectAccount(account.id)}
                className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 ${
                  active
                    ? "border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/15 dark:border-brand-400/70 dark:bg-brand-500/10"
                    : "border-black/8 bg-white hover:border-brand-300 hover:bg-brand-50/40 dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-400/40 dark:hover:bg-white/10"
                }`}
              >
                <span className="relative shrink-0">
                  <span className="ig-gradient flex h-11 w-11 items-center justify-center rounded-full">
                    <Avatar
                      name={account.handle}
                      size="md"
                      className="h-9.5 w-9.5 border-2 border-white dark:border-zinc-900"
                    />
                  </span>
                  <span className="absolute -right-0.5 -bottom-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white dark:bg-zinc-900">
                    <InstagramIcon className="h-3 w-3 text-zinc-500" />
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {account.label}
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    Instagram
                  </span>
                </span>

                {active && (
                  <span className="brand-gradient flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col">
        <label htmlFor="rule_name" className="text-sm font-semibold">
          AutoDM name
        </label>
        <p className="mt-1 mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Only you see this — it keeps your AutoDM list easy to scan.
        </p>
        <input
          id="rule_name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="e.g. Send guide on pricing"
          maxLength={80}
          autoComplete="off"
          className={fieldClass}
        />
      </div>
    </div>
  );
}
