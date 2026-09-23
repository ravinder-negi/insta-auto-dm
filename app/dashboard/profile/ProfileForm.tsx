"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "../components/Avatar";
import { LinkInBioPreview } from "../components/LinkInBioPreview";
import { fieldClass } from "../components/controls";
import { primaryButtonClass, secondaryButtonClass } from "../components/styles";
import {
  CameraIcon,
  CopyIcon,
  DesktopIcon,
  MobileIcon,
  TrashIcon,
} from "../components/icons";
import { useToast } from "../components/Toast";
import { updateProfile, type ProfileFormState } from "./actions";
import type { Profile, ProfileLink } from "@/lib/types";

const BIO_MAX_LENGTH = 280;
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export function ProfileForm({
  userId,
  profile,
  publicOrigin,
  links,
}: {
  userId: string;
  profile: Profile;
  publicOrigin: string;
  links: ProfileLink[];
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    undefined
  );

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [brandColor, setBrandColor] = useState(profile.brand_color ?? "#6366f1");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const fileInputId = useId();

  useEffect(() => {
    if (!state) return;
    if ("error" in state) toast.error(state.error);
    else toast.success("Profile saved.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setAvatarUrl(data.publicUrl);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemoveAvatar() {
    setAvatarUrl("");
  }

  const publicUrl = username ? `${publicOrigin}/${username}` : null;

  return (
    <form
      action={formAction}
      className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <div className="flex flex-col gap-8">
        <section className="rounded-2xl border border-black/6 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
          <h2 className="text-base font-semibold tracking-tight">Profile photo</h2>
          <p className="mt-1 text-sm text-zinc-500">
            This will be shown on your public page.
          </p>

          <div className="mt-4 flex items-center gap-4">
            <Avatar
              name={profile.display_name || username || "?"}
              src={avatarUrl}
              size="lg"
            />
            <label
              htmlFor={fileInputId}
              className={`${primaryButtonClass} cursor-pointer`}
            >
              <CameraIcon className="h-4 w-4" />
              {avatarUploading ? "Uploading..." : "Change photo"}
            </label>
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={avatarUploading}
            />
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={!avatarUrl || avatarUploading}
              aria-label="Remove photo"
              className={`${secondaryButtonClass} px-2.5! disabled:opacity-40`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">JPG or PNG, up to 5MB.</p>
          <input type="hidden" name="avatar_url" value={avatarUrl} />
        </section>

        <section className="rounded-2xl border border-black/6 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
          <h2 className="text-base font-semibold tracking-tight">Details</h2>
          <p className="mt-1 text-sm text-zinc-500">Tell people about yourself.</p>

          <div className="mt-4 flex flex-col gap-4">
            <Field label="Username">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">
                  {publicOrigin.replace(/^https?:\/\//, "")}/
                </span>
                <input
                  name="username"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value.toLowerCase())
                  }
                  placeholder="yourname"
                  pattern="[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?"
                  minLength={3}
                  maxLength={30}
                  required
                  className={fieldClass}
                />
              </div>
            </Field>

            <Field label="Display name">
              <input
                name="display_name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Jane Creator"
                maxLength={60}
                className={fieldClass}
              />
            </Field>

            <Field label="Bio">
              <textarea
                name="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Tell visitors what you do."
                maxLength={BIO_MAX_LENGTH}
                rows={3}
                className={`${fieldClass} resize-none`}
              />
              <p className="mt-1 text-right text-xs text-zinc-400">
                {bio.length}/{BIO_MAX_LENGTH}
              </p>
            </Field>

            <Field label="Brand color">
              <p className="-mt-1 mb-1.5 text-xs text-zinc-500">
                This color will be used on your public page (buttons, highlights, etc).
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(event) => setBrandColor(event.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-lg border border-black/10 bg-white p-1 dark:border-white/12 dark:bg-white/5"
                />
                <input
                  name="brand_color"
                  value={brandColor}
                  onChange={(event) => setBrandColor(event.target.value)}
                  className={`${fieldClass} font-mono uppercase`}
                />
              </div>
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-black/6 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Publish profile
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                When on, your profile page is live for anyone with the link.
              </p>
            </div>
            <label className="relative inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                name="is_published"
                defaultChecked={profile.is_published}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-zinc-200 transition-colors peer-checked:bg-indigo-600 dark:bg-zinc-700" />
              <div className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </label>
          </div>

          {publicUrl && (
            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-black/8 bg-zinc-50 px-3.5 py-2.5 dark:border-white/10 dark:bg-white/5">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm text-indigo-600 hover:underline dark:text-indigo-400"
              >
                {publicUrl}
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  toast.info("Link copied.");
                }}
                aria-label="Copy link"
                className="shrink-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <CopyIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>

        <div>
          <button
            type="submit"
            disabled={pending || avatarUploading}
            className={primaryButtonClass}
          >
            {pending ? "Saving..." : "Save profile"}
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-6">
        <div className="rounded-2xl border border-black/6 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Live preview</h2>
              <p className="mt-1 text-sm text-zinc-500">
                This is how your profile looks to visitors.
              </p>
            </div>
            <div className="flex shrink-0 gap-1 rounded-lg border border-black/8 p-1 dark:border-white/10">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                aria-label="Desktop preview"
                aria-pressed={device === "desktop"}
                className={`rounded-md p-1.5 transition-colors ${
                  device === "desktop"
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
                }`}
              >
                <DesktopIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                aria-label="Mobile preview"
                aria-pressed={device === "mobile"}
                className={`rounded-md p-1.5 transition-colors ${
                  device === "mobile"
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
                }`}
              >
                <MobileIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className={`mx-auto mt-5 ${device === "mobile" ? "max-w-70" : "max-w-full"}`}
          >
            <LinkInBioPreview
              brandColor={brandColor}
              avatarUrl={avatarUrl}
              displayName={displayName}
              username={username}
              bio={bio}
              links={links}
            />
          </div>
        </div>
      </aside>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}
