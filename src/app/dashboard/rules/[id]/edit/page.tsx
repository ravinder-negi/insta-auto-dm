import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { followupFromMinutes } from "@/features/rules/components/wizard/shared";
import { RuleWizard } from "@/features/rules/components/wizard/RuleWizard";
import { RuleFormPageHeader } from "@/features/rules/components/RuleFormPageHeader";
import { updateRuleAndRedirect } from "@/features/rules/actions";

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
        "id, instagram_account_id, name, trigger_type, keyword_match, keywords, excluded_keywords, keyword, instagram_media_id, send_delay_seconds, dm_message, dm_buttons, dm_button_card_title, dm_card_subtitle, dm_default_action_url, require_follow, follow_prompt_message, collect_email, email_prompt_message, send_public_reply, public_reply_messages, public_reply_message, attachment_url, attachment_type, automation_rule_followups(step_order, delay_minutes, message)"
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

  // Rules created before keyword sets existed only carry the singular columns.
  const keywords = rule.keywords?.length
    ? rule.keywords
    : rule.keyword
      ? [rule.keyword]
      : [];

  const publicReplyMessages = rule.public_reply_messages?.length
    ? rule.public_reply_messages
    : rule.public_reply_message
      ? [rule.public_reply_message]
      : [];

  const followups = (rule.automation_rule_followups ?? [])
    .slice()
    .sort((a, b) => a.step_order - b.step_order)
    .map((followup) => ({
      ...followupFromMinutes(followup.delay_minutes),
      message: followup.message,
    }));

  return (
    <div className="flex flex-col gap-8">
      <RuleFormPageHeader
        eyebrow="Edit AutoDM"
        title={rule.name}
        description="Update the trigger and automated reply for this AutoDM."
      />

      <RuleWizard
        accounts={accounts}
        action={updateRuleAndRedirect.bind(null, id)}
        initialValues={{
          instagram_account_id: rule.instagram_account_id,
          name: rule.name,
          trigger_type: rule.trigger_type,
          keyword_match: rule.keyword_match,
          keywords,
          excluded_keywords: rule.excluded_keywords ?? [],
          instagram_media_id: rule.instagram_media_id,
          dm_message: rule.dm_message,
          require_follow: rule.require_follow,
          follow_prompt_message: rule.follow_prompt_message,
          send_public_reply: rule.send_public_reply,
          public_reply_messages: publicReplyMessages,
          collect_email: rule.collect_email,
          email_prompt_message: rule.email_prompt_message,
          send_delay_seconds: rule.send_delay_seconds,
          dm_buttons: rule.dm_buttons,
          dm_button_card_title: rule.dm_button_card_title,
          dm_card_subtitle: rule.dm_card_subtitle,
          dm_default_action_url: rule.dm_default_action_url,
          followups,
          attachment_url: rule.attachment_url,
          attachment_type: rule.attachment_type,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
