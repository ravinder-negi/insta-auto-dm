import { ArrowRightIcon } from "@/components/icons";

export function AuthSubmitButton({
  pending,
  idleLabel,
  pendingLabel,
}: {
  pending: boolean;
  idleLabel: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="ha-btn group mt-1 inline-flex min-h-13.5 w-full items-center justify-center gap-2.5 rounded-[14px] bg-[var(--accent)] text-[17px] font-bold text-white disabled:opacity-70"
    >
      {pending && (
        <svg
          className="h-5 w-5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 3a9 9 0 1 0 9 9" />
        </svg>
      )}
      <span>{pending ? pendingLabel : idleLabel}</span>
      {!pending && (
        <span className="ha-arr inline-flex">
          <ArrowRightIcon className="h-4.5 w-4.5" />
        </span>
      )}
    </button>
  );
}
