import { createClient } from "@/lib/supabase/server";
import { RuleForm } from "../RuleForm";
import { createRule } from "../actions";

export default async function NewRulePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("instagram_accounts")
    .select("id, username, instagram_user_id")
    .order("created_at", { ascending: false });

  const accounts = (data ?? []).map((account) => ({
    id: account.id as string,
    label: `@${account.username ?? account.instagram_user_id}`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New rule</h1>
      {accounts.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Connect an Instagram account before creating a rule.
        </p>
      ) : (
        <RuleForm accounts={accounts} action={createRule} submitLabel="Create rule" />
      )}
    </div>
  );
}
