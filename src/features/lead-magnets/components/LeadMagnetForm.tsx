"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { DocumentIcon, TrashIcon, UploadIcon } from "@/components/icons";
import type { LeadMagnetFormState } from "@/features/lead-magnets/actions";

const FILE_MAX_BYTES = 20 * 1024 * 1024;

const fieldWrapClass =
  "flex items-center gap-2 rounded-[14px] border-[1.5px] border-[var(--line)] bg-[var(--bg)] px-3.5 transition-colors focus-within:border-[var(--primary)] focus-within:bg-white focus-within:ring-4 focus-within:ring-[var(--primary)]/15";
const fieldInputClass = "min-h-[50px] w-full border-0 bg-transparent outline-none";

export interface LeadMagnetFormInitialValues {
  title: string;
  description: string | null;
  file_url: string;
  file_name: string | null;
  is_active: boolean;
}

export function LeadMagnetForm({
  action,
  initialValues,
  submitLabel,
  userId,
  onCancel,
  onSuccess,
}: {
  action: (
    prevState: LeadMagnetFormState,
    formData: FormData
  ) => Promise<LeadMagnetFormState>;
  initialValues?: LeadMagnetFormInitialValues;
  submitLabel: string;
  userId: string;
  /** Renders Cancel as a button instead of a link to "/dashboard/lead-magnets"
   *  — used when the form runs inside a modal. */
  onCancel?: () => void;
  /** Called when `action` reports success without redirecting — used inside
   *  a modal, which closes itself instead of navigating away. */
  onSuccess?: () => void;
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<LeadMagnetFormState, FormData>(
    action,
    undefined
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const [fileUrl, setFileUrl] = useState(initialValues?.file_url ?? "");
  const [fileName, setFileName] = useState(initialValues?.file_name ?? "");
  const [uploading, setUploading] = useState(false);
  const [isActive, setIsActive] = useState(initialValues?.is_active ?? true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > FILE_MAX_BYTES) {
      toast.error("File must be 20MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "pdf";
      const path = `${userId}/file-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("lead-magnets")
        .upload(path, file, { upsert: true });

      if (error) {
        toast.error(error.message);
        return;
      }

      const { data } = supabase.storage.from("lead-magnets").getPublicUrl(path);
      setFileUrl(data.publicUrl);
      setFileName(file.name);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-4.5">
      {state && "error" in state && (
        <p
          role="alert"
          className="rounded-2xl border-[1.5px] border-[var(--danger-border)] bg-[var(--danger-tint-faint)] px-3.5 py-2.5 text-sm font-semibold text-[var(--danger-deep)]"
        >
          {state.error}
        </p>
      )}

      <Field label="Title" htmlFor="title">
        <div className={fieldWrapClass}>
          <input
            id="title"
            name="title"
            required
            defaultValue={initialValues?.title}
            placeholder="e.g. Free social media planner"
            maxLength={80}
            className={fieldInputClass}
          />
        </div>
      </Field>

      <Field label="Description (optional)" htmlFor="description">
        <div className={fieldWrapClass}>
          <textarea
            id="description"
            name="description"
            defaultValue={initialValues?.description ?? ""}
            placeholder="What's inside, and why it's useful."
            maxLength={280}
            rows={3}
            className={`${fieldInputClass} resize-none py-3`}
          />
        </div>
      </Field>

      <div className="flex flex-col gap-2">
        <span className="font-semibold">File</span>
        <div className="flex items-center gap-4">
          <span className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,var(--violet)_0%,var(--primary)_100%)] text-white/90">
            <DocumentIcon className="h-8 w-8" />
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            {fileUrl ? (
              <div className="flex items-center gap-2">
                <p className="m-0 min-w-0 flex-1 truncate font-semibold">
                  {fileName || "Uploaded file"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFileUrl("");
                    setFileName("");
                  }}
                  aria-label="Remove file"
                  className="flex h-[44px] w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[var(--danger-border)] text-[var(--danger-strong)] transition-colors hover:bg-[var(--danger-tint)]"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor={fileInputId}
                className="inline-flex w-fit min-h-[44px] cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-[var(--line)] bg-white px-4.5 font-semibold"
              >
                <UploadIcon className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload file"}
              </label>
            )}
            <p className="m-0 text-xs text-[var(--muted)]">PDF, ZIP, DOC, or EPUB, up to 20MB.</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept=".pdf,.zip,.doc,.docx,.epub"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <input type="hidden" name="file_url" value={fileUrl} />
        <input type="hidden" name="file_name" value={fileName} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-semibold">Status</span>
        <div role="group" aria-label="Status" className="flex gap-2">
          <StatusSegment label="Active" selected={isActive} onClick={() => setIsActive(true)} />
          <StatusSegment label="Hidden" selected={!isActive} onClick={() => setIsActive(false)} />
        </div>
        <input type="hidden" name="is_active" value={isActive ? "on" : ""} />
      </div>

      <div className="mt-1 flex flex-wrap gap-2.5">
        <button
          type="submit"
          disabled={pending || uploading}
          className="min-h-[54px] flex-1 basis-[200px] cursor-pointer rounded-full border-0 bg-[var(--primary)] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[54px] cursor-pointer rounded-full border-[1.5px] border-[var(--line)] bg-white px-6 font-semibold"
          >
            Cancel
          </button>
        ) : (
          <Link
            href="/dashboard/lead-magnets"
            className="inline-flex min-h-[54px] items-center rounded-full border-[1.5px] border-[var(--line)] bg-white px-6 font-semibold"
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}

function StatusSegment({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-[44px] cursor-pointer rounded-full border-[1.5px] px-4.5 font-bold transition-colors ${
        selected
          ? "border-[var(--ink)] bg-[var(--ink)] text-white"
          : "border-[var(--line)] bg-white text-[var(--ink)]"
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-2">
      <span className="font-semibold">{label}</span>
      {children}
    </label>
  );
}
