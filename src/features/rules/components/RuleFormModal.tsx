"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CloseIcon, InstagramIcon, PlusIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { WizardShellSkeleton } from "@/components/ui/WizardShell";
import {
  createRule,
  getRuleFormData,
  updateRule,
  type RuleFormData,
} from "@/features/rules/actions";
import { RuleWizard } from "./wizard/RuleWizard";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | ({ status: "ready" } & RuleFormData);

/** Mounted only while open (the caller gates it with `{open && <RuleFormModal
 *  .../>}`) so every open is a fresh mount — the data fetch below always
 *  starts from "loading" without needing to reset state on reopen. */
export function RuleFormModal({
  onClose,
  ruleId,
  onSaved,
}: {
  onClose: () => void;
  /** Present when editing an existing rule; absent when creating one. */
  ruleId?: string;
  onSaved: () => void;
}) {
  const [data, setData] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getRuleFormData(ruleId).then((result) => {
      if (cancelled) return;
      if ("error" in result) {
        setData({ status: "error", message: result.error });
        return;
      }
      setData({ status: "ready", ...result });
    });

    return () => {
      cancelled = true;
    };
  }, [ruleId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const isEdit = Boolean(ruleId);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <div className="animate-fade-in-up relative flex max-h-[90vh] w-full max-w-3xl flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-semibold tracking-tight text-white">
            {isEdit ? "Edit AutoDM" : "Create AutoDM"}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="thin-scrollbar overflow-y-auto">
          {data.status === "loading" && <WizardShellSkeleton stepCount={5} />}

          {data.status === "error" && (
            <div
              className="rounded-[30px] border px-5 py-6 text-sm font-semibold"
              style={{ borderColor: "var(--danger-border)", backgroundColor: "var(--danger-tint-faint)", color: "var(--danger-deep)" }}
            >
              {data.message}
            </div>
          )}

          {data.status === "ready" && data.accounts.length === 0 && (
            <div className="rounded-[30px] border p-6" style={{ borderColor: "var(--line)", backgroundColor: "#fff" }}>
              <EmptyState
                icon={<InstagramIcon className="h-6 w-6" />}
                title="Connect an account first"
                description="An AutoDM needs an Instagram account to listen to."
                action={
                  <Link
                    href="/dashboard/accounts"
                    className="mt-2 inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 text-sm font-bold text-white"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Connect Instagram account
                  </Link>
                }
              />
            </div>
          )}

          {data.status === "ready" && data.accounts.length > 0 && (
            <RuleWizard
              accounts={data.accounts}
              action={isEdit ? updateRule.bind(null, ruleId as string) : createRule}
              initialValues={data.initialValues}
              submitLabel={isEdit ? "Save changes" : "Create AutoDM"}
              onCancel={onClose}
              onSuccess={onSaved}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
