export const DM_MAX_LENGTH = 1000;

export const DEFAULT_FOLLOW_PROMPT_MESSAGE =
  "Thanks for your comment! Follow {profile_link} first, then comment again and I'll send your link 🙌";

export const PUBLIC_REPLY_MAX_LENGTH = 140;

/** Auto-reply slots shown on the keyword step; one filled slot is enough. */
export const PUBLIC_REPLY_SLOTS = 3;

export const MAX_KEYWORDS = 20;

export const MAX_BUTTONS = 3;
export const BUTTON_LABEL_MAX_LENGTH = 60;
export const CARD_TITLE_MAX_LENGTH = 80;

/** Instagram renders link buttons as a card, which needs a title of its own;
 *  the DM text is sent as a separate message right before it. */
export const DEFAULT_CARD_TITLE = "Tap the button below 👇";
export const MAX_FOLLOWUPS = 3;

export const DEFAULT_DM_MESSAGE =
  "Hey there! Thanks for commenting 🙌 Here's the link I mentioned ⬇️";

export const DEFAULT_EMAIL_PROMPT_MESSAGE =
  "Almost there! Reply with your email address and I'll send it right over 📩";

/** Units offered for the pre-send delay and for follow-up timing. */
export const DELAY_UNITS = [
  { value: "second", label: "Second", seconds: 1 },
  { value: "minute", label: "Minute", seconds: 60 },
] as const;

export const FOLLOWUP_UNITS = [
  { value: "minute", label: "Minutes", minutes: 1 },
  { value: "hour", label: "Hours", minutes: 60 },
  { value: "day", label: "Days", minutes: 1440 },
] as const;

export type DelayUnit = (typeof DELAY_UNITS)[number]["value"];
export type FollowupUnit = (typeof FOLLOWUP_UNITS)[number]["value"];

export interface RuleButtonValue {
  label: string;
  url: string;
}

export interface RuleFollowupValue {
  delay_value: string;
  delay_unit: FollowupUnit;
  message: string;
}

/** Splits stored minutes back into the largest whole unit, so a saved 120
 *  comes back as "2 Hours" rather than "120 Minutes". */
export function followupFromMinutes(minutes: number): RuleFollowupValue {
  for (const unit of [...FOLLOWUP_UNITS].reverse()) {
    if (minutes % unit.minutes === 0 && minutes >= unit.minutes) {
      return {
        delay_value: String(minutes / unit.minutes),
        delay_unit: unit.value,
        message: "",
      };
    }
  }

  return { delay_value: String(minutes), delay_unit: "minute", message: "" };
}

export function followupToMinutes(followup: RuleFollowupValue) {
  const unit = FOLLOWUP_UNITS.find((item) => item.value === followup.delay_unit);
  const value = Number(followup.delay_value);

  if (!Number.isFinite(value) || value <= 0) return 0;

  return Math.round(value * (unit?.minutes ?? 1));
}

/** The shortest delay the form allows; a rule always waits before its first
 *  DM, so a stored 0 (or a new rule) comes back as the default below. */
export const MIN_DELAY_SECONDS = 1;
export const DEFAULT_DELAY_SECONDS = 5;

/** Same idea for the pre-send delay, which is stored in seconds. */
export function delayFromSeconds(seconds: number): {
  value: string;
  unit: DelayUnit;
} {
  const effective = seconds >= MIN_DELAY_SECONDS ? seconds : DEFAULT_DELAY_SECONDS;

  if (effective % 60 === 0) {
    return { value: String(effective / 60), unit: "minute" };
  }

  return { value: String(effective), unit: "second" };
}

export function delayToSeconds(value: string, unit: DelayUnit) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 1) return 0;

  return Math.round(amount * (unit === "minute" ? 60 : 1));
}

export const DEFAULT_PUBLIC_REPLY_MESSAGES = [
  "Thanks! Please see DMs.",
  "Sent you a message! Check it out!",
  "Nice! Check your DMs!",
];

export interface RuleWizardAccountOption {
  id: string;
  label: string;
  handle: string;
}

export interface InstagramMediaOption {
  id: string;
  caption: string | null;
  media_type: string;
  thumbnail_url: string | null;
  permalink: string | null;
  timestamp: string;
}

/** "specific" targets one post, "any" every post of the account. */
export type MediaScope = "specific" | "any";

/** "specific" fires on the listed keywords, "any" on every comment. */
export type KeywordMatch = "specific" | "any";

/** "comment_keyword" matches comments on a post/reel; "story_reply" matches
 *  a DM reply to a story; "live_comment" matches a comment on a Live. */
export type TriggerType = "comment_keyword" | "story_reply" | "live_comment";

export interface RuleWizardValues {
  instagram_account_id: string;
  name: string;
  trigger_type: TriggerType;
  media_scope: MediaScope;
  instagram_media_id: string;
  keyword_match: KeywordMatch;
  keywords: string[];
  excluded_keywords: string[];
  dm_message: string;
  require_follow: boolean;
  follow_prompt_message: string;
  send_public_reply: boolean;
  /** One entry per filled auto-reply slot; one is picked at random per comment. */
  public_reply_messages: string[];
  collect_email: boolean;
  email_prompt_message: string;
  send_delay_value: string;
  send_delay_unit: DelayUnit;
  dm_buttons: RuleButtonValue[];
  dm_button_card_title: string;
  followups: RuleFollowupValue[];
  attachment_url: string;
  attachment_type: string;
}

/** Setter handed to each step so a step only names the fields it edits. */
export type UpdateValue = <K extends keyof RuleWizardValues>(
  key: K,
  value: RuleWizardValues[K]
) => void;
