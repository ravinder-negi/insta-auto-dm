"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RuleFormState = { error: string } | undefined;

const ATTACHMENT_TYPES = ["image", "video", "audio"] as const;

const KEYWORD_MATCHES = ["specific", "any"] as const;

const TRIGGER_TYPES = ["comment_keyword", "story_reply", "live_comment"] as const;

type TriggerType = (typeof TRIGGER_TYPES)[number];

const MAX_KEYWORDS = 20;
const MAX_PUBLIC_REPLIES = 3;
const PUBLIC_REPLY_MAX_LENGTH = 140;
const MAX_BUTTONS = 3;
const BUTTON_LABEL_MAX_LENGTH = 60;
const CARD_TITLE_MAX_LENGTH = 80;
const MAX_FOLLOWUPS = 3;
const MIN_DELAY_SECONDS = 1;
const MAX_DELAY_SECONDS = 86400;
const MAX_FOLLOWUP_DELAY_MINUTES = 10080;

type KeywordMatch = (typeof KEYWORD_MATCHES)[number];

export interface RuleButton {
  label: string;
  url: string;
}

export interface RuleFollowup {
  step_order: number;
  delay_minutes: number;
  message: string;
}

interface RuleFields {
  instagram_account_id: string;
  name: string;
  trigger_type: TriggerType;
  keyword_match: KeywordMatch;
  keywords: string[];
  excluded_keywords: string[];
  /** Kept in sync with keywords[0] for readers still on the single column. */
  keyword: string | null;
  instagram_media_id: string | null;
  send_delay_seconds: number;
  dm_message: string;
  dm_buttons: RuleButton[];
  dm_button_card_title: string | null;
  require_follow: boolean;
  follow_prompt_message: string | null;
  collect_email: boolean;
  email_prompt_message: string | null;
  send_public_reply: boolean;
  public_reply_messages: string[];
  /** Kept in sync with public_reply_messages[0]. */
  public_reply_message: string | null;
  attachment_url: string | null;
  attachment_type: (typeof ATTACHMENT_TYPES)[number] | null;
}

/** Trims, drops blanks and removes case-insensitive duplicates, keeping the
 *  casing the user typed. */
function readList(formData: FormData, field: string, limit: number): string[] {
  const seen = new Set<string>();
  const values: string[] = [];

  for (const raw of formData.getAll(field)) {
    const value = String(raw).trim();
    if (!value) continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    values.push(value);
    if (values.length === limit) break;
  }

  return values;
}

/** Buttons travel as one JSON field — they're the only nested shape in the
 *  form, and pairing parallel getAll() lists would be more fragile. */
function readButtons(formData: FormData): RuleButton[] | { error: string } {
  const raw = String(formData.get("dm_buttons") ?? "").trim();
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Buttons could not be read. Please re-add them." };
  }

  if (!Array.isArray(parsed)) return [];

  const buttons: RuleButton[] = [];

  for (const entry of parsed.slice(0, MAX_BUTTONS)) {
    const label = String((entry as RuleButton)?.label ?? "").trim();
    const url = String((entry as RuleButton)?.url ?? "").trim();

    if (!label || !url) {
      return { error: "Every button needs a label and a link." };
    }
    if (label.length > BUTTON_LABEL_MAX_LENGTH) {
      return {
        error: `Button labels must be ${BUTTON_LABEL_MAX_LENGTH} characters or fewer.`,
      };
    }
    if (!/^https:\/\/\S+$/.test(url)) {
      return { error: "Button links must be valid https:// URLs." };
    }

    buttons.push({ label, url });
  }

  return buttons;
}

/** Follow-ups arrive as two parallel lists, one entry per card. */
function readFollowups(formData: FormData): RuleFollowup[] | { error: string } {
  const delays = formData.getAll("followup_delay_minutes");
  const messages = formData.getAll("followup_message");

  const followups: RuleFollowup[] = [];

  for (let index = 0; index < Math.min(delays.length, MAX_FOLLOWUPS); index += 1) {
    const message = String(messages[index] ?? "").trim();
    const delayMinutes = Number(String(delays[index] ?? ""));

    if (!message) continue;

    if (
      !Number.isFinite(delayMinutes) ||
      delayMinutes < 1 ||
      delayMinutes > MAX_FOLLOWUP_DELAY_MINUTES
    ) {
      return {
        error: "Follow-up delays must be between 1 minute and 7 days.",
      };
    }

    followups.push({
      step_order: followups.length + 1,
      delay_minutes: Math.round(delayMinutes),
      message,
    });
  }

  return followups;
}

