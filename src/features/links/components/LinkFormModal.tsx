"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/icons";
import {
  createLink,
  getLinkFormData,
  updateLink,
  type LinkFormData,
} from "@/features/links/actions";
import { LinkForm } from "./LinkForm";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | ({ status: "ready" } & LinkFormData);

/** Mounted only while open (the caller gates it with `{open && <LinkFormModal
 *  .../>}`) so every open is a fresh mount — the data fetch below always
 *  starts from "loading" without needing to reset state on reopen. */
export function LinkFormModal({
  onClose,
  linkId,
  onSaved,
}: {
  onClose: () => void;
  /** Present when editing an existing link; absent when creating one. */
  linkId?: string;
  onSaved: () => void;
}) {
  const [data, setData] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getLinkFormData(linkId).then((result) => {
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
  }, [linkId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const isEdit = Boolean(linkId);

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
        aria-label={isEdit ? "Edit link" : "Add link"}
        className="relative my-auto flex w-full max-w-xl flex-col gap-4.5 rounded-[32px] bg-white p-8 shadow-[0_50px_100px_-30px_rgba(0,0,0,.6)]"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="m-0 text-[28px] font-extrabold tracking-[-0.03em]">
            {isEdit ? "Edit link" : "Add link"}
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

        {data.status === "loading" && <LinkFormSkeleton />}

        {data.status === "error" && (
          <div
            role="alert"
            className="rounded-2xl border-[1.5px] border-[var(--danger-border)] bg-[var(--danger-tint-faint)] px-4 py-3 text-sm font-semibold text-[var(--danger-deep)]"
          >
            {data.message}
          </div>
        )}

        {data.status === "ready" && (
          <LinkForm
            action={isEdit ? updateLink.bind(null, linkId as string) : createLink}
            initialValues={data.initialValues}
            submitLabel={isEdit ? "Save changes" : "Add link"}
            userId={data.userId}
            profile={data.profile}
            onCancel={onClose}
            onSuccess={onSaved}
            showPreview={false}
            bare
          />
        )}
      </div>
    </div>,
    document.body
  );
}

/** Mirrors LinkForm's field layout so the modal doesn't jump in size once
 *  the profile data (needed for the live preview, even though it's hidden
 *  here) finishes loading. */
function LinkFormSkeleton() {
  return (
    <div className="flex flex-col gap-4.5">
      <SkeletonField labelWidth="w-10" />
      <SkeletonField labelWidth="w-24" />
      <SkeletonField labelWidth="w-8" />
      <SkeletonField labelWidth="w-10" />

      <div>
        <span className="mb-1.5 block h-3.5 w-24 animate-pulse rounded-full bg-[var(--neutral-tint)]" />
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <span key={index} className="h-10 w-10 animate-pulse rounded-xl bg-[var(--neutral-tint)]" />
          ))}
          <span className="h-9 w-36 animate-pulse rounded-full bg-[var(--neutral-tint)]" />
        </div>
      </div>

      <span className="h-16 animate-pulse rounded-2xl bg-[var(--neutral-tint)]" />
      <span className="h-16 animate-pulse rounded-2xl bg-[var(--neutral-tint)]" />

      <div className="flex items-center justify-end gap-2.5">
        <span className="h-10 w-20 animate-pulse rounded-full bg-[var(--neutral-tint)]" />
        <span className="h-10 w-28 animate-pulse rounded-full bg-[var(--neutral-tint)]" />
      </div>
    </div>
  );
}

function SkeletonField({ labelWidth }: { labelWidth: string }) {
  return (
    <div>
      <span className={`mb-1.5 block h-3.5 ${labelWidth} animate-pulse rounded-full bg-[var(--neutral-tint)]`} />
      <span className="block h-11 animate-pulse rounded-2xl bg-[var(--neutral-tint)]" />
    </div>
  );
}
