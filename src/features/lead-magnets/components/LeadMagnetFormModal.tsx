"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/icons";
import {
  createLeadMagnet,
  getLeadMagnetFormData,
  updateLeadMagnet,
  type LeadMagnetFormData,
} from "@/features/lead-magnets/actions";
import { LeadMagnetForm } from "./LeadMagnetForm";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | ({ status: "ready" } & LeadMagnetFormData);

/** Mounted only while open (the caller gates it with `{open &&
 *  <LeadMagnetFormModal .../>}`) so every open is a fresh mount — the data
 *  fetch below always starts from "loading" without needing to reset state
 *  on reopen. */
export function LeadMagnetFormModal({
  onClose,
  leadMagnetId,
  onSaved,
}: {
  onClose: () => void;
  /** Present when editing an existing lead magnet; absent when creating one. */
  leadMagnetId?: string;
  onSaved: () => void;
}) {
  const [data, setData] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getLeadMagnetFormData(leadMagnetId).then((result) => {
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
  }, [leadMagnetId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const isEdit = Boolean(leadMagnetId);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[var(--ink)]/55 p-5">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default border-0 bg-transparent"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit lead magnet" : "Add lead magnet"}
        className="relative my-auto flex w-full max-w-[520px] flex-col gap-4.5 rounded-[32px] bg-white p-8 shadow-[0_50px_100px_-30px_rgba(0,0,0,.6)]"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="m-0 text-[28px] font-extrabold tracking-[-0.03em]">
            {isEdit ? "Edit lead magnet" : "Add lead magnet"}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[var(--line)] bg-white text-[var(--ink)] transition-colors hover:border-[var(--secondary-border)] hover:bg-[var(--secondary-soft-bg)]"
          >
            <CloseIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        {data.status === "loading" && <LeadMagnetFormSkeleton />}

        {data.status === "error" && (
          <div
            role="alert"
            className="rounded-2xl border-[1.5px] border-[var(--danger-border)] bg-[var(--danger-tint-faint)] px-4 py-3 text-sm font-semibold text-[var(--danger-deep)]"
          >
            {data.message}
          </div>
        )}

        {data.status === "ready" && (
          <LeadMagnetForm
            action={isEdit ? updateLeadMagnet.bind(null, leadMagnetId as string) : createLeadMagnet}
            initialValues={data.initialValues}
            submitLabel={isEdit ? "Save changes" : "Add lead magnet"}
            userId={data.userId}
            onCancel={onClose}
            onSuccess={onSaved}
          />
        )}
      </div>
    </div>,
    document.body
  );
}

/** Mirrors LeadMagnetForm's field layout so the modal doesn't jump in size
 *  once the lead magnet's data finishes loading. */
function LeadMagnetFormSkeleton() {
  return (
    <div className="flex flex-col gap-4.5">
      <SkeletonField />
      <SkeletonField fieldClassName="h-20" />
      <div className="flex items-center gap-4">
        <span className="h-[84px] w-[84px] shrink-0 animate-pulse rounded-[24px] bg-[var(--neutral-tint)]" />
        <span className="h-[44px] w-32 animate-pulse rounded-full bg-[var(--neutral-tint)]" />
      </div>
      <span className="h-16 animate-pulse rounded-2xl bg-[var(--neutral-tint)]" />
    </div>
  );
}

function SkeletonField({ fieldClassName = "h-[50px]" }: { fieldClassName?: string }) {
  return (
    <div>
      <span className="mb-1.5 block h-3.5 w-24 animate-pulse rounded-full bg-[var(--neutral-tint)]" />
      <span className={`block animate-pulse rounded-2xl bg-[var(--neutral-tint)] ${fieldClassName}`} />
    </div>
  );
}
