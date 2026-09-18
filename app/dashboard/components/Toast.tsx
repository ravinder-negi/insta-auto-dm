"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from "./icons";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

const DURATION_MS = 4500;

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof CheckIcon; chip: string }
> = {
  success: {
    icon: CheckIcon,
    chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  error: {
    icon: AlertIcon,
    chip: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  },
  info: {
    icon: InfoIcon,
    chip: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
};

const ToastContext = createContext<{
  push: (variant: ToastVariant, message: string) => void;
} | null>(null);

const noopSubscribe = () => () => {};

// Portals must not render during the initial client render, or their output
// (absent from the server-rendered HTML) causes a hydration mismatch.
function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const mounted = useMounted();

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, variant, message }]);
      setTimeout(() => remove(id), DURATION_MS);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed inset-x-0 bottom-4 z-100 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
            {toasts.map((toast) => (
              <ToastCard
                key={toast.id}
                toast={toast}
                onDismiss={() => remove(toast.id)}
              />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const { icon: Icon, chip } = VARIANT_STYLES[toast.variant];

  return (
    <div
      role="status"
      className="animate-fade-in-up flex w-full max-w-sm items-start gap-3 rounded-2xl border border-black/6 bg-white p-3.5 shadow-xl dark:border-white/10 dark:bg-zinc-900"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${chip}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="min-w-0 flex-1 pt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {toast.message}
      </p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-600 dark:hover:bg-white/10 dark:hover:text-zinc-300"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return {
    success: (message: string) => ctx.push("success", message),
    error: (message: string) => ctx.push("error", message),
    info: (message: string) => ctx.push("info", message),
  };
}
