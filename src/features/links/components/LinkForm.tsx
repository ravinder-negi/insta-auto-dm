"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LinkInBioPreview } from "./LinkInBioPreview";
import { useToast } from "@/components/ui/Toast";
import { ChevronDownIcon } from "@/components/icons";
import { ICON_OPTIONS } from "@/features/links/linkTypeIcons";
import type { LinkFormState } from "@/features/links/actions";
import type { LinkIconKey, LinkType } from "@/types";

const fieldClass =
  "w-full rounded-2xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none transition-all duration-200 placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10";

const primaryPillClass =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60";

const secondaryPillClass =
  "inline-flex min-h-[48px] items-center justify-center rounded-full border border-[var(--line)] bg-white px-6 text-[15px] font-bold text-[var(--ink)] transition-transform hover:-translate-y-0.5";

function SelectField({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${fieldClass} appearance-none pr-9 ${className}`}>
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
    </div>
  );
}

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
  onCancel,
  onSuccess,
  showPreview = true,
  bare = false,
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
  /** Renders Cancel as a button instead of a link to "/dashboard/links" —
   *  used when the form runs inside a modal. */
  onCancel?: () => void;
  /** Called when `action` reports success without redirecting — used inside
   *  a modal, which closes itself instead of navigating away. */
  onSuccess?: () => void;
  /** Hides the live-preview sidebar — off by default inside the modal, which
   *  is too narrow for a side-by-side preview. */
  showPreview?: boolean;
  /** Drops the form's own card border/background — used inside
   *  LinkFormModal, which already supplies that chrome. */
  bare?: boolean;
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<LinkFormState, FormData>(
    action,
    undefined
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

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
    <div
      className={
        showPreview ? "grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]" : undefined
      }
    >
      <form
        action={formAction}
        className={bare ? "flex flex-col gap-5" : "flex flex-col gap-5 rounded-[30px] border p-4 sm:p-5"}
        style={bare ? undefined : { borderColor: "var(--line)", backgroundColor: "#fff" }}
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
          <span className="mb-1.5 block text-sm font-bold" style={{ color: "var(--ink)" }}>
            Icon (optional)
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {ICON_OPTIONS.map((option) => {
              const selected = icon === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.label}
                  aria-label={option.label}
                  aria-pressed={selected}
                  onClick={() => {
                    setIcon(option.value);
                    setCustomIconUrl("");
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-colors"
                  style={
                    selected
                      ? { borderColor: "var(--primary)", backgroundColor: "var(--tint)", color: "var(--primary)" }
                      : { borderColor: "transparent", backgroundColor: "var(--neutral-tint)", color: "var(--muted)" }
                  }
                >
                  <option.icon className="h-4 w-4" />
                </button>
              );
            })}

            {customIconUrl && (
              <span
                aria-label="Custom icon"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border-2"
                style={{ borderColor: "var(--primary)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL */}
                <img src={customIconUrl} alt="" className="h-full w-full object-cover" />
              </span>
            )}

            <label htmlFor={fileInputId} className={`${secondaryPillClass} min-h-[40px] cursor-pointer px-4 text-xs`}>
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
          <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
            Recommended: 512×512px, PNG or SVG (max 2MB).
          </p>
          <input type="hidden" name="icon" value={icon} />
          <input type="hidden" name="custom_icon_url" value={customIconUrl} />
        </div>

        <ToggleField
          label="Show on profile"
          description="Make this link visible on your public profile page."
          name="is_active"
          checked={isActive}
          onChange={setIsActive}
        />

        <ToggleField
          label="Featured"
          description="Highlight this link with an accent border and badge."
          name="is_featured"
          checked={isFeatured}
          onChange={setIsFeatured}
        />

        {state && "error" in state && (
          <p
            className="rounded-2xl border px-3.5 py-2.5 text-sm font-semibold"
            style={{ borderColor: "var(--danger-border)", backgroundColor: "var(--danger-tint-faint)", color: "var(--danger-deep)" }}
          >
            {state.error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2.5">
          {onCancel ? (
            <button type="button" onClick={onCancel} className={secondaryPillClass}>
              Cancel
            </button>
          ) : (
            <Link href="/dashboard/links" className={secondaryPillClass}>
              Cancel
            </Link>
          )}
          <button type="submit" disabled={pending || uploading} className={primaryPillClass}>
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>

      {showPreview && (
      <aside className="lg:sticky lg:top-6">
        <div className="rounded-[30px] border p-6" style={{ borderColor: "var(--line)", backgroundColor: "#fff" }}>
          <h2 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--ink)" }}>
            Live preview
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
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
      )}
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
      <span className="mb-1.5 block text-sm font-bold" style={{ color: "var(--ink)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function ToggleField({
  label,
  description,
  name,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  name: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border px-3.5 py-3" style={{ borderColor: "var(--line)" }}>
      <div>
        <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>
          {label}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="flex h-[34px] w-[56px] shrink-0 items-center rounded-full p-1 transition-colors"
        style={{ backgroundColor: checked ? "var(--success)" : "var(--secondary-pale)" }}
      >
        <span
          className="h-[26px] w-[26px] rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(22px)" : "translateX(0)" }}
        />
      </button>
      <input type="hidden" name={name} value={checked ? "on" : ""} />
    </div>
  );
}
