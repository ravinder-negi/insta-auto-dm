import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { DmFlow, InstagramAccount } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { AutomationHero } from "@/components/ui/AutomationHero";
import { primaryButtonClass } from "@/components/ui/styles";
import { ChartIcon, ClockIcon, LayersIcon, PlusIcon } from "@/components/icons";
import { FlowsTable, type FlowTableRow } from "@/features/flows/components/FlowsTable";
import { NewFlowButton } from "@/features/flows/components/NewFlowButton";
import { getViewPreference } from "@/lib/viewPreference/server";
import { VIEW_PREFERENCE_KEYS } from "@/lib/viewPreference/keys";

type FlowQueryRow = Pick<
  DmFlow,
  | "id"
  | "name"
  | "keyword_match"
  | "keywords"
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
  dm_flow_steps: { id: string; step_order: number; message_text: string }[] | null;
};

export default async function FlowsPage() {
  const initialView = await getViewPreference(VIEW_PREFERENCE_KEYS.flows, ["card", "list"] as const, "card");
  const supabase = await createClient();

  const [{ data, error }, { data: accountsData }] = await Promise.all([
    supabase
      .from("dm_flows")
      .select(
        "id, name, keyword_match, keywords, trigger_keyword, instagram_media_id, is_active, created_at, instagram_account_id, instagram_accounts(username, instagram_user_id, is_active), dm_flow_steps(id, step_order, message_text)"
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
      keywordMatch: flow.keyword_match,
      // Flows created before keyword sets existed only have the singular column.
      keywords: flow.keywords?.length
        ? flow.keywords
        : flow.trigger_keyword
          ? [flow.trigger_keyword]
          : [],
      instagram_media_id: flow.instagram_media_id,
      step_count: flow.dm_flow_steps?.length ?? 0,
      firstMessage:
        flow.dm_flow_steps?.slice().sort((a, b) => a.step_order - b.step_order)[0]
          ?.message_text ?? null,
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

  return (
    <div className="flex flex-col gap-8">
      <AutomationHero
        titlePlain="DM "
        titleAccent="Flows"
        description="Send a sequence of DMs that branch on how the recipient replies."
        actions={
          <>
            <Link
              href="/dashboard/flows/analytics"
              className="inline-flex min-h-[50px] items-center gap-2.5 rounded-full border px-5.5 font-semibold"
              style={{ borderColor: "var(--line)", backgroundColor: "#fff", color: "var(--ink)" }}
            >
              <ChartIcon className="h-4.5 w-4.5" />
              Analytics
            </Link>
            <Link
              href="/dashboard/flows/executions"
              className="inline-flex min-h-[50px] items-center gap-2.5 rounded-full border px-5.5 font-semibold"
              style={{ borderColor: "var(--line)", backgroundColor: "#fff", color: "var(--ink)" }}
            >
              <ClockIcon className="h-4.5 w-4.5" />
              Execution log
            </Link>
          </>
        }
      />

      {error && (
        <p
          className="rounded-xl border px-4 py-3 text-sm font-semibold"
          style={{ borderColor: "var(--danger-border)", backgroundColor: "var(--danger-tint-faint)", color: "var(--danger-deep)" }}
        >
          {error.message}
        </p>
      )}

      {flows.length === 0 ? (
        <EmptyState
          icon={<LayersIcon className="h-6 w-6" />}
          title="No flows yet"
          description="Connect an account first, then build a multi-step DM flow that branches on how someone replies."
          action={
            <NewFlowButton className={`${primaryButtonClass} mt-2`}>
              <PlusIcon className="h-4 w-4" />
              Create your first flow
            </NewFlowButton>
          }
        />
      ) : (
        <FlowsTable flows={flows} accounts={accounts} initialView={initialView} />
      )}
    </div>
  );
}
