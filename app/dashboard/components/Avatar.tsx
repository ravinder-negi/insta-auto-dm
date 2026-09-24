const SIZES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({
  name,
  src,
  size = "md",
  muted = false,
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  muted?: boolean;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL, no next/image domain config
      <img
        src={src}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${SIZES[size]} ${className}`}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${
        SIZES[size]
      } ${
        muted
          ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          : "brand-gradient text-white shadow-[0_4px_10px_-3px_color-mix(in_srgb,var(--color-brand-500)_60%,transparent)]"
      } ${className}`}
    >
      {(name.replace(/^@/, "").slice(0, 1) || "?").toUpperCase()}
    </span>
  );
}
