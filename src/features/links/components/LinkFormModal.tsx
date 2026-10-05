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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <div className="animate-fade-in-up relative flex max-h-[90vh] w-full max-w-xl flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-semibold tracking-tight text-white">
            {isEdit ? "Edit link" : "Add link"}
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
          {data.status === "loading" && <LinkFormSkeleton />}

          {data.status === "error" && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
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
            />
          )}
        </div>
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
    <div className="flex flex-col gap-5 rounded-2xl border border-black/6 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-5 dark:border-white/8 dark:bg-white/4">
      <SkeletonField labelWidth="w-10" />
      <SkeletonField labelWidth="w-24" />
      <SkeletonField labelWidth="w-8" />
      <SkeletonField labelWidth="w-10" />

      <div>
        <span className="mb-1.5 block h-3.5 w-24 animate-pulse rounded-full bg-black/8 dark:bg-white/10" />
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className="h-10 w-10 animate-pulse rounded-xl bg-zinc-100 dark:bg-white/8"
            />
          ))}
          <span className="h-9 w-36 animate-pulse rounded-xl bg-zinc-100 dark:bg-white/8" />
        </div>
      </div>

      <span className="h-16 animate-pulse rounded-xl border border-black/8 bg-black/4 dark:border-white/10 dark:bg-white/6" />
      <span className="h-16 animate-pulse rounded-xl border border-black/8 bg-black/4 dark:border-white/10 dark:bg-white/6" />

      <div className="flex items-center justify-end gap-2.5">
        <span className="h-10 w-20 animate-pulse rounded-xl bg-black/6 dark:bg-white/8" />
        <span className="h-10 w-28 animate-pulse rounded-xl bg-black/10 dark:bg-white/12" />
      </div>
    </div>
  );
}

function SkeletonField({ labelWidth }: { labelWidth: string }) {
  return (
    <div>
      <span
        className={`mb-1.5 block h-3.5 ${labelWidth} animate-pulse rounded-full bg-black/8 dark:bg-white/10`}
      />
      <span className="block h-11 animate-pulse rounded-xl bg-black/6 dark:bg-white/8" />
    </div>
  );
}
