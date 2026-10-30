import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentTimestamp } from "@/lib/utils/format";
import { ArrowLeftIcon, EyeIcon, ChartIcon } from "@/components/icons";
import { BarList, type BarListRow } from "@/features/analytics/components/BarList";
import { ChartCard, StatTile } from "@/features/analytics/components/chart-primitives";
import { compactNumber, trendFor } from "@/features/analytics/lib/metrics";
import { displayFont, linkInBioCssVars, linkInBioWrapperClass } from "@/lib/linkInBioTheme";
import { UtmSourceEmptyState } from "./_components/UtmSourceEmptyState";

const DAY_MS = 24 * 60 * 60 * 1000;

function hostnameFromReferrer(referrer: string | null): string {
  if (!referrer) return "Direct / unknown";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "Direct / unknown";
  }
}

function countBy<T>(items: T[], keyOf: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function rankedRows(
  targets: { id: string; label: string }[],
  counts: Map<string, number>
): BarListRow[] {
  return targets
    .map((target) => ({ key: target.id, label: target.label, value: counts.get(target.id) ?? 0 }))
    .sort((a, b) => b.value - a.value);
}

function countInWindow(rows: { created_at: string }[], startMs: number, endMs: number): number {
  return rows.filter((row) => {
    const ts = new Date(row.created_at).getTime();
    return ts >= startMs && ts < endMs;
  }).length;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: viewRows },
    { data: clickRows },
    { data: linkRows },
    { data: magnetRows },
    { data: productRows },
    { data: socialRows },
    { data: profile },
    requestHeaders,
  ] = await Promise.all([
    supabase
      .from("profile_views")
      .select("referrer, utm_source, created_at")
      .eq("profile_id", user.id)
      .returns<{ referrer: string | null; utm_source: string | null; created_at: string }[]>(),
    supabase
      .from("link_clicks")
      .select("target_type, target_id, created_at")
      .eq("profile_id", user.id)
      .returns<{ target_type: string; target_id: string; created_at: string }[]>(),
    supabase
      .from("profile_links")
      .select("id, title")
      .eq("profile_id", user.id)
      .returns<{ id: string; title: string }[]>(),
    supabase
      .from("lead_magnets")
      .select("id, title")
      .eq("profile_id", user.id)
      .returns<{ id: string; title: string }[]>(),
    supabase
      .from("products")
      .select("id, name")
      .eq("profile_id", user.id)
      .returns<{ id: string; name: string }[]>(),
    supabase
      .from("profile_socials")
      .select("id, platform")
      .eq("profile_id", user.id)
      .returns<{ id: string; platform: string }[]>(),
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle<{
      username: string | null;
    }>(),
    headers(),
  ]);

  const views = viewRows ?? [];
  const clicks = clickRows ?? [];
  const links = linkRows ?? [];
  const magnets = magnetRows ?? [];
  const products = productRows ?? [];
  const socials = socialRows ?? [];

  const now = currentTimestamp();
  const weekAgo = now - 7 * DAY_MS;
  const twoWeeksAgo = now - 14 * DAY_MS;

  const views7d = countInWindow(views, weekAgo, now);
  const viewsPrev7d = countInWindow(views, twoWeeksAgo, weekAgo);
  const clicks7d = countInWindow(clicks, weekAgo, now);
  const clicksPrev7d = countInWindow(clicks, twoWeeksAgo, weekAgo);

  const linkClickCounts = countBy(
    clicks.filter((row) => row.target_type === "profile_link"),
    (row) => row.target_id
  );
  const magnetClickCounts = countBy(
    clicks.filter((row) => row.target_type === "lead_magnet"),
    (row) => row.target_id
  );
  const productClickCounts = countBy(
    clicks.filter((row) => row.target_type === "product"),
    (row) => row.target_id
  );
  const socialClickCounts = countBy(
    clicks.filter((row) => row.target_type === "social"),
    (row) => row.target_id
  );

  const referrerCounts = countBy(views, (row) => hostnameFromReferrer(row.referrer));
  const topReferrers: BarListRow[] = [...referrerCounts.entries()]
    .map(([hostname, count]) => ({ key: hostname, label: hostname, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const utmSourceCounts = countBy(
    views.filter((row) => row.utm_source),
    (row) => row.utm_source as string
  );
  const topUtmSources: BarListRow[] = [...utmSourceCounts.entries()]
    .map(([source, count]) => ({ key: source, label: source, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const host = requestHeaders.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const publicUrl = `${protocol}://${host}/${profile?.username ?? "yourusername"}`;

  return (
    <div className={linkInBioWrapperClass} style={linkInBioCssVars}>
      <div className="flex flex-col gap-7">
        <Link
          href="/dashboard/profile"
          className="inline-flex w-fit items-center gap-2 rounded-full border-[1.5px] border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--secondary-soft-bg)]"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to profile
        </Link>

        {/* hero */}
        <div className="relative overflow-hidden rounded-[40px] border border-[var(--line)] bg-white bg-[radial-gradient(#DDD6EC_1.2px,transparent_1.2px)] bg-[length:30px_30px]">
          <div
            className="animate-float pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full opacity-70 blur-[90px]"
            style={{ background: "var(--tint)" }}
          />
          <div
            className="animate-float-delayed pointer-events-none absolute -top-20 -right-24 h-[420px] w-[420px] rounded-full opacity-80 blur-[100px]"
            style={{ background: "var(--secondary-pale-border)" }}
          />
          <div className="relative flex flex-col gap-3.5 p-9 sm:p-11">
            <span className="animate-fade-in-up inline-flex w-fit items-center gap-2.5 rounded-full border border-[var(--line)] bg-white py-[7px] pr-4 pl-3 text-xs font-bold tracking-[0.1em] text-[var(--muted)] uppercase">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
              </span>
              Link-in-bio
            </span>
            <h1
              className={`animate-fade-in-up m-0 ${displayFont} text-[clamp(32px,4.2vw,48px)] leading-[1.03] font-extrabold tracking-[-0.035em]`}
              style={{ animationDelay: "0.1s" }}
            >
              Your{" "}
              <span className="relative inline-block text-[var(--accent)]">
                analytics
                <svg
                  className="absolute bottom-[-6px] left-0 h-3.5 w-full"
                  viewBox="0 0 200 14"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9 C 40 2, 90 14, 198 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p
              className="animate-fade-in-up m-0 max-w-[540px] text-lg text-[var(--muted)]"
              style={{ animationDelay: "0.2s" }}
            >
              Every view and click across your public profile, in one place.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Profile views"
            value={compactNumber(views7d)}
            tone="violet"
            icon={<EyeIcon className="h-5 w-5" />}
            trend={trendFor(views7d, viewsPrev7d)}
          />
          <StatTile
            label="Clicks"
            value={compactNumber(clicks7d)}
            tone="amber"
            icon={<ChartIcon className="h-5 w-5" />}
            trend={trendFor(clicks7d, clicksPrev7d)}
          />
          <StatTile
            label="Profile views (all time)"
            value={compactNumber(views.length)}
            tone="green"
            icon={<EyeIcon className="h-5 w-5" />}
          />
          <StatTile
            label="Clicks (all time)"
            value={compactNumber(clicks.length)}
            tone="pink"
            icon={<ChartIcon className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Links" description="Clicks per link on your profile.">
            <BarList
              rows={rankedRows(
                links.map((link) => ({ id: link.id, label: link.title })),
                linkClickCounts
              )}
              emptyMessage="No links yet."
            />
          </ChartCard>

          <ChartCard title="Social accounts" description="Clicks per platform icon.">
            <BarList
              rows={rankedRows(
                socials.map((social) => ({ id: social.id, label: social.platform })),
                socialClickCounts
              )}
              emptyMessage="No social accounts connected yet."
            />
          </ChartCard>

          <ChartCard title="Lead magnets" description="Downloads per lead magnet.">
            <BarList
              rows={rankedRows(
                magnets.map((magnet) => ({ id: magnet.id, label: magnet.title })),
                magnetClickCounts
              )}
              emptyMessage="No lead magnets yet."
            />
          </ChartCard>

          <ChartCard title="Products" description="Clicks per product.">
            <BarList
              rows={rankedRows(
                products.map((product) => ({ id: product.id, label: product.name })),
                productClickCounts
              )}
              emptyMessage="No products yet."
            />
          </ChartCard>

          <ChartCard title="Top referrers" description="Where your profile views come from.">
            <BarList rows={topReferrers} emptyMessage="No views yet." />
          </ChartCard>

          <ChartCard title="Top UTM sources" description="Tagged campaign traffic.">
            {topUtmSources.length > 0 ? (
              <BarList rows={topUtmSources} emptyMessage="No tagged traffic yet." />
            ) : (
              <UtmSourceEmptyState publicUrl={publicUrl} />
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
