"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AuthBrandHeader } from "./AuthBrandHeader";
import { AuthCard } from "./AuthCard";
import { AuthTextField } from "./AuthTextField";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { AuthDivider } from "./AuthDivider";
import { PasswordField } from "./PasswordField";
import { MailIcon, UserIcon } from "@/components/icons";
import { displayFont } from "@/app/(marketing)/_components/home/fonts";
import { signUp, type AuthState } from "@/features/auth/actions/login";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp,
    undefined
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <AuthCard>
      <AuthBrandHeader />

      <div>
        <h1
          className={`${displayFont} text-[38px] leading-[1.05] font-extrabold tracking-[-0.03em] text-[var(--ink)]`}
        >
          Create your account
        </h1>
        <p className="mt-1.5 text-[var(--muted)]">Start turning comments into conversations</p>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <AuthTextField
          id="name"
          name="name"
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          icon={<UserIcon className="h-5 w-5" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <AuthTextField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<MailIcon className="h-5 w-5" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <PasswordField
            id="password"
            name="password"
            label="Password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-[13px] text-[var(--muted)]">Use at least 6 characters.</p>
        </div>

        <div className="flex flex-col gap-1">
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {state?.error && <p className="animate-fade-in-up text-sm text-red-600">{state.error}</p>}
        </div>

        <AuthSubmitButton pending={pending} idleLabel="Create account" pendingLabel="Creating account…" />
      </form>

      <p className="text-center text-[13px] text-[var(--muted)]">
        By creating an account you agree to the{" "}
        <Link href="/terms" className="font-semibold text-[var(--violet)] hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-semibold text-[var(--violet)] hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <AuthDivider />

      <p className="text-center text-[var(--muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-[var(--violet)] underline underline-offset-3 hover:no-underline"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
