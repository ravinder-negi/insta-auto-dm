import {
  BoltIcon,
  BookmarkIcon,
  ChatIcon,
  DotsHorizontalIcon,
  HeartIcon,
  ImageIcon,
  InstagramIcon,
  PlusIcon,
  SendIcon,
  ShareIcon,
} from "./dashboard/components/icons";

function RoomPhoto() {
  return (
    <svg viewBox="0 0 200 130" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#efe4d6" />
          <stop offset="100%" stopColor="#e4d5c1" />
        </linearGradient>
        <radialGradient id="light" cx="70%" cy="15%" r="65%">
          <stop offset="0%" stopColor="#fff7e6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff7e6" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="200" height="130" fill="url(#wall)" />
      <rect width="200" height="130" fill="url(#light)" />

      <rect x="118" y="10" width="66" height="60" rx="3" fill="#cfe0e8" opacity="0.9" />
      <rect x="118" y="10" width="66" height="60" rx="3" fill="none" stroke="#fff" strokeWidth="3" />
      <line x1="151" y1="10" x2="151" y2="70" stroke="#fff" strokeWidth="3" />
      <line x1="118" y1="40" x2="184" y2="40" stroke="#fff" strokeWidth="3" />

      <rect x="20" y="92" width="46" height="6" rx="2" fill="#c9b8a0" />
      <ellipse cx="43" cy="100" rx="26" ry="4" fill="#00000012" />

      <path d="M32 92c-2-16 4-24 11-30" stroke="#5a8a5f" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M43 92c1-20 8-28 16-34" stroke="#4c7a52" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M50 92c5-14 3-24-2-32" stroke="#6a9b6d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M22 30c9 2 12 10 11 19-9-1-13-9-11-19z" fill="#5a8a5f" />
      <path d="M45 24c10 1 15 9 15 18-10 0-16-7-15-18z" fill="#6a9b6d" />
      <path d="M55 34c8 4 10 12 8 20-9-2-12-11-8-20z" fill="#4c7a52" />
      <path d="M23 60h40l-4 32h-32z" fill="#c2673f" />
      <path d="M23 60h40l-2 8h-36z" fill="#a8552f" />
    </svg>
  );
}

function AvatarIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="12" fill="#f3c8a3" />
      <path d="M2 15c1-6 4-10 10-10s9 4 10 10c-3 3-7 5-10 5s-7-2-10-5z" fill="#6b4331" />
      <circle cx="12" cy="13" r="6.5" fill="#f6d3ae" />
      <path d="M5.5 12c1-4 3-6 6.5-6s5.5 2 6.5 6" fill="#6b4331" />
    </svg>
  );
}

export function LandingShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-lg pt-6 pb-4">
      <div className="absolute -inset-16 -z-10 rounded-full bg-linear-to-br from-brand-200/70 via-brand-100/60 to-transparent blur-3xl dark:from-brand-900/30 dark:via-brand-900/20" />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full overflow-visible sm:block"
      >
        <path
          d="M45 10 C 58 -2, 66 -2, 74 4"
          fill="none"
          stroke="var(--color-brand-400)"
          strokeWidth="0.6"
          strokeDasharray="2.2 2.2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="opacity-70"
        />
        <path
          d="M74 4 L70.5 3 M74 4 L71 7"
          fill="none"
          stroke="var(--color-brand-400)"
          strokeWidth="0.6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="opacity-70"
        />

        <path
          d="M92 68 C 100 78, 100 86, 95 92"
          fill="none"
          stroke="var(--color-brand-400)"
          strokeWidth="0.6"
          strokeDasharray="2.2 2.2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="opacity-70"
        />
        <path
          d="M95 92 L98 87.5 M95 92 L91.5 89.5"
          fill="none"
          stroke="var(--color-brand-400)"
          strokeWidth="0.6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="opacity-70"
        />
      </svg>

      <div className="animate-float pointer-events-none absolute -top-7 right-0 z-10 hidden -rotate-2 items-center gap-1.5 text-xs font-medium text-brand-600 italic sm:flex dark:text-brand-300">
        Comments to Customers
        <SendIcon className="h-4 w-4 -rotate-12" />
      </div>

      <div className="animate-float-delayed pointer-events-none absolute right-1 -bottom-6 z-10 hidden rotate-1 flex-col items-end gap-0.5 text-xs font-medium text-brand-600 italic sm:flex dark:text-brand-300">
        <span>Automate</span>
        <span>Grow</span>
        <span>Scale</span>
      </div>

      <div className="relative flex items-start justify-center gap-4 sm:gap-6">
        <div className="w-60 shrink-0 rounded-2xl border border-zinc-100 bg-white p-3 shadow-xl shadow-zinc-200/60 sm:w-67.5 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <div className="flex items-center gap-2 pb-2.5">
            <InstagramIcon className="h-5 w-5 text-zinc-900 dark:text-zinc-50" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Instagram
            </span>
            <DotsHorizontalIcon className="ml-auto h-4 w-4 text-zinc-400" />
          </div>

          <div className="relative">
            <div className="h-36 overflow-hidden rounded-xl sm:h-40">
              <RoomPhoto />
            </div>

            <span className="animate-pulse-soft absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-medium whitespace-nowrap text-white shadow-lg">
              <BoltIcon className="mr-1 inline-block h-3 w-3 -translate-y-px" />
              Keyword detected
            </span>
          </div>

          <div className="flex items-center gap-3 pt-4 pb-1 text-zinc-700 dark:text-zinc-300">
            <HeartIcon className="h-4.5 w-4.5" />
            <ChatIcon className="h-4.5 w-4.5" />
            <ShareIcon className="h-4.5 w-4.5" />
            <BookmarkIcon className="ml-auto h-4.5 w-4.5" />
          </div>
          <p className="pb-2 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
            243 likes
          </p>

          <div className="flex items-start gap-2 border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
            <AvatarIllustration className="h-6 w-6 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-snug text-zinc-800 dark:text-zinc-200">
                <span className="font-semibold">jessica.miller</span> This
                looks amazing!{" "}
                <span className="rounded bg-brand-100 px-1 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  GUIDE
                </span>
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-400">2m &middot; Reply</p>
            </div>
          </div>
        </div>

        <div className="mt-10 w-52 shrink-0 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-xl shadow-zinc-200/60 sm:mt-14 sm:w-60 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
              <BoltIcon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                Your Brand
              </p>
              <p className="text-[10px] text-emerald-500">Active now</p>
            </div>
            <DotsHorizontalIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          </div>

          <div className="p-3">
            <div className="rounded-2xl rounded-tl-sm bg-zinc-100 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Hey! 👋
              <br />
              Thanks for your interest!
              <br />
              <br />
              Here&rsquo;s the guide you requested: 📘
              <br />
              <br />
              If you have any questions, feel free to reply here. We&rsquo;d
              be happy to help! 😊
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
            <span className="flex-1 truncate text-[11px] text-zinc-400">
              Message...
            </span>
            <ImageIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <PlusIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <div className="brand-gradient flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white">
              <SendIcon className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
