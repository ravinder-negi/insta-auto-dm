"use client";

import { useState, type ReactNode } from "react";
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
