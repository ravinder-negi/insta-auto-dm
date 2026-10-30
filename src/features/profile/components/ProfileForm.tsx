"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { displayFont } from "@/features/profile/fonts";
import {
  CameraIcon,
  CheckIcon,
  CopyIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
} from "@/components/icons";
import { useToast } from "@/components/ui/Toast";
import { updateProfile, type ProfileFormState } from "@/features/profile/actions";
import type { Profile } from "@/types";

const BIO_MAX_LENGTH = 280;
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$/;

type Values = {
  avatarUrl: string;
  bio: string;
  username: string;
  displayName: string;
  isPublished: boolean;
};

export function ProfileForm({
  userId,
  profile,
  publicOrigin,
}: {
  userId: string;
  profile: Profile;
  publicOrigin: string;
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    undefined
  );

  const initialValues = useMemo<Values>(
    () => ({
      avatarUrl: profile.avatar_url ?? "",
      bio: profile.bio ?? "",
      username: profile.username ?? "",
      displayName: profile.display_name ?? "",
      isPublished: profile.is_published,
    }),
    [profile]
  );

  const [values, setValues] = useState<Values>(initialValues);
  const [saved, setSaved] = useState<Values>(initialValues);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!state) return;
    if ("error" in state) {
      toast.error(state.error);
    } else {
      toast.success("Profile saved.");
      // Reacting to the server action's completion, not deriving state from
      // a render — the documented exception to "don't setState in effects".
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  function setField<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("Photo must be 5MB or smaller.");
      return;
    }

    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (error) {
        toast.error(error.message);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setField("avatarUrl", data.publicUrl);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemoveAvatar() {
    if (!values.avatarUrl) return;
    setField("avatarUrl", "");
  }

  function discard() {
    setValues(saved);
    toast.info("Changes discarded.");
  }

  const publicUrl = values.username ? `${publicOrigin}/${values.username}` : null;
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  const nameOk = values.displayName.trim().length > 0;
  const usernameOk =
    values.username.length >= 3 && USERNAME_PATTERN.test(values.username);
  // Brand color is edited on the Design page now — this just reflects the
  // saved value so the avatar ring and preview stay in sync with it.
  const brand = (profile.brand_color || "#6366F1").toUpperCase();

  const bioLen = values.bio.length;
  const bioDash = (Math.min(bioLen / BIO_MAX_LENGTH, 1) * 94.25).toFixed(2);
  const bioColor = bioLen >= BIO_MAX_LENGTH ? "var(--primary)" : bioLen > 240 ? "var(--warning)" : "var(--success)";
  const bioTextColor =
    bioLen >= BIO_MAX_LENGTH ? "var(--danger-strong)" : bioLen > 240 ? "var(--warning-text)" : "var(--muted)";

  const initial = (values.displayName.trim().charAt(0) || "?").toUpperCase();

  return (
    <form action={formAction} className="flex w-full flex-col gap-6">
      <input type="hidden" name="avatar_url" value={values.avatarUrl} />
        <input type="hidden" name="is_published" value={values.isPublished ? "on" : ""} />

        {/* IDENTITY */}
        <Card
          icon={<UserIcon className="h-5 w-5" />}
          iconBg="var(--tint)"
          iconColor="var(--accent)"
          title="Who you are"
          description="Your photo and name appear at the top of your public page."
        >
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col items-center gap-3">
              <span className="relative block h-28 w-28">
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ background: `conic-gradient(${brand}, var(--primary), ${brand})` }}
                />
                <span className="absolute inset-1 rounded-full bg-white p-1">
                  <span
                    className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full text-white ${displayFont} text-[44px] font-extrabold`}
                    style={{ background: brand }}
                  >
                    {values.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
                      <img
                        src={values.avatarUrl}
                        alt="Your profile photo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </span>
                </span>
              </span>
              <div className="flex items-center gap-2.5">
                <label
                  htmlFor={fileInputId}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-[15px] font-bold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  <CameraIcon className="h-4 w-4" />
                  {avatarUploading ? "Uploading…" : "Change photo"}
                </label>
                <input
                  ref={fileInputRef}
                  id={fileInputId}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                />
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={!values.avatarUrl || avatarUploading}
                  aria-label="Remove photo"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-[var(--line)] text-[var(--danger-strong)] transition-colors hover:border-[var(--danger-ring)] hover:bg-[var(--tint)] disabled:opacity-40"
                >
                  <TrashIcon className="h-[17px] w-[17px]" />
                </button>
              </div>
              <div className="text-xs text-[var(--muted)]">JPG or PNG, up to 5MB</div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-4.5" style={{ flexBasis: "260px" }}>
              <div className="flex flex-col gap-2">
                <label htmlFor="p-name" className="text-[15px] font-semibold">
                  Display name
                </label>
                <div
                  className="rounded-[14px] border-[1.5px] bg-[var(--bg)] px-3.5 transition-colors focus-within:border-[var(--accent)] focus-within:bg-white"
                  style={{ borderColor: nameOk ? "var(--line)" : "var(--danger-ring)" }}
                >
                  <input
                    id="p-name"
                    name="display_name"
                    type="text"
                    value={values.displayName}
                    onChange={(event) => setField("displayName", event.target.value)}
                    maxLength={60}
                    aria-invalid={!nameOk}
                    className="min-h-[50px] w-full border-0 bg-transparent outline-none"
                  />
                </div>
                {!nameOk && (
                  <div role="alert" className="text-[13px] font-semibold text-[var(--danger-strong)]">
                    Add a display name.
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="p-user" className="text-[15px] font-semibold">
                  Username
                </label>
                <div
                  className="flex flex-wrap items-center overflow-hidden rounded-[14px] border-[1.5px] bg-[var(--bg)] pr-3.5 transition-colors focus-within:border-[var(--accent)] focus-within:bg-white"
                  style={{ borderColor: usernameOk ? "var(--line)" : "var(--danger-ring)" }}
                >
                  <span className="py-0 pr-1 pl-3.5 text-[13px] whitespace-nowrap text-[var(--muted)]">
                    {publicOrigin.replace(/^https?:\/\//, "")}/
                  </span>
                  <input
                    id="p-user"
                    name="username"
                    type="text"
                    value={values.username}
                    onChange={(event) =>
                      setField(
                        "username",
                        event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 30)
                      )
                    }
                    minLength={3}
                    maxLength={30}
                    required
                    aria-invalid={!usernameOk}
                    className="min-h-[50px] min-w-[90px] flex-1 border-0 bg-transparent font-semibold outline-none"
                  />
                </div>
                {!usernameOk && (
                  <div role="alert" className="text-[13px] font-semibold text-[var(--danger-strong)]">
                    Use 3 to 30 letters, numbers, dots, dashes or underscores.
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* BIO */}
        <Card
          icon={<PencilIcon className="h-5 w-5" />}
          iconBg="var(--tint2)"
          iconColor="var(--violet)"
          title="Bio"
          description="Tell people about yourself."
          corner={
            <span
              className="inline-flex items-center gap-2.5"
              role="img"
              aria-label={`${bioLen} of ${BIO_MAX_LENGTH} characters used`}
            >
              <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
                <g transform="rotate(-90 19 19)" fill="none" strokeWidth="4" strokeLinecap="round">
                  <circle cx="19" cy="19" r="15" stroke="#EFEBF7" />
                  <circle
                    cx="19"
                    cy="19"
                    r="15"
                    stroke={bioColor}
                    strokeDasharray={`${bioDash} 94.25`}
                    className="transition-[stroke-dasharray,stroke]"
                  />
                </g>
              </svg>
              <span className="text-sm font-bold" style={{ color: bioTextColor }}>
                {bioLen}/{BIO_MAX_LENGTH}
              </span>
            </span>
          }
        >
          <div className="rounded-2xl border-[1.5px] border-[var(--line)] bg-[var(--bg)] px-4 py-2 focus-within:border-[var(--accent)] focus-within:bg-white">
            <label htmlFor="p-bio" className="sr-only">
              Bio
            </label>
            <textarea
              id="p-bio"
              name="bio"
              rows={4}
              value={values.bio}
              onChange={(event) =>
                setField("bio", event.target.value.slice(0, BIO_MAX_LENGTH))
              }
              placeholder="Tell visitors what you do."
              className="w-full resize-y border-0 bg-transparent py-2 leading-[1.55] outline-none"
            />
          </div>
        </Card>

        {/* PUBLISH */}
        <section
          className="relative overflow-hidden rounded-[32px] p-7 text-white"
          style={{ background: "var(--ink)" }}
        >
          <div
            className="animate-float pointer-events-none absolute -top-28 -right-20 h-80 w-80 rounded-full opacity-55 blur-[100px]"
            style={{ background: "var(--violet)" }}
          />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 flex-1" style={{ flexBasis: "260px" }}>
              <h2 className={`m-0 ${displayFont} text-2xl font-extrabold tracking-[-0.02em]`}>
                Publish profile
              </h2>
              <div className="mt-1 text-sm text-[var(--muted-faint)]">
                {values.isPublished
                  ? "On. Your profile page is live for anyone with the link."
                  : "Off. Only you can see your profile page."}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-[5px] text-[13px] font-bold"
                style={{
                  background: values.isPublished
                    ? "rgba(61,217,160,.18)"
                    : "rgba(245,184,75,.2)",
                  color: values.isPublished ? "#7CF0C2" : "#F5B84B",
                }}
              >
                <span
                  className={`h-[7px] w-[7px] rounded-full ${values.isPublished ? "animate-pulse-soft" : ""}`}
                  style={{ background: values.isPublished ? "#3DD9A0" : "#F5B84B" }}
                />
                {values.isPublished ? "Live" : "Draft"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={values.isPublished}
                aria-label="Publish profile"
                onClick={() => setField("isPublished", !values.isPublished)}
                className="h-9 w-[60px] shrink-0 cursor-pointer rounded-full border-0 p-1 transition-colors"
                style={{ background: values.isPublished ? "var(--success)" : "#5A5566" }}
              >
                <span
                  className="block h-7 w-7 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,.3)] transition-transform"
                  style={{
                    transform: values.isPublished ? "translateX(24px)" : "translateX(0)",
                  }}
                />
              </button>
            </div>
          </div>

          {publicUrl && (
            <div className="relative mt-4 flex flex-wrap items-center gap-2.5 rounded-[18px] border border-white/16 bg-white/8 py-2 pr-2 pl-4.5">
              <span className="min-w-0 flex-1 font-mono text-sm break-all" style={{ flexBasis: "200px" }}>
                {publicUrl}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  setCopied(true);
                  clearTimeout(copyTimer.current);
                  copyTimer.current = setTimeout(() => setCopied(false), 1600);
                }}
                className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl border-[1.5px] border-white/25 bg-transparent px-4.5 font-semibold text-white"
              >
                <CopyIcon className="h-4 w-4" />
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          )}
        </section>

        {/* SAVE BAR */}
        {dirty ? (
          <div
            role="region"
            aria-label="Unsaved changes"
            className="sticky bottom-5 z-10 flex flex-wrap items-center justify-between gap-3 rounded-full py-3.5 pr-4 pl-6 text-white shadow-[0_26px_50px_-18px_color-mix(in srgb, var(--ink) 65%, transparent)]"
            style={{ background: "var(--ink)" }}
          >
            <span className="inline-flex items-center gap-2.5 font-semibold">
              <span className="animate-pulse-soft h-[9px] w-[9px] rounded-full bg-[#F5B84B]" />
              You have unsaved changes
            </span>
            <span className="flex gap-2.5">
              <button
                type="button"
                onClick={discard}
                className="min-h-[46px] cursor-pointer rounded-full border-[1.5px] border-white/30 bg-transparent px-5 font-semibold text-white"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={pending || avatarUploading}
                className="min-h-[46px] cursor-pointer rounded-full border-0 px-6 font-bold text-white disabled:opacity-60"
                style={{ background: "var(--accent)" }}
              >
                {pending ? "Saving…" : "Save profile"}
              </button>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--muted)]">
            <CheckIcon className="h-[18px] w-[18px] text-[var(--success)]" />
            All changes saved
          </div>
        )}
    </form>
  );
}

function Card({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  corner,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  corner?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-[32px] border-[1.5px] border-[var(--line)] bg-white p-7">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-[13px]"
            style={{ background: iconBg, color: iconColor }}
          >
            {icon}
          </span>
          <div>
            <h2 className={`m-0 ${displayFont} text-2xl font-extrabold tracking-[-0.02em]`}>
              {title}
            </h2>
            <div className="text-sm text-[var(--muted)]">{description}</div>
          </div>
        </div>
        {corner}
      </div>
      {children}
    </section>
  );
}
