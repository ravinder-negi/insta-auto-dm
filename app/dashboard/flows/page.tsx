import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { DmFlow, InstagramAccount } from "@/lib/types";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { primaryButtonClass } from "../components/styles";
import { CheckIcon, CloseIcon, LayersIcon, PauseIcon, PlusIcon } from "../components/icons";
import { FlowsTable, type FlowTableRow } from "./FlowsTable";

type FlowQueryRow = Pick<
  DmFlow,
  | "id"
  | "name"
  | "trigger_keyword"
  | "instagram_media_id"
  | "is_active"
  | "created_at"
  | "instagram_account_id"
> & {
  instagram_accounts: Pick<
    InstagramAccount,
    "username" | "instagram_user_id" | "is_active"
  > | null;
  dm_flow_steps: { id: string }[] | null;
};

export default async function FlowsPage() {
  const supabase = await createClient();

  const [{ data, error }, { data: accountsData }] = await Promise.all([
    supabase
      .from("dm_flows")
      .select(
        "id, name, trigger_keyword, instagram_media_id, is_active, created_at, instagram_account_id, instagram_accounts(username, instagram_user_id, is_active), dm_flow_steps(id)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("instagram_accounts")
      .select("id, username, instagram_user_id")
      .order("created_at", { ascending: false }),
  ]);

  const flows: FlowTableRow[] = ((data as unknown as FlowQueryRow[]) ?? []).map(
    (flow) => ({
      id: flow.id,
      name: flow.name,
      trigger_keyword: flow.trigger_keyword,
      instagram_media_id: flow.instagram_media_id,
      step_count: flow.dm_flow_steps?.length ?? 0,
      is_active: flow.is_active,
      created_at: flow.created_at,
      accountId: flow.instagram_account_id,
      accountHandle:
        flow.instagram_accounts?.username ??
        flow.instagram_accounts?.instagram_user_id ??
        "unknown",
      accountActive: flow.instagram_accounts?.is_active ?? false,
    })
  );

  const accounts = (accountsData ?? []).map((account) => ({
    id: account.id as string,
    handle: (account.username ?? account.instagram_user_id) as string,
  }));

  const activeCount = flows.filter(
    (flow) => flow.is_active && flow.accountActive
  ).length;
  const pausedCount = flows.filter(
    (flow) => !flow.is_active && flow.accountActive
  ).length;
  const disabledCount = flows.filter((flow) => !flow.accountActive).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Automation"
        title="DM flows"
        description="Send a sequence of DMs that branch on how the recipient replies."
      />

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
          {error.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total flows"
          value={flows.length}
          tone="indigo"
          icon={<LayersIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Active"
          value={activeCount}
          tone="green"
          icon={<CheckIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Paused"
          value={pausedCount}
          tone="amber"
          icon={<PauseIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Disabled"
          value={disabledCount}
          tone="red"
          icon={<CloseIcon className="h-5 w-5" />}
        />
      </div>

      {flows.length === 0 ? (
        <EmptyState
          icon={<LayersIcon className="h-6 w-6" />}
          title="No flows yet"
          description="Connect an account first, then build a multi-step DM flow that branches on how someone replies."
          action={
            <Link href="/dashboard/flows/new" className={`${primaryButtonClass} mt-2`}>
              <PlusIcon className="h-4 w-4" />
              Create your first flow
            </Link>
          }
        />
      ) : (
        <FlowsTable flows={flows} accounts={accounts} />
      )}
    </div>
  );
}
