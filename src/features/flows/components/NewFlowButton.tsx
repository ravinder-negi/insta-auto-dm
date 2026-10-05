"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { FlowFormModal } from "./FlowFormModal";

/** Opens the create-flow modal, trigger-driven like ConfirmAction — so it can
 *  be dropped in wherever "New flow" is offered (toolbar, empty state). */
export function NewFlowButton({
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
        <FlowFormModal
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            toast.success("Flow created.");
            router.refresh();
          }}
        />
      )}
    </>
  );
}
