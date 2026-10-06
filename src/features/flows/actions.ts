"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DmFlowIntentMap, DmFlowStepOption, KeywordMatch } from "@/types";
import type { FlowWizardInitialValues } from "@/features/flows/components/wizard/FlowWizard";

export type FlowFormState = { error: string } | { ok: true } | undefined;

const ATTACHMENT_TYPES = ["image", "video", "audio"] as const;

const MAX_BUTTONS = 3;
const MAX_KEYWORDS = 20;

export interface FlowStepButtonInput {
  label: string;
  url: string;
}

export interface FlowStepInput {
  step_order: number;
  message_text: string;
  expects_reply: boolean;
  collects_email: boolean;
  intent_map: DmFlowIntentMap;
  options: DmFlowStepOption[];
  attachment_url: string | null;
  attachment_type: (typeof ATTACHMENT_TYPES)[number] | null;
  followup_enabled: boolean;
  followup_delay_hours: number | null;
  followup_message: string | null;
  /** Only sent when this is the flow's last step — see StepsStep.tsx. */
  buttons: FlowStepButtonInput[];
  button_card_title: string | null;
}

interface FlowFields {
  instagram_account_id: string;
  name: string;
  keyword_match: KeywordMatch;
  keywords: string[];
  excluded_keywords: string[];
  /** Legacy single-keyword column, kept in sync with keywords[0]. */
  trigger_keyword: string | null;
  instagram_media_id: string | null;
  send_public_reply: boolean;
  public_reply_messages: string[];
  /** Legacy single-reply column, kept in sync with public_reply_messages[0]. */
  public_reply_message: string | null;
  steps: FlowStepInput[];
}

