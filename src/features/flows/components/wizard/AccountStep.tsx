"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { fieldClass } from "@/components/ui/controls";
import { CheckIcon, InstagramIcon, PlusIcon } from "@/components/icons";
import type { FlowWizardAccountOption } from "./shared";

export function AccountStep({
  accounts,
  selectedAccountId,
  onSelectAccount,
  name,
  onNameChange,
  locked = false,
}: {
  accounts: FlowWizardAccountOption[];
  selectedAccountId: string;
  onSelectAccount: (id: string) => void;
  name: string;
  onNameChange: (value: string) => void;
  /** Editing: the account can't change once the flow exists. */
  locked?: boolean;
}) {
  return (
    <div className="flex flex-col gap-7">
      <fieldset>
        <div className="flex items-center justify-between gap-3">
          <legend className="text-sm font-semibold">Instagram account</legend>
          {!locked && (
          <Link
            href="/dashboard/accounts"
            className="inline-flex items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline"
            style={{ color: "var(--primary)" }}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Connect another
          </Link>
          )}
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
          {locked
            ? "Can't be changed after creating — to use another account, create a new flow."
            : "The account where this flow will be applied."}
        </p>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {accounts.map((account) => {
            const active = account.id === selectedAccountId;

            return (
              <button
                key={account.id}
                type="button"
                aria-pressed={active}
                disabled={locked}
                onClick={() => onSelectAccount(account.id)}
                className={`${locked && !active ? "opacity-50" : ""} ${locked ? "cursor-not-allowed" : ""} flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 hover:border-[var(--secondary-border)] hover:bg-[var(--secondary-faint-bg)]`}
                style={
                  active
                    ? { borderColor: "var(--primary)", backgroundColor: "var(--tint-faint)", boxShadow: "0 0 0 2px color-mix(in srgb, var(--primary) 15%, transparent)" }
                    : { borderColor: "var(--line)", backgroundColor: "#fff" }
                }
              >
                <span className="relative shrink-0">
                  <span className="ig-gradient flex h-11 w-11 items-center justify-center rounded-full">
                    <Avatar name={account.handle} size="md" className="h-9.5 w-9.5 border-2 border-white" />
                  </span>
                  <span className="absolute -right-0.5 -bottom-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white">
                    <InstagramIcon className="h-3 w-3 text-[var(--muted)]" />
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold" style={{ color: "var(--ink)" }}>
                    {account.label}
                  </span>
                  <span className="block text-xs" style={{ color: "var(--muted)" }}>
                    Instagram
                  </span>
                </span>

                {active && (
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    <CheckIcon className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col">
        <label htmlFor="flow_name" className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Flow name
        </label>
        <p className="mt-1 mb-2 text-xs" style={{ color: "var(--muted)" }}>
          Only you see this — it keeps your flow list easy to scan.
        </p>
        <input
          id="flow_name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="e.g. Pricing conversation"
          maxLength={80}
          autoComplete="off"
          className={fieldClass}
        />
      </div>
    </div>
  );
}
