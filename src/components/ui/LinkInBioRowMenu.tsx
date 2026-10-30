"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DotsIcon } from "@/components/icons";

export interface LinkInBioRowMenuItem {
  label: string;
  onSelect: () => void;
}

const MENU_WIDTH = 190;
const MENU_MARGIN = 6;

/** Kebab dropdown for Products/Lead magnets rows and cards — styled to the
 *  Link-in-bio design system. */
export function LinkInBioRowMenu({ items, label = "More actions" }: { items: LinkInBioRowMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;

    function reposition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const menuHeight = menuRef.current?.offsetHeight ?? 0;
      const spaceBelow = window.innerHeight - rect.bottom;
      const flipUp = spaceBelow < menuHeight + MENU_MARGIN && rect.top > menuHeight + MENU_MARGIN;

      setPosition({
        top: flipUp ? rect.top - menuHeight - MENU_MARGIN : rect.bottom + MENU_MARGIN,
        left: Math.max(MENU_MARGIN, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - MENU_MARGIN)),
      });
    }

    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[var(--line)] bg-white text-[var(--ink)] transition-colors hover:border-[var(--secondary-border)] hover:bg-[var(--secondary-soft-bg)] hover:text-[var(--secondary)]"
      >
        <DotsIcon className="h-[17px] w-[17px]" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              visibility: position ? "visible" : "hidden",
            }}
            className="z-50 w-[190px] rounded-[20px] border border-[var(--line)] bg-white p-2 shadow-[0_30px_60px_-20px_color-mix(in srgb, var(--ink) 45%, transparent)]"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                }}
                className="flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-transparent px-3.5 text-left text-[15px] font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--secondary-soft-bg)]"
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
