"use client";

import { useActionState } from "react";
import type { RuleFormState } from "./actions";

export interface RuleFormAccountOption {
  id: string;
  label: string;
}

export interface RuleFormInitialValues {
  instagram_account_id: string;
  name: string;
  keyword: string;
  instagram_media_id: string | null;
  dm_message: string;
}

export function RuleForm({
  accounts,
  action,
  initialValues,
  submitLabel,
}: {
  accounts: RuleFormAccountOption[];
  action: (state: RuleFormState, formData: FormData) => Promise<RuleFormState>;
  initialValues?: RuleFormInitialValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<RuleFormState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="instagram_account_id" className="text-sm font-medium">
          Instagram account
        </label>
        <select
          id="instagram_account_id"
          name="instagram_account_id"
          required
          defaultValue={initialValues?.instagram_account_id ?? ""}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/15"
        >
          <option value="" disabled>
            Select an account
          </option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Rule name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={initialValues?.name}
          placeholder="Send guide on GUIDE comment"
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/15"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="keyword" className="text-sm font-medium">
          Keyword
        </label>
        <input
          id="keyword"
          name="keyword"
          required
          defaultValue={initialValues?.keyword}
          placeholder="GUIDE"
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/15"
        />
        <p className="text-xs text-zinc-500">
          Matched case-insensitively against the full, trimmed comment text.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="instagram_media_id" className="text-sm font-medium">
          Post/reel ID (optional)
        </label>
        <input
          id="instagram_media_id"
          name="instagram_media_id"
          defaultValue={initialValues?.instagram_media_id ?? ""}
          placeholder="Leave blank to match on any post"
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/15"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="dm_message" className="text-sm font-medium">
          DM message
        </label>
        <textarea
          id="dm_message"
          name="dm_message"
          required
          rows={4}
          defaultValue={initialValues?.dm_message}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/15"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
