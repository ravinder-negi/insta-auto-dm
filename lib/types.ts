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
