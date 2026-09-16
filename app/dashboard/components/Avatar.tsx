const SIZES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({
  name,
  size = "md",
  muted = false,
  className = "",
}: {
  name: string;
  size?: keyof typeof SIZES;
  muted?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${
        SIZES[size]
      } ${
        muted
          ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          : "brand-gradient text-white shadow-[0_4px_10px_-3px_rgba(99,102,241,0.6)]"
      } ${className}`}
    >
      {(name.replace(/^@/, "").slice(0, 1) || "?").toUpperCase()}
    </span>
  );
}
