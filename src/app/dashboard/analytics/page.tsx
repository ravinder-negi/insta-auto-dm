import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentTimestamp } from "@/lib/utils/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EyeIcon, ChartIcon } from "@/components/icons";
import { BarList, type BarListRow } from "@/features/analytics/components/BarList";
import { ChartCard } from "@/features/analytics/components/chart-primitives";
import { compactNumber, trendFor } from "@/features/analytics/lib/metrics";
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
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Link-in-bio"
        title="Analytics"
        description="Every view and click across your public profile, in one place."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Profile views"
          value={compactNumber(views7d)}
          tone="indigo"
          icon={<EyeIcon className="h-5 w-5" />}
          trend={trendFor(views7d, viewsPrev7d)}
        />
        <StatCard
          label="Clicks"
          value={compactNumber(clicks7d)}
          tone="blue"
          icon={<ChartIcon className="h-5 w-5" />}
          trend={trendFor(clicks7d, clicksPrev7d)}
        />
        <StatCard
          label="Profile views (all time)"
          value={compactNumber(views.length)}
          tone="zinc"
          icon={<EyeIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Clicks (all time)"
          value={compactNumber(clicks.length)}
          tone="zinc"
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
  );
}
