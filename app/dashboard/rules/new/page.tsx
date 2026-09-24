import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "../../components/EmptyState";
import { InstagramIcon, PlusIcon } from "../../components/icons";
import { primaryButtonClass } from "../../components/styles";
import { RuleForm } from "../RuleForm";
import { RuleFormPageHeader } from "../RuleFormPageHeader";
import { createRule } from "../actions";

export default async function NewRulePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("instagram_accounts")
    .select("id, username, instagram_user_id")
    .order("created_at", { ascending: false });

  const accounts = (data ?? []).map((account) => {
    const handle = (account.username ?? account.instagram_user_id) as string;
    return {
      id: account.id as string,
      handle,
      label: `@${handle}`,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <RuleFormPageHeader
        eyebrow="Create rule"
        title="Create automation rule"
        description="Set a keyword and automated reply for Instagram comments. Save time and engage your audience 24/7."
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={<InstagramIcon className="h-6 w-6" />}
          title="Connect an account first"
          description="A rule needs an Instagram account to listen to."
          action={
            <Link
              href="/dashboard/accounts"
              className={`${primaryButtonClass} mt-2`}
            >
              <PlusIcon className="h-4 w-4" />
              Connect Instagram account
            </Link>
          }
        />
      ) : (
        <RuleForm accounts={accounts} action={createRule} submitLabel="Create rule" />
      )}
    </div>
  );
}
