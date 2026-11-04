import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeftIcon, EyeIcon, ChartIcon } from "@/components/icons";
import { BarList, type BarListRow } from "@/features/analytics/components/BarList";
import { ChartCard, StatTile } from "@/features/analytics/components/chart-primitives";
import { compactNumber, trendFor } from "@/features/analytics/lib/metrics";
import { displayFont, linkInBioCssVars, linkInBioWrapperClass } from "@/lib/linkInBioTheme";
import { UtmSourceEmptyState } from "./_components/UtmSourceEmptyState";

/** Shape of public.link_in_bio_rollup() — counted in SQL so totals aren't
 *  capped at PostgREST's 1000-row limit. */
interface LinkInBioRollup {
  totals: {
    viewsTotal: number;
    views7d: number;
    viewsPrev7d: number;
    clicksTotal: number;
    clicks7d: number;
    clicksPrev7d: number;
  };
  clicksByTarget: { targetType: string; targetId: string; count: number }[];
  topReferrers: { label: string; count: number }[];
  topUtmSources: { label: string; count: number }[];
}

const EMPTY_ROLLUP: LinkInBioRollup = {
  totals: { viewsTotal: 0, views7d: 0, viewsPrev7d: 0, clicksTotal: 0, clicks7d: 0, clicksPrev7d: 0 },
  clicksByTarget: [],
  topReferrers: [],
  topUtmSources: [],
};

function clickCountsFor(rollup: LinkInBioRollup, targetType: string): Map<string, number> {
  return new Map(
    rollup.clicksByTarget
      .filter((row) => row.targetType === targetType)
      .map((row) => [row.targetId, row.count])
  );
}

function barRows(rows: { label: string; count: number }[]): BarListRow[] {
  return rows.map((row) => ({ key: row.label, label: row.label, value: row.count }));
}

function rankedRows(
  targets: { id: string; label: string }[],
  counts: Map<string, number>
): BarListRow[] {
  return targets
    .map((target) => ({ key: target.id, label: target.label, value: counts.get(target.id) ?? 0 }))
    .sort((a, b) => b.value - a.value);
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
    { data: rollupData, error: rollupError },
    { data: linkRows },
    { data: magnetRows },
    { data: productRows },
    { data: socialRows },
    { data: profile },
    requestHeaders,
  ] = await Promise.all([
    supabase.rpc("link_in_bio_rollup"),
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

  if (rollupError) {
    console.error("[link-in-bio analytics] rollup failed:", rollupError.message);
  }
  const rollup = (rollupData as LinkInBioRollup | null) ?? EMPTY_ROLLUP;
  const { viewsTotal, views7d, viewsPrev7d, clicksTotal, clicks7d, clicksPrev7d } = rollup.totals;

  const links = linkRows ?? [];
  const magnets = magnetRows ?? [];
  const products = productRows ?? [];
  const socials = socialRows ?? [];

  const linkClickCounts = clickCountsFor(rollup, "profile_link");
  const magnetClickCounts = clickCountsFor(rollup, "lead_magnet");
  const productClickCounts = clickCountsFor(rollup, "product");
  const socialClickCounts = clickCountsFor(rollup, "social");

  const topReferrers = barRows(rollup.topReferrers);
  const topUtmSources = barRows(rollup.topUtmSources);

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
            value={compactNumber(viewsTotal)}
            tone="green"
            icon={<EyeIcon className="h-5 w-5" />}
          />
          <StatTile
            label="Clicks (all time)"
            value={compactNumber(clicksTotal)}
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
