"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LinkIconKey, LinkType } from "@/lib/types";

export type LinkFormState = { error: string } | undefined;

const LINK_TYPES: LinkType[] = ["website", "youtube", "blog", "product", "custom"];
const ICON_KEYS: LinkIconKey[] = ["link", "youtube", "instagram", "globe", "mail", "custom"];
const URL_PATTERN = /^https?:\/\/\S+$/;

interface LinkFields {
  title: string;
  subtitle: string | null;
  url: string;
  link_type: LinkType;
  icon: LinkIconKey | null;
  custom_icon_url: string | null;
  is_active: boolean;
  is_featured: boolean;
}

function readLinkFields(
  formData: FormData
): { ok: true; fields: LinkFields } | { ok: false; error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const linkTypeRaw = String(formData.get("link_type") ?? "custom");
  const iconRaw = String(formData.get("icon") ?? "");
  const customIconUrl = String(formData.get("custom_icon_url") ?? "").trim();

  if (!title) {
    return { ok: false, error: "Title is required." };
  }

  if (!URL_PATTERN.test(url)) {
    return { ok: false, error: "URL must be a valid http:// or https:// link." };
  }

  const linkType = LINK_TYPES.includes(linkTypeRaw as LinkType)
    ? (linkTypeRaw as LinkType)
    : "custom";

  const icon = ICON_KEYS.includes(iconRaw as LinkIconKey) ? (iconRaw as LinkIconKey) : null;

  return {
    ok: true,
    fields: {
      title,
      subtitle: subtitle || null,
      url,
      link_type: linkType,
      icon,
      custom_icon_url: icon === "custom" && customIconUrl ? customIconUrl : null,
      is_active: formData.get("is_active") === "on",
      is_featured: formData.get("is_featured") === "on",
    },
  };
}

export async function createLink(
  _prevState: LinkFormState,
  formData: FormData
): Promise<LinkFormState> {
  const parsed = readLinkFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: last } = await supabase
    .from("profile_links")
    .select("position")
    .eq("profile_id", user.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("profile_links").insert({
    profile_id: user.id,
    title: parsed.fields.title,
    subtitle: parsed.fields.subtitle,
    url: parsed.fields.url,
    link_type: parsed.fields.link_type,
    icon: parsed.fields.icon,
    custom_icon_url: parsed.fields.custom_icon_url,
    is_active: parsed.fields.is_active,
    is_featured: parsed.fields.is_featured,
    position: (last?.position ?? 0) + 1,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/links");
  redirect("/dashboard/links?created=1");
}

export async function updateLink(
  id: string,
  _prevState: LinkFormState,
  formData: FormData
): Promise<LinkFormState> {
  const parsed = readLinkFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_links")
    .update({
      title: parsed.fields.title,
      subtitle: parsed.fields.subtitle,
      url: parsed.fields.url,
      link_type: parsed.fields.link_type,
      icon: parsed.fields.icon,
      custom_icon_url: parsed.fields.custom_icon_url,
      is_active: parsed.fields.is_active,
      is_featured: parsed.fields.is_featured,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/links");
  redirect("/dashboard/links?updated=1");
}

export async function deleteLink(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("profile_links").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/links");
}

export async function toggleLinkActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_links")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/links");
}

/** Persists a full drag-and-drop reorder: `orderedIds` is the new top-to-bottom order. */
export async function reorderLinks(orderedIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const updates = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("profile_links")
        .update({ position: index })
        .eq("id", id)
        .eq("profile_id", user.id)
    )
  );

  const failed = updates.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);

  revalidatePath("/dashboard/links");
}

export async function moveLink(id: string, direction: "up" | "down") {
  const supabase = await createClient();

  const { data: current, error: currentError } = await supabase
    .from("profile_links")
    .select("id, profile_id, position")
    .eq("id", id)
    .single();

  if (currentError || !current) {
    throw new Error(currentError?.message ?? "Link not found.");
  }

  let neighborQuery = supabase
    .from("profile_links")
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
      .from("profile_links")
      .update({ position: neighbor.position })
      .eq("id", current.id),
    supabase
      .from("profile_links")
      .update({ position: current.position })
      .eq("id", neighbor.id),
  ]);

  if (errorA || errorB) {
    throw new Error(errorA?.message ?? errorB?.message ?? "Failed to reorder.");
  }

  revalidatePath("/dashboard/links");
}
