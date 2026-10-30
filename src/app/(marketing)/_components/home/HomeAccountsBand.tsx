import { Reveal } from "../Reveal";
import { displayFont } from "./fonts";

export function HomeAccountsBand() {
  return (
    <div className="mx-auto max-w-[1920px] px-6 pb-20 sm:px-8 sm:pb-28">
      <Reveal className="ha-lift flex flex-wrap items-center justify-between gap-7 rounded-[32px] border border-[var(--line)] bg-white p-8 sm:p-10">
        <div className="flex min-w-0 flex-1 basis-[360px] flex-col gap-2.5">
          <h3 className={`${displayFont} m-0 text-3xl font-bold tracking-[-0.02em] sm:text-[32px]`}>
            Every account, one place
          </h3>
          <p className="m-0 text-[var(--muted)]">
            Connect one profile or several through Instagram OAuth, then
            tune the look and general settings to match your brand.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="ha-chiphover inline-flex items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--bg)] py-2 pr-4.5 pl-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[13px] font-bold text-white">
              M
            </span>
            @brand.main
          </span>
          <span className="ha-chiphover inline-flex items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--bg)] py-2 pr-4.5 pl-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--violet)] text-[13px] font-bold text-white">
              S
            </span>
            @brand.shop
          </span>
          <span className="ha-chiphover ha-pulsering inline-flex items-center gap-2 rounded-full border-[1.5px] border-dashed border-[var(--neutral-dot)] px-4.5 py-2 font-semibold text-[var(--muted)]">
            + Connect account
          </span>
        </div>
      </Reveal>
    </div>
  );
}
