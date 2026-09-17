"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RuleFormState = { error: string } | undefined;

interface RuleFields {
  instagram_account_id: string;
  name: string;
  keyword: string;
  instagram_media_id: string | null;
  dm_message: string;
  require_follow: boolean;
  follow_prompt_message: string | null;
}

function readRuleFields(
  formData: FormData
): { ok: true; fields: RuleFields } | { ok: false; error: string } {
  const instagramAccountId = String(formData.get("instagram_account_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const keyword = String(formData.get("keyword") ?? "").trim();
  const instagramMediaIdRaw = String(formData.get("instagram_media_id") ?? "").trim();
  const dmMessage = String(formData.get("dm_message") ?? "").trim();
  const requireFollow = formData.get("require_follow") === "on";
  const followPromptMessage = String(formData.get("follow_prompt_message") ?? "").trim();

  if (!instagramAccountId || !name || !keyword || !dmMessage) {
    return {
      ok: false,
      error: "Account, name, keyword, and DM message are required.",
    };
  }

  if (requireFollow && !followPromptMessage) {
    return {
      ok: false,
      error: "Follow-prompt message is required when 'Require follow' is on.",
    };
  }

  return {
    ok: true,
    fields: {
      instagram_account_id: instagramAccountId,
      name,
      keyword,
      instagram_media_id: instagramMediaIdRaw || null,
      dm_message: dmMessage,
      require_follow: requireFollow,
      follow_prompt_message: requireFollow ? followPromptMessage : null,
    },
  };
}

export async function createRule(
  _prevState: RuleFormState,
  formData: FormData
): Promise<RuleFormState> {
  const parsed = readRuleFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("automation_rules").insert({
    ...parsed.fields,
    trigger_type: "comment_keyword",
    is_active: true,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/rules");
  redirect("/dashboard/rules");
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

  revalidatePath("/dashboard/rules");
  redirect("/dashboard/rules");
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
      "instagram_account_id, name, trigger_type, keyword, instagram_media_id, dm_message, require_follow, follow_prompt_message"
    )
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }
  if (!rule) {
    throw new Error("Rule not found.");
  }

  const { error } = await supabase.from("automation_rules").insert({
    ...rule,
    name: `${rule.name} (copy)`,
    is_active: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/rules");
}
