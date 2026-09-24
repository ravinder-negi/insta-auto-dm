"use client";

import Link from "next/link";
import { useActionState, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fieldClass } from "../components/controls";
import { primaryButtonClass, secondaryButtonClass } from "../components/styles";
import { useToast } from "../components/Toast";
import { DocumentIcon, TrashIcon } from "../components/icons";
import type { LeadMagnetFormState } from "./actions";

const FILE_MAX_BYTES = 20 * 1024 * 1024;

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
}: {
  action: (
    prevState: LeadMagnetFormState,
    formData: FormData
  ) => Promise<LeadMagnetFormState>;
  initialValues?: LeadMagnetFormInitialValues;
  submitLabel: string;
  userId: string;
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<LeadMagnetFormState, FormData>(
    action,
    undefined
  );

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
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-2xl border border-black/6 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-5 dark:border-white/8 dark:bg-white/4"
    >
      <Field label="Title" htmlFor="title">
        <input
          id="title"
          name="title"
          required
          defaultValue={initialValues?.title}
          placeholder="e.g. Free social media planner"
          maxLength={80}
          className={fieldClass}
        />
      </Field>

      <Field label="Description (optional)" htmlFor="description">
        <textarea
          id="description"
          name="description"
          defaultValue={initialValues?.description ?? ""}
          placeholder="What's inside, and why it's useful."
          maxLength={280}
          rows={3}
          className={`${fieldClass} resize-none`}
        />
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          File
        </span>

        {fileUrl ? (
          <div className="flex items-center gap-3 rounded-xl border border-black/8 p-3 dark:border-white/10">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
              <DocumentIcon className="h-4 w-4" />
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-medium">
              {fileName || "Uploaded file"}
            </p>
            <button
              type="button"
              onClick={() => {
                setFileUrl("");
                setFileName("");
              }}
              aria-label="Remove file"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/15"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor={fileInputId}
            className={`${secondaryButtonClass} w-fit cursor-pointer`}
          >
            {uploading ? "Uploading..." : "Upload file"}
          </label>
        )}
        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept=".pdf,.zip,.doc,.docx,.epub"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <p className="mt-1.5 text-xs text-zinc-500">PDF, ZIP, DOC, or EPUB, up to 20MB.</p>
        <input type="hidden" name="file_url" value={fileUrl} />
        <input type="hidden" name="file_name" value={fileName} />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-black/8 px-3.5 py-3 dark:border-white/10">
        <div>
          <p className="text-sm font-medium">Show on profile</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Make this available to visitors on your public profile.
          </p>
        </div>
        <label className="relative inline-flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            name="is_active"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-zinc-200 transition-colors peer-checked:bg-brand-600 dark:bg-zinc-700" />
          <div className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      {state?.error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2.5">
        <Link href="/dashboard/lead-magnets" className={secondaryButtonClass}>
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending || uploading}
          className={primaryButtonClass}
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
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
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}
