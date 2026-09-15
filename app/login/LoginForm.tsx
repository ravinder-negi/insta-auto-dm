"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined
  );

  return (
    <div className="w-full max-w-sm rounded-lg border border-black/10 p-8 dark:border-white/15">
      <div className="mb-6 flex gap-2 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`rounded-full px-4 py-1.5 ${
            mode === "signin"
              ? "bg-foreground text-background"
              : "text-zinc-500"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-full px-4 py-1.5 ${
            mode === "signup"
              ? "bg-foreground text-background"
              : "text-zinc-500"
          }`}
        >
          Sign up
        </button>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/15"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/15"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {pending
            ? "Please wait…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
    </div>
  );
}
