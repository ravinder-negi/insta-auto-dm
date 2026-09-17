import {
  ArrowLeftIcon,
  CameraIcon,
  DotsHorizontalIcon,
  HeartIcon,
  InfoIcon,
  InstagramIcon,
  MicIcon,
  PhoneIcon,
  PlusIcon,
  SendIcon,
} from "./dashboard/components/icons";

const COMMENTS = [
  {
    name: "jessica.miller",
    text: "This looks amazing!",
    keyword: "GUIDE",
    time: "2m",
    tint: "bg-rose-400",
  },
  {
    name: "rohit.singh",
    text: "Nice work! 🔥",
    keyword: null,
    time: "5m",
    tint: "bg-sky-400",
  },
  {
    name: "emily.carter",
    text: "Where can I get this?",
    keyword: null,
    time: "12m",
    tint: "bg-amber-400",
  },
];

export function LandingShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-md pt-2 pb-2 sm:pt-4 lg:max-w-none">
      <div className="absolute -inset-10 -z-10 rounded-full bg-gradient-to-br from-brand-100 via-purple-50 to-transparent blur-3xl dark:from-brand-900/20 dark:via-purple-900/10" />

      <div className="animate-float-delayed absolute -top-2 right-2 z-10 hidden max-w-[160px] items-start gap-1.5 rounded-2xl bg-white px-3 py-2.5 text-xs font-medium text-zinc-800 shadow-lg shadow-zinc-200/70 sm:flex dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-none">
        <SendIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
        Turn comments into conversations
      </div>

      <div className="relative flex items-start justify-center gap-4 sm:gap-6">
        <div className="w-[230px] shrink-0 rounded-2xl border border-zinc-100 bg-white p-3 shadow-xl shadow-zinc-200/60 sm:w-[270px] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <div className="flex items-center gap-2 pb-2.5">
            <InstagramIcon className="h-5 w-5 text-zinc-900 dark:text-zinc-50" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Instagram
            </span>
            <DotsHorizontalIcon className="ml-auto h-4 w-4 text-zinc-400" />
          </div>

          <div className="ig-gradient relative flex h-32 items-center justify-center rounded-xl sm:h-36">
            <svg viewBox="0 0 24 24" className="h-9 w-9 text-white/90" fill="currentColor">
              <path d="M12 2c-3.2 3-3.4 7.2-1.2 9.4.2-3.1 1.7-5.2 3.1-6.4-1.1 2.6-.7 5.5 1 7.2 2.1-2.1 2.4-6.3-1-9.9C13.4 3.8 12.6 2.9 12 2z" />
              <path d="M11 21v-6.5h2V21z" />
            </svg>

            <span className="absolute -bottom-3 left-1/2 hidden -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-medium whitespace-nowrap text-white shadow-lg sm:block">
              Keyword detected
            </span>
          </div>

          <div className="mt-4 space-y-2.5 sm:mt-5">
            {COMMENTS.map((c) => (
              <div key={c.name} className="flex items-start gap-2">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${c.tint} text-[10px] font-semibold text-white`}
                >
                  {c.name[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-snug text-zinc-800 dark:text-zinc-200">
                    <span className="font-semibold">{c.name}</span>{" "}
                    {c.text}{" "}
                    {c.keyword && (
                      <span className="rounded bg-brand-100 px-1 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                        {c.keyword}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-400">
                    {c.time} &middot; Reply
                  </p>
                </div>
                <HeartIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-300" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 w-50 shrink-0 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-xl shadow-zinc-200/60 sm:mt-10 sm:w-60 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
            <ArrowLeftIcon className="h-4 w-4 shrink-0 text-zinc-400" />
            <div className="brand-gradient flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white">
              YB
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                Your Brand
              </p>
              <p className="text-[10px] text-emerald-500">Active now</p>
            </div>
            <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <InfoIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          </div>

          <div className="p-3">
            <div className="rounded-2xl rounded-tl-sm bg-zinc-100 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Hey! 👋 Thanks for your interest!
              <br />
              <br />
              Here&rsquo;s the guide you requested 📘
              <br />
              <br />
              If you have any questions, feel free to DM us anytime.
              We&rsquo;d be happy to help! 😊
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
            <CameraIcon className="h-4 w-4 shrink-0 text-brand-500" />
            <span className="flex-1 truncate text-[11px] text-zinc-400">
              Message...
            </span>
            <MicIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <PlusIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
