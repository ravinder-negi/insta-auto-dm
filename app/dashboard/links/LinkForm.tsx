"use client";

import Link from "next/link";
import { useActionState, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LinkInBioPreview } from "../components/LinkInBioPreview";
import { SelectField, fieldClass } from "../components/controls";
import { primaryButtonClass, secondaryButtonClass } from "../components/styles";
import { useToast } from "../components/Toast";
import { ICON_OPTIONS } from "./linkTypeIcons";
import type { LinkFormState } from "./actions";
import type { LinkIconKey, LinkType } from "@/lib/types";

const LINK_TYPE_OPTIONS: { value: LinkType; label: string }[] = [
  { value: "website", label: "Website" },
  { value: "youtube", label: "YouTube" },
  { value: "blog", label: "Blog" },
  { value: "product", label: "Product" },
  { value: "custom", label: "Custom page" },
];

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export interface LinkFormInitialValues {
  title: string;
  subtitle: string | null;
  url: string;
  link_type: LinkType;
  icon: LinkIconKey | null;
  custom_icon_url: string | null;
  is_active: boolean;
  is_featured: boolean;
}

export function LinkForm({
  action,
  initialValues,
  submitLabel,
  userId,
  profile,
}: {
  action: (prevState: LinkFormState, formData: FormData) => Promise<LinkFormState>;
  initialValues?: LinkFormInitialValues;
  submitLabel: string;
  userId: string;
  profile: {
    brandColor: string;
    avatarUrl: string | null;
    displayName: string | null;
    username: string | null;
    bio: string | null;
  };
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<LinkFormState, FormData>(
    action,
    undefined
  );

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [subtitle, setSubtitle] = useState(initialValues?.subtitle ?? "");
  const [icon, setIcon] = useState<LinkIconKey>(initialValues?.icon ?? "link");
  const [customIconUrl, setCustomIconUrl] = useState(initialValues?.custom_icon_url ?? "");
  const [isActive, setIsActive] = useState(initialValues?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(initialValues?.is_featured ?? false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  async function handleUploadIcon(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("Icon must be 2MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const path = `${userId}/icon-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("link-icons")
        .upload(path, file, { upsert: true });

      if (error) {
        toast.error(error.message);
        return;
      }

      const { data } = supabase.storage.from("link-icons").getPublicUrl(path);
      setCustomIconUrl(data.publicUrl);
      setIcon("custom");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form
        action={formAction}
        className="flex flex-col gap-5 rounded-2xl border border-black/6 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-5 dark:border-white/8 dark:bg-white/4"
      >
        <Field label="Title" htmlFor="title">
          <input
            id="title"
            name="title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. My YouTube channel"
            maxLength={80}
            className={fieldClass}
          />
        </Field>

        <Field label="Subtitle (optional)" htmlFor="subtitle">
          <input
            id="subtitle"
            name="subtitle"
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            placeholder="e.g. Visit my personal website"
            maxLength={100}
            className={fieldClass}
          />
        </Field>

        <Field label="URL" htmlFor="url">
          <input
            id="url"
            name="url"
            type="url"
            required
            defaultValue={initialValues?.url}
            placeholder="https://..."
            className={fieldClass}
          />
        </Field>

        <Field label="Type" htmlFor="link_type">
          <SelectField
            id="link_type"
            name="link_type"
            defaultValue={initialValues?.link_type ?? "custom"}
          >
            {LINK_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Icon (optional)
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {ICON_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                title={option.label}
                aria-label={option.label}
                aria-pressed={icon === option.value}
                onClick={() => {
                  setIcon(option.value);
                  setCustomIconUrl("");
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-zinc-500 transition-colors dark:text-zinc-400 ${
                  icon === option.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
                    : "border-transparent bg-zinc-100 hover:bg-zinc-200 dark:bg-white/8 dark:hover:bg-white/12"
                }`}
              >
                <option.icon className="h-4 w-4" />
              </button>
            ))}

            {customIconUrl && (
              <span
                aria-label="Custom icon"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border-2 border-indigo-500"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL */}
                <img src={customIconUrl} alt="" className="h-full w-full object-cover" />
              </span>
            )}

            <label
              htmlFor={fileInputId}
              className={`${secondaryButtonClass} cursor-pointer text-xs`}
            >
              {uploading ? "Uploading..." : "Upload custom icon"}
            </label>
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg"
              className="hidden"
              onChange={handleUploadIcon}
              disabled={uploading}
            />
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">
            Recommended: 512×512px, PNG or SVG (max 2MB).
          </p>
          <input type="hidden" name="icon" value={icon} />
          <input type="hidden" name="custom_icon_url" value={customIconUrl} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-black/8 px-3.5 py-3 dark:border-white/10">
          <div>
            <p className="text-sm font-medium">Show on profile</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Make this link visible on your public profile page.
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
            <div className="h-6 w-11 rounded-full bg-zinc-200 transition-colors peer-checked:bg-indigo-600 dark:bg-zinc-700" />
            <div className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </label>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-black/8 px-3.5 py-3 dark:border-white/10">
          <div>
            <p className="text-sm font-medium">Featured</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Highlight this link with an accent border and badge.
            </p>
          </div>
          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
            <input
              type="checkbox"
              name="is_featured"
              checked={isFeatured}
              onChange={(event) => setIsFeatured(event.target.checked)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-zinc-200 transition-colors peer-checked:bg-indigo-600 dark:bg-zinc-700" />
            <div className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </label>
        </div>

        {state?.error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
            {state.error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2.5">
          <Link href="/dashboard/links" className={secondaryButtonClass}>
            Cancel
          </Link>
          <button type="submit" disabled={pending || uploading} className={primaryButtonClass}>
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>

      <aside className="lg:sticky lg:top-6">
        <div className="rounded-2xl border border-black/6 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
          <h2 className="text-base font-semibold tracking-tight">Live preview</h2>
          <p className="mt-1 text-sm text-zinc-500">
            This is how your link will appear on your profile.
          </p>
          <div className="mx-auto mt-5 max-w-70">
            <LinkInBioPreview
              brandColor={profile.brandColor}
              avatarUrl={profile.avatarUrl}
              displayName={profile.displayName}
              username={profile.username}
              bio={profile.bio}
              links={[
                {
                  id: "preview",
                  title: title || "Your link title",
                  subtitle: subtitle || null,
                  link_type: initialValues?.link_type ?? "custom",
                  icon,
                  custom_icon_url: customIconUrl || null,
                  is_featured: isFeatured,
                },
              ]}
            />
          </div>
        </div>
      </aside>
    </div>
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
