"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LeadMagnetFormInitialValues } from "@/features/lead-magnets/components/LeadMagnetForm";

export type LeadMagnetFormState = { error: string } | { ok: true } | undefined;

const URL_PATTERN = /^https?:\/\/\S+$/;

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

  if (!URL_PATTERN.test(fileUrl)) {
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

/** Used by the standalone /dashboard/lead-magnets/new page. */
export async function createLeadMagnetAndRedirect(
  _prevState: LeadMagnetFormState,
  formData: FormData
): Promise<LeadMagnetFormState> {
  const result = await createLeadMagnetCore(formData);
  if (result && "error" in result) return result;
  redirect("/dashboard/lead-magnets?created=1");
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

/** Used by the standalone /dashboard/lead-magnets/[id]/edit page. */
export async function updateLeadMagnetAndRedirect(
  id: string,
  _prevState: LeadMagnetFormState,
  formData: FormData
): Promise<LeadMagnetFormState> {
  const result = await updateLeadMagnetCore(id, formData);
  if (result && "error" in result) return result;
  redirect("/dashboard/lead-magnets?updated=1");
}

export async function deleteLeadMagnet(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lead_magnets").delete().eq("id", id);

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

export async function moveLeadMagnet(id: string, direction: "up" | "down") {
  const supabase = await createClient();

  const { data: current, error: currentError } = await supabase
    .from("lead_magnets")
    .select("id, profile_id, position")
    .eq("id", id)
    .single();

  if (currentError || !current) {
    throw new Error(currentError?.message ?? "Lead magnet not found.");
  }

  let neighborQuery = supabase
    .from("lead_magnets")
    .select("id, position")
    .eq("profile_id", current.profile_id);

  neighborQuery =
    direction === "up"
      ? neighborQuery.lt("position", current.position).order("position", { ascending: false })
      : neighborQuery.gt("position", current.position).order("position", { ascending: true });

  const { data: neighbor, error: neighborError } = await neighborQuery
    .limit(1)
    .maybeSingle();

  if (neighborError) throw new Error(neighborError.message);
  if (!neighbor) return;

  const [{ error: errorA }, { error: errorB }] = await Promise.all([
    supabase
      .from("lead_magnets")
      .update({ position: neighbor.position })
      .eq("id", current.id),
    supabase
      .from("lead_magnets")
      .update({ position: current.position })
      .eq("id", neighbor.id),
  ]);

  if (errorA || errorB) {
    throw new Error(errorA?.message ?? errorB?.message ?? "Failed to reorder.");
  }

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

  const { data: magnet } = await supabase
    .from("lead_magnets")
    .select("title, description, file_url, file_name, is_active")
    .eq("id", id)
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
