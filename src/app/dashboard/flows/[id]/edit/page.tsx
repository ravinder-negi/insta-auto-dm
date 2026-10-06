import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FlowWizard } from "@/features/flows/components/wizard/FlowWizard";
import { FlowFormPageHeader } from "@/features/flows/components/FlowFormPageHeader";
import { updateFlowAndRedirect } from "@/features/flows/actions";

export default async function EditFlowPage(
  props: PageProps<"/dashboard/flows/[id]/edit">
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: accountsData }, { data: flow }, { data: steps }] = await Promise.all([
    supabase
      .from("instagram_accounts")
      .select("id, username, instagram_user_id")
      .order("created_at", { ascending: false }),
    supabase
      .from("dm_flows")
      .select(
        "id, instagram_account_id, name, keyword_match, keywords, excluded_keywords, trigger_keyword, instagram_media_id, send_public_reply, public_reply_messages, public_reply_message"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("dm_flow_steps")
      .select(
        "step_order, message_text, expects_reply, collects_email, intent_map, options, attachment_url, attachment_type, followup_enabled, followup_delay_hours, followup_message, buttons, button_card_title"
      )
      .eq("flow_id", id)
      .order("step_order", { ascending: true }),
  ]);

  if (!flow) {
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
      <FlowFormPageHeader
        eyebrow="Edit flow"
        title={flow.name}
        description="Update the trigger keyword and steps for this flow."
      />

      <FlowWizard
        accounts={accounts}
        action={updateFlowAndRedirect.bind(null, id)}
        initialValues={{
          instagram_account_id: flow.instagram_account_id,
          name: flow.name,
          keyword_match: flow.keyword_match,
          keywords: flow.keywords?.length
            ? flow.keywords
            : flow.trigger_keyword
              ? [flow.trigger_keyword]
              : [],
          excluded_keywords: flow.excluded_keywords ?? [],
          trigger_keyword: flow.trigger_keyword,
          instagram_media_id: flow.instagram_media_id,
          send_public_reply: flow.send_public_reply,
          public_reply_messages: flow.public_reply_messages?.length
            ? flow.public_reply_messages
            : flow.public_reply_message
              ? [flow.public_reply_message]
              : [],
          public_reply_message: flow.public_reply_message,
          steps: (steps ?? []).map((step) => ({
            step_order: step.step_order,
            message_text: step.message_text,
            expects_reply: step.expects_reply,
            collects_email: step.collects_email,
            intent_map: step.intent_map ?? {},
            options: step.options ?? [],
            attachment_url: step.attachment_url,
            attachment_type: step.attachment_type,
            followup_enabled: step.followup_enabled,
            followup_delay_hours: step.followup_delay_hours,
            followup_message: step.followup_message,
            buttons: step.buttons ?? [],
            button_card_title: step.button_card_title,
          })),
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
