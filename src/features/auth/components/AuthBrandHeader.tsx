import Link from "next/link";
import { BoltIcon } from "@/components/icons";
import { displayFont } from "@/app/(marketing)/_components/home/fonts";

export function AuthBrandHeader() {
  return (
    <Link href="/" className="flex w-fit items-center gap-3 transition-opacity hover:opacity-80">
      <span className="flex h-10.5 w-10.5 flex-none items-center justify-center rounded-xl bg-[var(--accent)] text-white">
        <BoltIcon className="h-5.5 w-5.5" />
      </span>
      <span className="leading-tight">
        <span className={`${displayFont} block text-xl font-extrabold tracking-[-0.02em] text-[var(--ink)]`}>
          Auto DM
        </span>
        <span className="block text-[13px] text-[var(--muted)]">Engage. Automate. Grow.</span>
      </span>
    </Link>
  );
}
