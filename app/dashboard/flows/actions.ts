"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DmFlowIntentMap } from "@/lib/types";

export type FlowFormState = { error: string } | undefined;

const ATTACHMENT_TYPES = ["image", "video", "audio"] as const;

export interface FlowStepInput {
  step_order: number;
  message_text: string;
  expects_reply: boolean;
  collects_email: boolean;
  intent_map: DmFlowIntentMap;
  attachment_url: string | null;
  attachment_type: (typeof ATTACHMENT_TYPES)[number] | null;
  followup_enabled: boolean;
  followup_delay_hours: number | null;
  followup_message: string | null;
}

interface FlowFields {
  instagram_account_id: string;
  name: string;
  trigger_keyword: string;
  instagram_media_id: string | null;
  send_public_reply: boolean;
  public_reply_message: string | null;
  steps: FlowStepInput[];
}

function readFlowFields(
  formData: FormData
): { ok: true; fields: FlowFields } | { ok: false; error: string } {
  const instagramAccountId = String(formData.get("instagram_account_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const triggerKeyword = String(formData.get("trigger_keyword") ?? "").trim();
  const instagramMediaIdRaw = String(formData.get("instagram_media_id") ?? "").trim();
  const sendPublicReply = formData.get("send_public_reply") === "on";
  const publicReplyMessage = String(formData.get("public_reply_message") ?? "").trim();
  const stepsRaw = String(formData.get("steps") ?? "");

  if (!instagramAccountId || !name || !triggerKeyword) {
    return {
      ok: false,
      error: "Account, name, and trigger keyword are required.",
    };
  }

  if (sendPublicReply && !publicReplyMessage) {
    return {
      ok: false,
      error: "Public reply message is required when 'Reply on the comment' is on.",
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
  }

  return {
    ok: true,
    fields: {
      instagram_account_id: instagramAccountId,
      name,
      trigger_keyword: triggerKeyword,
      instagram_media_id: instagramMediaIdRaw || null,
      send_public_reply: sendPublicReply,
      public_reply_message: sendPublicReply ? publicReplyMessage : null,
      steps: steps.map((step, index) => ({
        step_order: index + 1,
        message_text: step.message_text.trim(),
        expects_reply: Boolean(step.expects_reply),
        collects_email: step.expects_reply ? Boolean(step.collects_email) : false,
        intent_map: step.expects_reply
          ? step.collects_email
            ? { yes: step.intent_map?.yes }
            : (step.intent_map ?? {})
          : {},
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
      })),
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
    }))
  );
  return error;
}

export async function createFlow(
  _prevState: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const parsed = readFlowFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { data: flow, error } = await supabase
    .from("dm_flows")
    .insert({
      instagram_account_id: parsed.fields.instagram_account_id,
      name: parsed.fields.name,
      trigger_keyword: parsed.fields.trigger_keyword,
      instagram_media_id: parsed.fields.instagram_media_id,
      send_public_reply: parsed.fields.send_public_reply,
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
  redirect("/dashboard/flows?created=1");
}

export async function updateFlow(
  id: string,
  _prevState: FlowFormState,
  formData: FormData
): Promise<FlowFormState> {
  const parsed = readFlowFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("dm_flows")
    .update({
      instagram_account_id: parsed.fields.instagram_account_id,
      name: parsed.fields.name,
      trigger_keyword: parsed.fields.trigger_keyword,
      instagram_media_id: parsed.fields.instagram_media_id,
      send_public_reply: parsed.fields.send_public_reply,
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
