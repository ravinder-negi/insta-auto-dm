import Link from "next/link";
import { Reveal } from "../Reveal";
import { displayFont } from "./fonts";

export function HomeCta() {
  return (
    <div id="cta" className="mx-auto max-w-[1920px] px-6 pb-20 sm:px-8 sm:pb-28">
      <Reveal className="relative flex flex-col items-center gap-7 overflow-hidden rounded-[44px] bg-[var(--accent)] px-6 py-16 text-center text-white sm:px-10 sm:py-20">
        <div className="ha-float1 pointer-events-none absolute -top-15 -left-10 h-55 w-55 rounded-full bg-white/14" />
        <div className="ha-float2 pointer-events-none absolute -right-7.5 -bottom-20 h-70 w-70 rounded-full bg-white/12" />
        <div className="ha-float3 pointer-events-none absolute top-15 right-[12%] h-22.5 w-22.5 rounded-full border-[3px] border-white/35" />
        <h2
          className={`${displayFont} relative m-0 max-w-[760px] text-4xl leading-[1.06] font-extrabold tracking-[-0.035em] sm:text-[60px] sm:leading-[1.03]`}
        >
          Your next comment could be a customer
        </h2>
        <p className="relative m-0 max-w-[560px] text-lg sm:text-xl">
          Connect your Instagram, create your first automation and let the
          replies start rolling in.
        </p>
        <div className="relative flex flex-wrap justify-center gap-3.5">
          <Link
            href="/signup"
            className="ha-btn inline-flex min-h-14 items-center gap-2.5 rounded-full bg-white px-7.5 text-[17px] font-bold text-[var(--ink)]"
          >
            <span>Connect your Instagram</span>
            <span className="ha-arr">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
            </span>
          </Link>
          <a
            href="#how"
            className="ha-btn inline-flex min-h-14 items-center rounded-full border-[1.5px] border-white px-7.5 text-[17px] font-semibold"
          >
            Review the steps
          </a>
        </div>
      </Reveal>
    </div>
  );
}
