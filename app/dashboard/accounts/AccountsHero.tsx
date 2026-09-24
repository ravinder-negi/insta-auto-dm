import { ChatIcon, InstagramIcon, SendIcon } from "../components/icons";

/** Decorative art for the accounts header: the Instagram mark with two
 *  notification chips floating around it. Hidden below `lg`. */
export function AccountsHero() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative hidden h-44 w-[26rem] shrink-0 select-none lg:block"
    >
      <svg
        viewBox="0 0 420 176"
        className="absolute inset-0 h-full w-full text-brand-300 dark:text-brand-500/50"
        fill="none"
      >
        <path
          d="M18 122c22-58 74-86 132-74"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-dash-flow"
        />
      </svg>

      <span className="ig-gradient animate-float absolute top-8 left-32 flex h-24 w-24 items-center justify-center rounded-[1.6rem] text-white shadow-[0_20px_40px_-16px_rgba(220,39,67,0.65)]">
        <InstagramIcon className="h-12 w-12" />
      </span>

      <span className="animate-float-delayed absolute top-2 right-14 flex items-center gap-2 rounded-2xl border border-black/5 bg-white px-3.5 py-2.5 text-xs font-semibold shadow-[0_12px_28px_-14px_rgba(16,24,40,0.45)] dark:border-white/10 dark:bg-zinc-800">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
          <ChatIcon className="h-3.5 w-3.5" />
        </span>
        New comment!
      </span>

      <span className="animate-float absolute top-24 right-0 flex items-center gap-2 rounded-2xl border border-black/5 bg-white px-3.5 py-2.5 text-xs font-semibold shadow-[0_12px_28px_-14px_rgba(16,24,40,0.45)] dark:border-white/10 dark:bg-zinc-800">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
          <SendIcon className="h-3.5 w-3.5" />
        </span>
        Auto reply sent!
      </span>

      <Sparkle className="top-6 left-24 h-3.5 w-3.5" />
      <Sparkle className="top-28 left-20 h-2.5 w-2.5 [animation-delay:1.2s]" />
      <Sparkle className="top-16 right-36 h-3 w-3 [animation-delay:2.4s]" />
    </div>
  );
}

function Sparkle({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`animate-pulse-soft absolute text-brand-400 ${className}`}
      fill="currentColor"
    >
      <path d="M12 0c1 7 4 10 12 12-8 2-11 5-12 12-1-7-4-10-12-12C8 10 11 7 12 0z" />
    </svg>
  );
}