function readFlowFields(
  formData: FormData
): { ok: true; fields: FlowFields } | { ok: false; error: string } {
  const instagramAccountId = String(formData.get("instagram_account_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const instagramMediaIdRaw = String(formData.get("instagram_media_id") ?? "").trim();
  const sendPublicReply = formData.get("send_public_reply") === "on";
  const stepsRaw = String(formData.get("steps") ?? "");

  const keywordMatchRaw = String(formData.get("keyword_match") ?? "specific");
  const keywordMatch: KeywordMatch = keywordMatchRaw === "any" ? "any" : "specific";

  let keywords: string[] = [];
  try {
    keywords = JSON.parse(String(formData.get("keywords") ?? "[]"));
  } catch {
    return { ok: false, error: "Invalid keyword data." };
  }
  keywords = keywords
    .map((keyword) => String(keyword).trim())
    .filter(Boolean)
    .slice(0, MAX_KEYWORDS);

  let excludedKeywords: string[] = [];
  try {
    excludedKeywords = JSON.parse(String(formData.get("excluded_keywords") ?? "[]"));
  } catch {
    return { ok: false, error: "Invalid excluded keyword data." };
  }
  excludedKeywords = excludedKeywords
    .map((keyword) => String(keyword).trim())
    .filter(Boolean)
    .slice(0, MAX_KEYWORDS);

  let publicReplyMessages: string[] = [];
  try {
    publicReplyMessages = JSON.parse(String(formData.get("public_reply_messages") ?? "[]"));
  } catch {
    return { ok: false, error: "Invalid public reply data." };
  }
  publicReplyMessages = publicReplyMessages
    .map((message) => String(message).trim())
    .filter(Boolean);

  if (!instagramAccountId || !name) {
    return {
      ok: false,
      error: "Account and name are required.",
    };
  }

  if (keywordMatch === "specific" && keywords.length === 0) {
    return {
      ok: false,
      error: "Add at least one trigger keyword, or switch to 'Any comment'.",
    };
  }

  if (sendPublicReply && publicReplyMessages.length === 0) {
    return {
      ok: false,
      error: "At least one public reply message is required when 'Auto-Reply to comments' is on.",
    };
  }

  let steps: FlowStepInput[];
  try {
    steps = JSON.parse(stepsRaw);
  } catch {
    return { ok: false, error: "Invalid step data." };
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    return { ok: false, error: "A flow needs at least one step." };
  }

  for (const step of steps) {
    if (!step.message_text?.trim()) {
      return { ok: false, error: "Every step needs a message." };
    }
    if (step.attachment_url && !/^https:\/\/\S+$/.test(step.attachment_url)) {
      return { ok: false, error: "Attachment URL must be a valid https:// link." };
    }
    if (Array.isArray(step.buttons) && step.buttons.length > 0) {
      for (const button of step.buttons as FlowStepButtonInput[]) {
        if (!button.label?.trim() || !/^https:\/\/\S+$/.test(button.url ?? "")) {
          return { ok: false, error: "Every button needs a label and a valid https:// link." };
        }
      }
    }
    if (
      step.expects_reply &&
      step.followup_enabled &&
      (!step.followup_delay_hours || step.followup_delay_hours <= 0 || !step.followup_message?.trim())
    ) {
      return {
        ok: false,
        error: "Follow-up needs both a delay (hours) and a reminder message.",
      };
    }
    if (
      step.expects_reply &&
      !step.collects_email &&
      Array.isArray(step.options) &&
      step.options.length > 0 &&
      step.options.some((option: DmFlowStepOption) => !option.label?.trim())
    ) {
      return { ok: false, error: "Every option needs a label." };
    }
  }

  return {
    ok: true,
    fields: {
      instagram_account_id: instagramAccountId,
      name,
      keyword_match: keywordMatch,
      keywords,
      excluded_keywords: excludedKeywords,
      trigger_keyword: keywords[0] ?? null,
      instagram_media_id: instagramMediaIdRaw || null,
      send_public_reply: sendPublicReply,
      public_reply_messages: sendPublicReply ? publicReplyMessages : [],
      public_reply_message: sendPublicReply ? (publicReplyMessages[0] ?? null) : null,
      steps: steps.map((step, index) => {
        const hasOptions =
          step.expects_reply &&
          !step.collects_email &&
          Array.isArray(step.options) &&
          step.options.some((option: DmFlowStepOption) => option.label?.trim());

        return {
          step_order: index + 1,
          message_text: step.message_text.trim(),
          expects_reply: Boolean(step.expects_reply),
          collects_email: step.expects_reply ? Boolean(step.collects_email) : false,
          intent_map: step.expects_reply
            ? step.collects_email
              ? { yes: step.intent_map?.yes }
              : hasOptions
                ? {}
                : (step.intent_map ?? {})
            : {},
          options: hasOptions
            ? step.options
                .filter((option: DmFlowStepOption) => option.label?.trim())
                .map((option: DmFlowStepOption) => ({
                  label: option.label.trim(),
                  target_step_order: option.target_step_order ?? null,
                }))
            : [],
          attachment_url: step.attachment_url?.trim() || null,
          attachment_type: step.attachment_url?.trim()
            ? (ATTACHMENT_TYPES.includes(step.attachment_type as (typeof ATTACHMENT_TYPES)[number])
                ? step.attachment_type
                : "image")
            : null,
          followup_enabled: step.expects_reply ? Boolean(step.followup_enabled) : false,
          followup_delay_hours:
            step.expects_reply && step.followup_enabled ? step.followup_delay_hours : null,
          followup_message:
            step.expects_reply && step.followup_enabled
              ? step.followup_message?.trim() ?? null
              : null,
          buttons: Array.isArray(step.buttons)
            ? step.buttons.slice(0, MAX_BUTTONS).map((button) => ({
                label: button.label.trim(),
                url: button.url.trim(),
              }))
            : [],
          button_card_title: step.button_card_title?.trim() || null,
        };
      }),
    },
  };
}

async function insertSteps(
  supabase: Awaited<ReturnType<typeof createClient>>,
  flowId: string,
  steps: FlowStepInput[]
) {
  const { error } = await supabase.from("dm_flow_steps").insert(
    steps.map((step) => ({
      flow_id: flowId,
      step_order: step.step_order,
      message_text: step.message_text,
      expects_reply: step.expects_reply,
      collects_email: step.collects_email,
      attachment_url: step.attachment_url,
      attachment_type: step.attachment_type,
      followup_enabled: step.followup_enabled,
      followup_delay_hours: step.followup_delay_hours,
      followup_message: step.followup_message,
      intent_map: step.intent_map,
      options: step.options,
      buttons: step.buttons,
      button_card_title: step.button_card_title,
    }))
  );
  return error;
}

async function createFlowCore(formData: FormData): Promise<FlowFormState> {
  const parsed = readFlowFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { data: flow, error } = await supabase
    .from("dm_flows")
    .insert({
      instagram_account_id: parsed.fields.instagram_account_id,
      name: parsed.fields.name,
      keyword_match: parsed.fields.keyword_match,
      keywords: parsed.fields.keywords,
      excluded_keywords: parsed.fields.excluded_keywords,
      trigger_keyword: parsed.fields.trigger_keyword,
      instagram_media_id: parsed.fields.instagram_media_id,
      send_public_reply: parsed.fields.send_public_reply,
      public_reply_messages: parsed.fields.public_reply_messages,
      public_reply_message: parsed.fields.public_reply_message,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !flow) {
    return { error: error?.message ?? "Failed to create flow." };
  }

  const stepsError = await insertSteps(supabase, flow.id, parsed.fields.steps);
  if (stepsError) {
    return { error: stepsError.message };
  }

  revalidatePath("/dashboard/flows");
  return { ok: true };
}

/** Used by the "New flow" modal — reports success back so the modal can close
 *  itself instead of navigating away. */
export async function createFlow(
  _prevState: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  return createFlowCore(formData);
}

/** Used by the standalone /dashboard/flows/new page. */
export async function createFlowAndRedirect(
  _prevState: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const result = await createFlowCore(formData);
  if (result && "error" in result) return result;
  redirect("/dashboard/flows?created=1");
}

async function updateFlowCore(id: string, formData: FormData): Promise<FlowFormState> {
  const parsed = readFlowFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("dm_flows")
    .update({
      instagram_account_id: parsed.fields.instagram_account_id,
      name: parsed.fields.name,
      keyword_match: parsed.fields.keyword_match,
      keywords: parsed.fields.keywords,
      excluded_keywords: parsed.fields.excluded_keywords,
      trigger_keyword: parsed.fields.trigger_keyword,
      instagram_media_id: parsed.fields.instagram_media_id,
      send_public_reply: parsed.fields.send_public_reply,
      public_reply_messages: parsed.fields.public_reply_messages,
      public_reply_message: parsed.fields.public_reply_message,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  // Whole-flow step replace: simplest way to keep step_order contiguous
  // after add/remove/reorder in the builder. Any session mid-flow when
  // this happens may land on a step_order that changed meaning — an
  // accepted MVP tradeoff (see migration notes).
  const { error: deleteError } = await supabase
    .from("dm_flow_steps")
    .delete()
    .eq("flow_id", id);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const stepsError = await insertSteps(supabase, id, parsed.fields.steps);
  if (stepsError) {
    return { error: stepsError.message };
  }

  revalidatePath("/dashboard/flows");
  return { ok: true };
}

/** Used by the edit modal — reports success back instead of navigating away. */
export async function updateFlow(
  id: string,
  _prevState: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  return updateFlowCore(id, formData);
}

/** Used by the standalone /dashboard/flows/[id]/edit page. */
export async function updateFlowAndRedirect(
  id: string,
  _prevState: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const result = await updateFlowCore(id, formData);
  if (result && "error" in result) return result;
  redirect("/dashboard/flows?updated=1");
}

export async function deleteFlow(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("dm_flows").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/flows");
}

export interface FlowFormData {
  accounts: { id: string; handle: string; label: string }[];
  initialValues?: FlowWizardInitialValues;
}

/** Fetches everything the flow-form modal needs to render — the account list
 *  always, and the flow's own data when editing — in one round trip from the
 *  client, since the modal isn't backed by a server-rendered page. */
export async function getFlowFormData(
  id?: string
): Promise<FlowFormData | { error: string }> {
  const supabase = await createClient();

  const accountsPromise = supabase
    .from("instagram_accounts")
    .select("id, username, instagram_user_id")
    .order("created_at", { ascending: false });

  if (!id) {
    const { data } = await accountsPromise;
    return { accounts: mapFlowFormAccounts(data) };
  }

  const [{ data: accountsData }, { data: flow }, { data: steps }] = await Promise.all([
    accountsPromise,
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
    return { error: "Flow not found." };
  }

  return {
    accounts: mapFlowFormAccounts(accountsData),
    initialValues: {
      instagram_account_id: flow.instagram_account_id,
      name: flow.name,
      keyword_match: flow.keyword_match,
      // Flows created before keyword sets existed only have the singular column.
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
    },
  };
}

function mapFlowFormAccounts(
  data: { id: string; username: string | null; instagram_user_id: string }[] | null
) {
  return (data ?? []).map((account) => {
    const handle = (account.username ?? account.instagram_user_id) as string;
    return { id: account.id as string, handle, label: `@${handle}` };
  });
}

export async function toggleFlowActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("dm_flows")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/flows");
}
