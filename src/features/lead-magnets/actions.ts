"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isHttpUrl } from "@/lib/validation/fields";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LeadMagnetFormInitialValues } from "@/features/lead-magnets/components/LeadMagnetForm";

export type LeadMagnetFormState = { error: string } | { ok: true } | undefined;


interface LeadMagnetFields {
  title: string;
  description: string | null;
  file_url: string;
  file_name: string | null;
  is_active: boolean;
}

function readLeadMagnetFields(
  formData: FormData
): { ok: true; fields: LeadMagnetFields } | { ok: false; error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const fileUrl = String(formData.get("file_url") ?? "").trim();
  const fileName = String(formData.get("file_name") ?? "").trim();

  if (!title) {
    return { ok: false, error: "Title is required." };
  }

  if (!isHttpUrl(fileUrl)) {
    return { ok: false, error: "Upload a file before saving." };
  }

  return {
    ok: true,
    fields: {
      title,
      description: description || null,
      file_url: fileUrl,
      file_name: fileName || null,
      is_active: formData.get("is_active") === "on",
    },
  };
}

async function createLeadMagnetCore(formData: FormData): Promise<LeadMagnetFormState> {
  const parsed = readLeadMagnetFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: last } = await supabase
    .from("lead_magnets")
    .select("position")
    .eq("profile_id", user.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("lead_magnets").insert({
    profile_id: user.id,
    title: parsed.fields.title,
    description: parsed.fields.description,
    file_url: parsed.fields.file_url,
    file_name: parsed.fields.file_name,
    is_active: parsed.fields.is_active,
    position: (last?.position ?? 0) + 1,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/lead-magnets");
  return { ok: true };
}

/** Used by the "Add lead magnet" modal — reports success back so the modal
 *  can close itself instead of navigating away. */
export async function createLeadMagnet(
  _prevState: LeadMagnetFormState,
  formData: FormData
): Promise<LeadMagnetFormState> {
  return createLeadMagnetCore(formData);
}

async function updateLeadMagnetCore(id: string, formData: FormData): Promise<LeadMagnetFormState> {
  const parsed = readLeadMagnetFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lead_magnets")
    .update({
      title: parsed.fields.title,
      description: parsed.fields.description,
      file_url: parsed.fields.file_url,
      file_name: parsed.fields.file_name,
      is_active: parsed.fields.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/lead-magnets");
  return { ok: true };
}

/** Used by the edit modal — reports success back instead of navigating away. */
export async function updateLeadMagnet(
  id: string,
  _prevState: LeadMagnetFormState,
  formData: FormData
): Promise<LeadMagnetFormState> {
  return updateLeadMagnetCore(id, formData);
}

export async function deleteLeadMagnet(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lead_magnets").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/lead-magnets");
}

export async function deleteLeadMagnets(ids: string[]) {
  if (ids.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.from("lead_magnets").delete().in("id", ids);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/lead-magnets");
}

export async function toggleLeadMagnetActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead_magnets")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/lead-magnets");
}

/** Persists a full drag-and-drop reorder: `orderedIds` is the new top-to-bottom order. */
export async function reorderLeadMagnets(orderedIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const updates = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("lead_magnets")
        .update({ position: index })
        .eq("id", id)
        .eq("profile_id", user.id)
    )
  );

  const failed = updates.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);

  revalidatePath("/dashboard/lead-magnets");
}

export interface LeadMagnetFormData {
  userId: string;
  initialValues?: LeadMagnetFormInitialValues;
}

/** Fetches the lead magnet's own data when editing — the modal isn't backed
 *  by a server-rendered page, so it fetches on mount instead. */
export async function getLeadMagnetFormData(
  id?: string
): Promise<LeadMagnetFormData | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (!id) {
    return { userId: user.id };
  }

  // file_url isn't readable through the user's own client (see the
  // lead_magnets column grants), so read it with the service role, scoped to
  // the owner.
  const { data: magnet } = await createAdminClient()
    .from("lead_magnets")
    .select("title, description, file_url, file_name, is_active")
    .eq("id", id)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!magnet) {
    return { error: "Lead magnet not found." };
  }

  return {
    userId: user.id,
    initialValues: {
      title: magnet.title,
      description: magnet.description,
      file_url: magnet.file_url,
      file_name: magnet.file_name,
      is_active: magnet.is_active,
    },
  };
}
