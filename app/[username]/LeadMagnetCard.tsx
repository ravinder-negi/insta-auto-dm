"use client";

import { useActionState } from "react";
import { submitLeadMagnetEmail, type LeadMagnetSubmitState } from "./actions";
import {
  CheckIcon,
  DownloadIcon,
  GiftIcon,
  InstagramIcon,
  MailIcon,
} from "../dashboard/components/icons";

export function LeadMagnetCard({
  id,
  title,
  description,
  brandColor,
  buttonRadiusClass,
}: {
  id: string;
  title: string;
  description: string | null;
  brandColor: string;
  buttonRadiusClass: string;
}) {
  const boundAction = submitLeadMagnetEmail.bind(null, id);
  const [state, formAction, pending] = useActionState<LeadMagnetSubmitState, FormData>(
    boundAction,
    undefined
  );

  const unlocked = state && "success" in state;

  return (
    <div
      className={`overflow-hidden p-6 text-left sm:p-7 ${buttonRadiusClass}`}
      style={{
        background: `linear-gradient(120deg, ${brandColor}1a, ${brandColor}0f 55%, ${brandColor}1f)`,
      }}
    >
      <div className="flex items-center gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2" style={{ color: brandColor }}>
            <GiftIcon className="h-5 w-5" />
            <span className="text-xs font-bold tracking-[0.12em] uppercase">Free resource</span>
          </div>

          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>

          {description && (
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">
              {description}
            </p>
          )}

          {unlocked ? (
            <a
              href={state.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.99] ${buttonRadiusClass}`}
              style={{ backgroundColor: brandColor }}
            >
              <DownloadIcon className="h-4 w-4" />
              Download now
            </a>
          ) : (
            <form action={formAction} className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <MailIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Enter your email address"
                  className={`w-full border border-black/5 bg-white py-3 pr-4 pl-10 text-sm text-zinc-900 shadow-sm outline-none transition-shadow placeholder:text-zinc-400 focus:ring-4 focus:ring-black/5 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 ${buttonRadiusClass}`}
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className={`inline-flex shrink-0 items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60 ${buttonRadiusClass}`}
                style={{ backgroundColor: brandColor }}
              >
                <DownloadIcon className="h-4 w-4" />
                {pending ? "Sending…" : "Get it free"}
              </button>
            </form>
          )}

          {state && "error" in state && (
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{state.error}</p>
          )}

          {!unlocked && (
            <p className="mt-3 text-xs text-zinc-400">No spam. Unsubscribe anytime.</p>
          )}
        </div>

        <ChecklistArtwork title={title} brandColor={brandColor} />
      </div>
    </div>
  );
}

/** Decorative stack-of-checklists illustration beside the offer copy. */
function ChecklistArtwork({ title, brandColor }: { title: string; brandColor: string }) {
  return (
    <div className="relative hidden h-48 w-60 shrink-0 lg:block" aria-hidden="true">
      <div className="absolute top-4 right-2 h-44 w-44 rotate-6 rounded-2xl bg-white/70 shadow-md dark:bg-white/10" />
      <div className="absolute top-0 right-8 h-44 w-44 -rotate-3 rounded-2xl bg-white p-4 shadow-lg dark:bg-zinc-900">
        <div className="flex items-start gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ background: "linear-gradient(45deg, #f58529, #dd2a7b, #8134af, #515bd4)" }}
          >
            <InstagramIcon className="h-4 w-4" />
          </span>
          <p className="line-clamp-2 text-[11px] leading-tight font-bold text-zinc-900 dark:text-zinc-50">
            {title}
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-2.5">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-center gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckIcon className="h-2.5 w-2.5" />
              </span>
              <span className="h-1.5 flex-1 rounded-full bg-zinc-100 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      <span
        className="absolute top-1 left-1 text-lg font-bold opacity-40"
        style={{ color: brandColor }}
      >
        ✦
      </span>
      <span
        className="absolute right-1 bottom-6 text-sm font-bold opacity-30"
        style={{ color: brandColor }}
      >
        ✦
      </span>
    </div>
  );
}
