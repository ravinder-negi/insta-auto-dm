"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { LinkFormModal } from "./LinkFormModal";

/** Opens the add-link modal, trigger-driven like ConfirmAction — so it can
 *  be dropped in wherever "Add link" is offered (toolbar, empty state). */
export function NewLinkButton({
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
        <LinkFormModal
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            toast.success("Link added.");
            router.refresh();
          }}
        />
      )}
    </>
  );
}
