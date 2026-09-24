import Link from "next/link";
import { BoltIcon } from "./dashboard/components/icons";
import { primaryButtonClass } from "./dashboard/components/styles";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#fbfaff] px-4 py-16 text-center dark:bg-black">
      <div className="absolute -top-32 -right-32 h-105 w-105 rounded-full bg-linear-to-br from-brand-200/70 to-transparent blur-3xl" />
      <div className="absolute -bottom-36 -left-20 h-115 w-115 rounded-full bg-linear-to-tl from-brand-100/80 to-transparent blur-3xl" />

      <Link
        href="/"
        className="brand-gradient relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg shadow-brand-500/30 transition-transform hover:scale-105"
      >
        <BoltIcon className="h-8 w-8 text-white" />
      </Link>

      <p className="brand-text-gradient relative mt-8 text-8xl font-black tracking-tight sm:text-9xl">
        404
      </p>
      <h1 className="relative mt-4 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
        This page could not be found
      </h1>
      <p className="relative mt-3 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        The link might be broken, or the page may have been moved or removed.
      </p>

      <Link href="/" className={`${primaryButtonClass} relative mt-8`}>
        Back to home
      </Link>
    </div>
  );
}
