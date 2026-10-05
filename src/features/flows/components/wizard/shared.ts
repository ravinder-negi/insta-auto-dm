import type { FlowStepInput } from "@/features/flows/actions";

export const MESSAGE_MAX_LENGTH = 1000;

export const DEFAULT_PUBLIC_REPLY_MESSAGE = "Got it! Check your inbox 📩";

export const ATTACHMENT_TYPES = [
  { value: "image", label: "Image" },
  // { value: "video", label: "Video" },
  // { value: "audio", label: "Audio" },
] as const;

export interface FlowWizardAccountOption {
  id: string;
  label: string;
  handle: string;
}

/** "specific" targets one post, "any" every post of the account. */
export type MediaScope = "specific" | "any";

export function emptyStep(): FlowStepInput {
  return {
    step_order: 0,
    message_text: "",
    expects_reply: false,
    collects_email: false,
    intent_map: {},
    options: [],
    attachment_url: null,
    attachment_type: null,
    followup_enabled: false,
    followup_delay_hours: null,
    followup_message: null,
  };
}

export function attachmentFileName(url: string) {
  try {
    const name = new URL(url).pathname.split("/").pop();
    return name ? decodeURIComponent(name) : "attachment";
  } catch {
    return "attachment";
  }
}
