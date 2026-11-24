import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function HomeFooter() {
  return (
    <div className="border-t border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-10 px-6 pt-14 pb-10 sm:px-8">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="flex min-w-0 max-w-[360px] flex-1 basis-[280px] flex-col gap-3.5">
            <Logo className="h-10 self-start" />
            <p className="m-0 text-[15px] text-[var(--muted)]">
              Turn Instagram engagement into conversations.
            </p>
          </div>
          <div className="flex flex-wrap gap-12">
            <div className="flex flex-col gap-2.5 text-[15px]">
              <div className="font-bold">Product</div>
              <a href="#features" className="text-[var(--muted)] transition-colors hover:text-[var(--accent)]">
                Features
              </a>
              <a href="#how" className="text-[var(--muted)] transition-colors hover:text-[var(--accent)]">
                How it works
              </a>
              <a href="#leads" className="text-[var(--muted)] transition-colors hover:text-[var(--accent)]">
                Lead capture
              </a>
              <a href="#analytics" className="text-[var(--muted)] transition-colors hover:text-[var(--accent)]">
                Analytics
              </a>
            </div>
            <div className="flex flex-col gap-2.5 text-[15px]">
              <div className="font-bold">Account</div>
              <Link href="/login" className="text-[var(--muted)] transition-colors hover:text-[var(--accent)]">
                Log in
              </Link>
              <Link href="/signup" className="text-[var(--muted)] transition-colors hover:text-[var(--accent)]">
                Get started
              </Link>
            </div>
            <div className="flex flex-col gap-2.5 text-[15px]">
              <div className="font-bold">Legal</div>
              <Link href="/privacy" className="text-[var(--muted)] transition-colors hover:text-[var(--accent)]">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-[var(--muted)] transition-colors hover:text-[var(--accent)]">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-[var(--muted)] transition-colors hover:text-[var(--accent)]">
                Contact
              </Link>
              <Link href="/data-deletion" className="text-[var(--muted)] transition-colors hover:text-[var(--accent)]">
                Data Deletion
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--line)] pt-6 text-[13px] text-[var(--muted)]">
          <span>&copy; {new Date().getFullYear()} DMLink. All rights reserved.</span>
          <span>Not affiliated with or endorsed by Instagram or Meta.</span>
        </div>
      </div>
    </div>
  );
}
