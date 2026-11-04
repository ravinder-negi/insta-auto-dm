"use client";

import { useState, type ReactNode } from "react";
import { useInBrowser } from "@/lib/hooks/useInBrowser";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { RuleFormModal } from "./RuleFormModal";

/** Opens the create-rule modal, trigger-driven like ConfirmAction — so it can
 *  be dropped in wherever "New rule" is offered (toolbar, empty state). */
export function NewRuleButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>

      {open && (
        <RuleFormModal
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            toast.success("AutoDM created.");
            router.refresh();
          }}
        />
      )}
    </>
  );
}

/** Opens the create-rule modal as soon as the page loads — for links like
 *  /dashboard/rules?new=1 (the onboarding shortcut) — and drops the query
 *  param once it closes, so a refresh doesn't reopen it. */
export function OpenNewRuleOnLoad() {
  const [open, setOpen] = useState(true);
  const inBrowser = useInBrowser();
  const router = useRouter();
  const toast = useToast();

  function close() {
    setOpen(false);
    router.replace("/dashboard/rules");
  }

  // The modal portals into document.body, which doesn't exist while the
  // page is server-rendered.
  if (!open || !inBrowser) return null;

  return (
    <RuleFormModal
      onClose={close}
      onSaved={() => {
        close();
        toast.success("AutoDM created.");
      }}
    />
  );
}
