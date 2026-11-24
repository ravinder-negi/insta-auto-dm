import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function AuthBrandHeader() {
  return (
    <Link href="/" className="-mt-2 flex w-fit transition-opacity hover:opacity-80 sm:-mt-4">
      <Logo className="h-12 sm:h-14" preload />
    </Link>
  );
}
