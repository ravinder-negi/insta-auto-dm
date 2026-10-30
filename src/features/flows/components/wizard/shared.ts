import type { FlowStepInput } from "@/features/flows/actions";
import type { KeywordMatch } from "@/types";

export type { KeywordMatch };

export const MESSAGE_MAX_LENGTH = 1000;

export const DEFAULT_PUBLIC_REPLY_MESSAGE = "Got it! Check your inbox 📩";

export const DEFAULT_PUBLIC_REPLY_MESSAGES = [
  "Got it! Check your inbox 📩",
  "Sent you a message! Check it out!",
  "Nice! Check your DMs!",
];

export const MAX_KEYWORDS = 20;
export const PUBLIC_REPLY_SLOTS = 3;
export const PUBLIC_REPLY_MAX_LENGTH = 140;

export const ATTACHMENT_TYPES = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "file", label: "File (PDF)" },
] as const;

/** Instagram's own per-type caps — shown as a hint only; attachments are
 *  linked by URL here, not uploaded, so size isn't checked client-side. */
export const ATTACHMENT_SIZE_LIMITS: Record<
  (typeof ATTACHMENT_TYPES)[number]["value"],
  string
> = {
  image: "png or jpeg, up to 8MB",
  video: "mp4, ogg, avi, mov or webm, up to 25MB",
  audio: "aac, m4a, wav or mp4, up to 25MB",
  file: "pdf, up to 25MB",
};

export const MAX_BUTTONS = 3;
// Meta's URL-button title cap is 20 chars — a longer label risks truncation
// or rejection by Instagram's generic-template API.
export const BUTTON_LABEL_MAX_LENGTH = 20;
export const CARD_TITLE_MAX_LENGTH = 80;

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
    buttons: [],
    button_card_title: "",
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
