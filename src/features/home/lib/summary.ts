import { explainSendError } from "@/lib/instagram/sendErrors";

/**
 * Shaping for the dashboard Home page. Pure, so it can be tested without a
 * database. The page fetches, these helpers decide what to show.
 */

export interface HomeAccount {
  id: string;
  handle: string;
  isActive: boolean;
  tokenExpired: boolean;
}

export interface AttentionItem {
  key: string;
  tone: "danger" | "warning";
  title: string;
  detail: string;
  href: string;
  cta: string;
}

/** Failed DMs grouped by their plain-language reason, most common first. */
export function groupFailures(errors: (string | null)[]) {
  const counts = new Map<string, number>();
  for (const raw of errors) {
    const title = explainSendError(raw)?.title ?? "Unknown error";
    counts.set(title, (counts.get(title) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
}

/**
 * What the owner should look at, most urgent first. A disconnected account
 * isn't listed: the reconnect banner already shows above every page.
 */
export function attentionItems({
  accounts,
  failures,
  activeAutomationsByAccount,
}: {
  accounts: HomeAccount[];
  failures: { title: string; count: number }[];
  activeAutomationsByAccount: Map<string, number>;
}): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const failure of failures) {
    items.push({
      key: `failure:${failure.title}`,
      tone: "danger",
      title: `${failure.count} DM${failure.count === 1 ? "" : "s"} failed: ${failure.title}`,
      detail: "In the last 7 days. Open the execution log to see who and why.",
      href: "/dashboard/rules/executions",
      cta: "View log",
    });
  }

  for (const account of accounts) {
    if (account.tokenExpired) continue;

    if (!account.isActive) {
      items.push({
        key: `paused:${account.id}`,
        tone: "warning",
        title: `@${account.handle} is paused`,
        detail: "No AutoDMs or DM Flows run on this account until you resume it.",
        href: "/dashboard/accounts",
        cta: "Resume",
      });
    } else if (!activeAutomationsByAccount.get(account.id)) {
      items.push({
        key: `idle:${account.id}`,
        tone: "warning",
        title: `@${account.handle} has nothing switched on`,
        detail: "No active AutoDMs or DM Flows, so nobody gets a DM yet.",
        href: "/dashboard/rules",
        cta: "Set one up",
      });
    }
  }

  return items;
}

export interface RecentLead {
  email: string;
  source: string;
  collectedAt: string;
  href: string;
}

/** Newest leads across AutoDMs, DM Flows and lead magnets. */
export function recentLeads(lists: RecentLead[][], limit = 6): RecentLead[] {
  return lists
    .flat()
    .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))
    .slice(0, limit);
}

export interface ChecklistStep {
  key: "connect" | "create" | "test";
  title: string;
  detail: string;
  done: boolean;
}

/** Getting-started steps, or null once all are done. */
export function gettingStarted({
  accountCount,
  automationCount,
  hasActivity,
}: {
  accountCount: number;
  automationCount: number;
  hasActivity: boolean;
}): ChecklistStep[] | null {
  const steps: ChecklistStep[] = [
    {
      key: "connect",
      title: "Connect your Instagram account",
      detail: "Auto DM needs it to see comments and send DMs for you.",
      done: accountCount > 0,
    },
    {
      key: "create",
      title: "Create your first AutoDM",
      detail: "Pick a trigger, like a keyword in comments, and write the DM to send.",
      done: automationCount > 0,
    },
    {
      key: "test",
      title: "Test it",
      detail: "From another Instagram account, comment or DM your keyword. Your first DM shows up here.",
      done: hasActivity,
    },
  ];
  return steps.every((step) => step.done) ? null : steps;
}
