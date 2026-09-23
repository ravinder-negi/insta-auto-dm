import {
  BoltIcon,
  ChartIcon,
  ChevronDownIcon,
  CloseIcon,
  EmojiIcon,
  ImageIcon,
  InstagramIcon,
  LayersIcon,
  SettingsIcon,
  UsersIcon,
} from "./dashboard/components/icons";

const NAV_ITEMS = [
  { icon: UsersIcon, label: "Accounts" },
  { icon: BoltIcon, label: "Rules", active: true },
  { icon: LayersIcon, label: "Executions" },
  { icon: ChartIcon, label: "Analytics" },
  { icon: SettingsIcon, label: "Settings" },
];

export function LandingDashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-300/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
        <div className="brand-gradient flex h-6 w-6 items-center justify-center rounded-lg text-white">
          <BoltIcon className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
          Auto DM
        </span>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          <span className="brand-gradient flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-white">
            J
          </span>
          youremail@gmail.com
          <ChevronDownIcon className="h-3 w-3" />
        </div>
      </div>

      <div className="flex">
        <div className="hidden w-32 shrink-0 flex-col gap-1 border-r border-zinc-100 p-3 sm:flex dark:border-zinc-800">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium ${
                item.active
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </div>
          ))}
        </div>

        <div className="flex-1 p-4 sm:p-5">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Create new rule
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Set a keyword and automated reply for Instagram comments
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3">
              <Field label="Instagram account">
                <div className="flex items-center gap-1.5">
                  <InstagramIcon className="h-3.5 w-3.5" />
                  @yourbrand
                  <ChevronDownIcon className="ml-auto h-3 w-3 text-zinc-400" />
                </div>
              </Field>

              <Field label="Rule name">Send Guide on comment</Field>

              <Field label="Keyword">
                GUIDE
                <span className="mt-1 block text-[9px] font-normal text-zinc-400">
                  Matched case-insensitively against the full, trimmed
                  comment text.
                </span>
              </Field>

              <Field label="Post/reel (optional)">
                <span className="flex items-center justify-between">
                  Any post
                  <ChevronDownIcon className="h-3 w-3 text-zinc-400" />
                </span>
              </Field>

              <div>
                <p className="mb-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                  DM message
                </p>
                <div className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[11px] leading-relaxed text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                  Hey! 👋 Thanks for your interest!
                  <br />
                  Here&rsquo;s the guide you requested: 📘
                  <br />
                  If you have any questions, feel free to reply. We&rsquo;d
                  be happy to help! 😊
                  <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-1.5 text-zinc-300 dark:border-zinc-800 dark:text-zinc-600">
                    <span className="flex items-center gap-1.5">
                      <EmojiIcon className="h-3 w-3" />
                      <ImageIcon className="h-3 w-3" />
                    </span>
                    <span className="text-[9px]">0/1000</span>
                  </div>
                </div>
              </div>

              <button className="brand-gradient w-full rounded-lg py-2 text-[11px] font-semibold text-white">
                Create rule
              </button>
            </div>

            <div className="hidden rounded-xl border border-zinc-100 bg-zinc-50 p-3 sm:block dark:border-zinc-800 dark:bg-zinc-950/40">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                <InstagramIcon className="h-3 w-3" />
                Preview
              </p>
              <div className="rounded-xl border border-zinc-100 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5 pb-2">
                  <div className="brand-gradient flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-semibold text-white">
                    YB
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-50">
                    Your Brand
                  </span>
                </div>
                <div className="rounded-lg rounded-tl-sm bg-zinc-100 p-2 text-[9.5px] leading-relaxed text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Hey! 👋 Thanks for your interest!
                  <br />
                  <br />
                  Here&rsquo;s the guide you requested: 📘
                  <br />
                  <br />
                  If you have any questions, feel free to reply here.
                  We&rsquo;d be happy to help! 😊
                </div>
                <div className="mt-2 flex items-center gap-1.5 rounded-full border border-zinc-100 px-2 py-1 text-[9px] text-zinc-400 dark:border-zinc-800">
                  Message...
                  <CloseIcon className="ml-auto h-2.5 w-2.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <div className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
        {children}
      </div>
    </div>
  );
}
