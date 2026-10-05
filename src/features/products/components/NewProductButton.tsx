"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ProductFormModal } from "./ProductFormModal";

/** Opens the add-product modal, trigger-driven like ConfirmAction — so it
 *  can be dropped in wherever "Add product" is offered (toolbar, empty
 *  state). */
export function NewProductButton({
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
        <ProductFormModal
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            toast.success("Product added.");
            router.refresh();
          }}
        />
      )}
    </>
  );
}
