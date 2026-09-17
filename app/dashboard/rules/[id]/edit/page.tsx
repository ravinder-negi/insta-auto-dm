import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RuleForm } from "../../RuleForm";
import { RuleFormPageHeader } from "../../RuleFormPageHeader";
import { updateRule } from "../../actions";

export default async function EditRulePage(
  props: PageProps<"/dashboard/rules/[id]/edit">
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: accountsData }, { data: rule }] = await Promise.all([
    supabase
      .from("instagram_accounts")
      .select("id, username, instagram_user_id")
      .order("created_at", { ascending: false }),
    supabase
      .from("automation_rules")
      .select(
        "id, instagram_account_id, name, keyword, instagram_media_id, dm_message, require_follow, follow_prompt_message"
      )
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (!rule) {
    notFound();
  }

  const accounts = (accountsData ?? []).map((account) => {
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
        eyebrow="Edit rule"
        title={rule.name}
        description="Update the keyword and automated reply for this rule."
      />

      <RuleForm
        accounts={accounts}
        action={updateRule.bind(null, id)}
        initialValues={{
          instagram_account_id: rule.instagram_account_id,
          name: rule.name,
          keyword: rule.keyword,
          instagram_media_id: rule.instagram_media_id,
          dm_message: rule.dm_message,
          require_follow: rule.require_follow,
          follow_prompt_message: rule.follow_prompt_message,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
