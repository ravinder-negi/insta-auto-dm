"use client";

import { useActionState, useEffect, useState } from "react";
import { primaryButtonClass } from "../../components/styles";
import { useToast } from "../../components/Toast";
import { CheckIcon } from "../../components/icons";
import { ACCENT_COLOR_OPTIONS } from "@/lib/accentColors";
import { AppearancePreview } from "./AppearancePreview";
import { updateAccentColor, type AppearanceFormState } from "./actions";

export function AppearanceForm({ accentColor }: { accentColor: string }) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<AppearanceFormState, FormData>(
    updateAccentColor,
    undefined
  );
  const [color, setColor] = useState(accentColor);

  useEffect(() => {
    if (!state) return;
    if ("error" in state) toast.error(state.error);
    else toast.success("Appearance saved.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form
        action={formAction}
        className="flex flex-col gap-6 rounded-2xl border border-black/6 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4"
      >
        <input type="hidden" name="accent_color" value={color} />

        <div>
          <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Accent color
          </span>
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            Applies to the logo, active nav, and primary buttons across the whole dashboard, for every user.
          </p>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLOR_OPTIONS.map((option) => {
              const selected = color.toLowerCase() === option.value.toLowerCase();
              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.name}
                  aria-label={option.name}
                  aria-pressed={selected}
                  onClick={() => setColor(option.value)}
                  style={{ backgroundColor: option.value }}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 ring-offset-2 transition-transform dark:ring-offset-zinc-950 ${
                    selected
                      ? "scale-110 ring-black/70 dark:ring-white/70"
                      : "ring-transparent hover:scale-105"
                  }`}
                >
                  {selected && <CheckIcon className="h-4 w-4 text-white" />}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Selected: {ACCENT_COLOR_OPTIONS.find((o) => o.value.toLowerCase() === color.toLowerCase())?.name ?? color}
          </p>
        </div>

        {state && "error" in state && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
            {state.error}
          </p>
        )}

        <div className="flex items-center justify-end">
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? "Saving…" : "Save appearance"}
          </button>
        </div>
      </form>

      <aside className="lg:sticky lg:top-6">
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Preview</p>
        <AppearancePreview accentColor={color} />
      </aside>
    </div>
  );
}
