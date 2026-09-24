export type AttachmentType = "image" | "video" | "audio";

export interface InstagramAccount {
  id: string;
  profile_id: string | null;
  instagram_user_id: string;
  username: string | null;
  access_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationRule {
  id: string;
  instagram_account_id: string;
  name: string;
  trigger_type: string;
  keyword: string;
  instagram_media_id: string | null;
  dm_message: string;
  require_follow: boolean;
  follow_prompt_message: string | null;
  send_public_reply: boolean;
  public_reply_message: string | null;
  attachment_url: string | null;
  attachment_type: AttachmentType | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ExecutionStatus =
  | "processing"
  | "sent"
  | "failed"
  | "follow_prompt_sent"
  | "skipped_already_prompted";

export interface AutomationExecution {
  id: string;
  automation_rule_id: string;
  instagram_account_id: string;
  instagram_comment_id: string;
  commenter_instagram_id: string | null;
  commenter_username: string | null;
  instagram_media_id: string | null;
  comment_text: string | null;
  status: ExecutionStatus;
  dm_message: string | null;
  instagram_message_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DmFlow {
  id: string;
  instagram_account_id: string;
  name: string;
  trigger_keyword: string;
  instagram_media_id: string | null;
  send_public_reply: boolean;
  public_reply_message: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** intent_map keys are "yes" | "no" | "default"; value is a target step_order, or absent to end the flow. */
export type DmFlowIntentMap = Partial<Record<"yes" | "no" | "default", number>>;

export interface DmFlowStep {
  id: string;
  flow_id: string;
  step_order: number;
  message_text: string;
  expects_reply: boolean;
  intent_map: DmFlowIntentMap;
  collects_email: boolean;
  attachment_url: string | null;
  attachment_type: AttachmentType | null;
  followup_enabled: boolean;
  followup_delay_hours: number | null;
  followup_message: string | null;
  created_at: string;
}

export interface DmFlowLead {
  id: string;
  flow_id: string;
  instagram_account_id: string;
  ig_sender_id: string;
  email: string;
  collected_at: string;
}

export type DmFlowSessionStatus = "active" | "completed" | "expired";

export interface DmFlowSession {
  id: string;
  flow_id: string;
  instagram_account_id: string;
  ig_sender_id: string;
  current_step_order: number;
  status: DmFlowSessionStatus;
  trigger_comment_id: string | null;
  followup_sent_at: string | null;
  started_at: string;
  last_interaction_at: string;
}

/** Singleton row mirroring Meta's `x-app-usage` header (already 0-100 percentages). */
export interface ApiUsage {
  id: number;
  call_count: number | null;
  total_cputime: number | null;
  total_time: number | null;
  updated_at: string;
}

export type ThemeFont = "sans" | "serif" | "mono";
export type ThemeButtonStyle = "pill" | "rounded" | "square";
export type ThemeLayout = "center" | "left";

/** Link-in-bio creator profile — 1:1 with auth.users via profiles.id. */
export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  brand_color: string | null;
  is_published: boolean;
  theme_font: ThemeFont;
  theme_button_style: ThemeButtonStyle;
  theme_layout: ThemeLayout;
  created_at: string;
  updated_at: string;
}

export type LinkType = "website" | "youtube" | "blog" | "product" | "custom";

/** Display icon for a profile link, independent of its `link_type` category. */
export type LinkIconKey = "link" | "youtube" | "instagram" | "globe" | "mail" | "custom";

/** A single URL in a creator's link-in-bio list. */
export interface ProfileLink {
  id: string;
  profile_id: string;
  title: string;
  subtitle: string | null;
  url: string;
  link_type: LinkType;
  icon: LinkIconKey | null;
  custom_icon_url: string | null;
  is_featured: boolean;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SocialPlatform =
  | "instagram"
  | "youtube"
  | "facebook"
  | "x"
  | "tiktok"
  | "linkedin"
  | "email";

/** A creator's connected profile on an external platform. */
export interface ProfileSocial {
  id: string;
  profile_id: string;
  platform: SocialPlatform;
  url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** A free downloadable resource offered in exchange for a visitor's email. */
export interface LeadMagnet {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** A visitor email captured for a lead magnet. */
export interface LeadMagnetLead {
  id: string;
  lead_magnet_id: string;
  profile_id: string;
  email: string;
  created_at: string;
}

/** A catalog card on a creator's public profile — display only in Phase 2:
 *  no payment, checkout, or orders. `product_url` is an external destination
 *  (e.g. Gumroad); `price`/`currency` are informational. */
export interface Product {
  id: string;
  profile_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
  price: number | null;
  currency: string;
  is_featured: boolean;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

/** Single-row app-wide config, admin-only write (see lib/admin.ts). */
export interface AppSettings {
  id: number;
  accent_color: string;
  updated_at: string;
}
