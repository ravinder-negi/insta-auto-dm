"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DotsIcon } from "./icons";

export interface RowMenuItem {
  label: string;
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
}

const MENU_WIDTH = 208; // w-52
const MENU_MARGIN = 6;

export function RowMenu({
  items,
  label = "More actions",
}: {
  items: RowMenuItem[];
  label?: string;
}) {
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

  const itemClass =
    "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
      >
        <DotsIcon className="h-4 w-4" />
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
            className="animate-fade-in-up z-50 w-52 rounded-xl border border-black/6 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900"
          >
            {items.map((item) =>
              item.href ? (
                <a
                  key={item.label}
                  role="menuitem"
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className={itemClass}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    item.onSelect?.();
                    setOpen(false);
                  }}
                  className={`${itemClass} ${
                    item.danger ? "text-rose-600 dark:text-rose-400" : ""
                  }`}
                >
                  {item.label}
                </button>
              )
            )}
          </div>,
          document.body
        )}
    </>
  );
}
