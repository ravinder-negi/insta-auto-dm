"use server";

import { createClient } from "@/lib/supabase/server";

export type ContactMessageState = { error: string } | { success: true } | undefined;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactMessage(
  _prevState: ContactMessageState,
  formData: FormData
): Promise<ContactMessageState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name) {
    return { error: "Enter your name." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (!phone) {
    return { error: "Enter your phone number." };
  }
  if (!message) {
    return { error: "Tell us a bit about what you need." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_messages")
    .insert({ name, email, phone, message });

  if (error) {
    return { error: "Something went wrong. Try again." };
  }

  return { success: true };
}
