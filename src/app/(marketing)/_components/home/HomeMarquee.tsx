import { displayFont } from "./fonts";

const ITEMS = [
  "Comment keyword",
  "Story reply",
  "Live comment",
  "Post share",
  "Multi-step flows",
  "Follow-up sequences",
  "Follow gate",
  "Email capture",
  "Lead magnets",
  "Link in bio",
  "Link click tracking",
  "Multi-account",
];

function Track({ hidden = false }: { hidden?: boolean }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className={`${displayFont} flex items-center gap-9 px-4.5 py-5.5 text-[22px] font-bold whitespace-nowrap`}
    >
      {ITEMS.map((item, i) => (
        <span key={i} className="flex items-center gap-9">
          <span>{item}</span>
          <span className="text-[var(--secondary)]">✦</span>
        </span>
      ))}
    </div>
  );
}

export function HomeMarquee() {
  return (
    <div className="ha-marq border-t border-b border-[#2A2736] bg-[var(--ink)] text-white">
      <div className="ha-track">
        <Track />
        <Track hidden />
      </div>
    </div>
  );
}