function readRuleFields(
  formData: FormData
):
  | { ok: true; fields: RuleFields; followups: RuleFollowup[] }
  | { ok: false; error: string } {
  const instagramAccountId = String(formData.get("instagram_account_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const triggerTypeRaw = String(
    formData.get("trigger_type") ?? "comment_keyword"
  ).trim();
  const keywordMatchRaw = String(formData.get("keyword_match") ?? "specific").trim();
  const keywords = readList(formData, "keywords", MAX_KEYWORDS);
  const excludedKeywords = readList(formData, "excluded_keywords", MAX_KEYWORDS);
  const instagramMediaIdRaw = String(formData.get("instagram_media_id") ?? "").trim();
  const dmMessage = String(formData.get("dm_message") ?? "").trim();
  const requireFollow = formData.get("require_follow") === "on";
  const followPromptMessage = String(formData.get("follow_prompt_message") ?? "").trim();
  const sendPublicReply = formData.get("send_public_reply") === "on";
  const publicReplyMessages = readList(
    formData,
    "public_reply_messages",
    MAX_PUBLIC_REPLIES
  );
  const attachmentUrl = String(formData.get("attachment_url") ?? "").trim();
  const attachmentTypeRaw = String(formData.get("attachment_type") ?? "").trim();
  const collectEmail = formData.get("collect_email") === "on";
  const emailPromptMessage = String(formData.get("email_prompt_message") ?? "").trim();
  const delayValue = Number(String(formData.get("send_delay_value") ?? "0"));
  const delayUnit = String(formData.get("send_delay_unit") ?? "second").trim();

  const sendDelaySeconds = Math.round(
    (Number.isFinite(delayValue) && delayValue > 0 ? delayValue : 0) *
      (delayUnit === "minute" ? 60 : 1)
  );

  const buttons = readButtons(formData);
  if ("error" in buttons) return { ok: false, error: buttons.error };

  const cardTitle = String(formData.get("dm_button_card_title") ?? "")
    .trim()
    .slice(0, CARD_TITLE_MAX_LENGTH);

  const followups = readFollowups(formData);
  if ("error" in followups) return { ok: false, error: followups.error };

  const keywordMatch = KEYWORD_MATCHES.includes(keywordMatchRaw as KeywordMatch)
    ? (keywordMatchRaw as KeywordMatch)
    : "specific";

  const triggerType = TRIGGER_TYPES.includes(triggerTypeRaw as TriggerType)
    ? (triggerTypeRaw as TriggerType)
    : "comment_keyword";

  // A story reply has no comment to publicly reply to.
  const effectiveSendPublicReply =
    triggerType === "story_reply" ? false : sendPublicReply;

  // A Live's media id doesn't exist until the broadcast starts, so it can
  // never be picked ahead of time — enforce account-wide server-side too,
  // not just via the wizard's forced "any" scope.
  const effectiveInstagramMediaId =
    triggerType === "live_comment" ? null : instagramMediaIdRaw || null;

  if (!instagramAccountId || !name || !dmMessage) {
    return {
      ok: false,
      error: "Account, name, and DM message are required.",
    };
  }

  if (keywordMatch === "specific" && keywords.length === 0) {
    return {
      ok: false,
      error: "Add at least one keyword, or switch the trigger to match everything.",
    };
  }

  if (sendDelaySeconds < MIN_DELAY_SECONDS) {
    return { ok: false, error: "Set a time delay of at least 1 second." };
  }

  if (sendDelaySeconds > MAX_DELAY_SECONDS) {
    return { ok: false, error: "The time delay can be at most 24 hours." };
  }

  if (buttons.length > 0 && !cardTitle) {
    return {
      ok: false,
      error: "Give the button card a title.",
    };
  }

  if (collectEmail && !emailPromptMessage) {
    return {
      ok: false,
      error: "Write the message that asks for an email address.",
    };
  }

  if (requireFollow && !followPromptMessage) {
    return {
      ok: false,
      error: "Follow-prompt message is required when 'Require follow' is on.",
    };
  }

  if (effectiveSendPublicReply && publicReplyMessages.length === 0) {
    return {
      ok: false,
      error: "Add at least one comment response when auto-reply is on.",
    };
  }

  if (
    effectiveSendPublicReply &&
    publicReplyMessages.some((message) => message.length > PUBLIC_REPLY_MAX_LENGTH)
  ) {
    return {
      ok: false,
      error: `Each comment response must be ${PUBLIC_REPLY_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (attachmentUrl && !/^https:\/\/\S+$/.test(attachmentUrl)) {
    return { ok: false, error: "Attachment URL must be a valid https:// link." };
  }

  const attachmentType = ATTACHMENT_TYPES.includes(
    attachmentTypeRaw as (typeof ATTACHMENT_TYPES)[number]
  )
    ? (attachmentTypeRaw as (typeof ATTACHMENT_TYPES)[number])
    : "image";

  const effectiveKeywords = keywordMatch === "any" ? [] : keywords;

  return {
    ok: true,
    followups,
    fields: {
      instagram_account_id: instagramAccountId,
      name,
      trigger_type: triggerType,
      keyword_match: keywordMatch,
      keywords: effectiveKeywords,
      excluded_keywords: excludedKeywords,
      keyword: effectiveKeywords[0] ?? null,
      instagram_media_id: effectiveInstagramMediaId,
      send_delay_seconds: sendDelaySeconds,
      dm_message: dmMessage,
      dm_buttons: buttons,
      dm_button_card_title: buttons.length > 0 ? cardTitle : null,
      require_follow: requireFollow,
      follow_prompt_message: requireFollow ? followPromptMessage : null,
      collect_email: collectEmail,
      email_prompt_message: collectEmail ? emailPromptMessage : null,
      send_public_reply: effectiveSendPublicReply,
      public_reply_messages: effectiveSendPublicReply ? publicReplyMessages : [],
      public_reply_message: effectiveSendPublicReply
        ? (publicReplyMessages[0] ?? null)
        : null,
      attachment_url: attachmentUrl || null,
      attachment_type: attachmentUrl ? attachmentType : null,
    },
  };
}

/** Follow-ups are a small ordered list, so a replace is simpler — and safer
 *  against reordering — than diffing rows. */
async function replaceFollowups(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ruleId: string,
  followups: RuleFollowup[]
): Promise<string | null> {
  const { error: deleteError } = await supabase
    .from("automation_rule_followups")
    .delete()
    .eq("automation_rule_id", ruleId);

  if (deleteError) return deleteError.message;
  if (followups.length === 0) return null;

  const { error: insertError } = await supabase
    .from("automation_rule_followups")
    .insert(
      followups.map((followup) => ({
        automation_rule_id: ruleId,
        step_order: followup.step_order,
        delay_minutes: followup.delay_minutes,
        message: followup.message,
      }))
    );

  return insertError ? insertError.message : null;
}

export async function createRule(
  _prevState: RuleFormState,
  formData: FormData
): Promise<RuleFormState> {
  const parsed = readRuleFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("automation_rules")
    .insert({
      ...parsed.fields,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  const followupError = await replaceFollowups(
    supabase,
    created.id as string,
    parsed.followups
  );
  if (followupError) return { error: followupError };

  revalidatePath("/dashboard/rules");
  redirect("/dashboard/rules?created=1");
}

export async function updateRule(
  id: string,
  _prevState: RuleFormState,
  formData: FormData
): Promise<RuleFormState> {
  const parsed = readRuleFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("automation_rules")
    .update({ ...parsed.fields, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  const followupError = await replaceFollowups(supabase, id, parsed.followups);
  if (followupError) return { error: followupError };

  revalidatePath("/dashboard/rules");
  redirect("/dashboard/rules?updated=1");
}

export async function deleteRule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("automation_rules").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/rules");
}

export async function toggleRuleActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("automation_rules")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/rules");
}

export async function duplicateRule(id: string) {
  const supabase = await createClient();
  const { data: rule, error: readError } = await supabase
    .from("automation_rules")
    .select(
      "instagram_account_id, name, trigger_type, keyword_match, keywords, excluded_keywords, keyword, instagram_media_id, send_delay_seconds, dm_message, dm_buttons, dm_button_card_title, require_follow, follow_prompt_message, collect_email, email_prompt_message, send_public_reply, public_reply_messages, public_reply_message, attachment_url, attachment_type"
    )
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }
  if (!rule) {
    throw new Error("AutoDM not found.");
  }

  const { data: copy, error } = await supabase
    .from("automation_rules")
    .insert({
      ...rule,
      name: `${rule.name} (copy)`,
      is_active: false,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { data: followups } = await supabase
    .from("automation_rule_followups")
    .select("step_order, delay_minutes, message")
    .eq("automation_rule_id", id)
    .order("step_order");

  if (followups?.length) {
    const followupError = await replaceFollowups(
      supabase,
      copy.id as string,
      followups as RuleFollowup[]
    );
    if (followupError) throw new Error(followupError);
  }

  revalidatePath("/dashboard/rules");
}
