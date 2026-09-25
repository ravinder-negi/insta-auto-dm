import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

const SUPABASE_SECRET_KEYS = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!
);

const SUPABASE_SECRET_KEY = SUPABASE_SECRET_KEYS["default"];

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

const VERIFY_TOKEN = Deno.env.get("INSTAGRAM_VERIFY_TOKEN")!;
const META_APP_SECRET = Deno.env.get("META_APP_SECRET")!;

const INSTAGRAM_API_VERSION =
  Deno.env.get("INSTAGRAM_API_VERSION") || "v26.0";
const INSTAGRAM_GRAPH_BASE_URL =
  Deno.env.get("INSTAGRAM_GRAPH_BASE_URL") || "https://graph.instagram.com";
const INSTAGRAM_AUTHORIZE_BASE_URL =
  Deno.env.get("INSTAGRAM_AUTHORIZE_BASE_URL") || "https://www.instagram.com";

interface InstagramWebhookPayload {
  object?: string;

  entry?: Array<{
    id?: string;
    time?: number;

    changes?: Array<{
      field?: string;

      value?: {
        from?: {
          id?: string;
          username?: string;
        };

        media?: {
          id?: string;
          media_product_type?: string;
        };

        id?: string;
        parent_id?: string | null;
        text?: string;
      };
    }>;

    // Instagram Messaging events (DM replies) arrive here, not in `changes`.
    messaging?: Array<{
      sender?: { id?: string };
      recipient?: { id?: string };
      timestamp?: number;

      message?: {
        mid?: string;
        text?: string;
        is_echo?: boolean;
      };
    }>;
  }>;
}

type AttachmentType = "image" | "video" | "audio";

interface AutomationRule {
  id: string;
  keyword: string;
  instagram_media_id: string | null;
  dm_message: string;
  require_follow: boolean;
  follow_prompt_message: string | null;
  send_public_reply: boolean;
  public_reply_message: string | null;
  attachment_url: string | null;
  attachment_type: AttachmentType | null;
}

interface DmFlow {
  id: string;
  trigger_keyword: string;
  instagram_media_id: string | null;
  send_public_reply: boolean;
  public_reply_message: string | null;
}

interface DmFlowStepOption {
  label: string;
  target_step_order: number | null;
}

interface DmFlowStep {
  id: string;
  flow_id: string;
  step_order: number;
  message_text: string;
  expects_reply: boolean;
  intent_map: Partial<Record<"yes" | "no" | "default", number>>;
  collects_email: boolean;
  options: DmFlowStepOption[];
  attachment_url: string | null;
  attachment_type: AttachmentType | null;
}

interface DmFlowSession {
  id: string;
  flow_id: string;
  current_step_order: number;
}

// Static intent buckets for MVP flow branching — no per-flow customization
// or NLP, just a normalized-text lookup against two small word lists.
const YES_WORDS = new Set([
  "yes", "yeah", "yep", "yup", "sure", "ok", "okay", "k", "y",
  "definitely", "absolutely", "please", "of course",
]);
const NO_WORDS = new Set([
  "no", "nope", "nah", "n", "not now", "never", "no thanks",
]);

function matchIntent(text: string): "yes" | "no" | "default" {
  const normalized = text.trim().toLowerCase();
  if (YES_WORDS.has(normalized)) return "yes";
  if (NO_WORDS.has(normalized)) return "no";
  return "default";
}

// Matches a numbered-options reply by 1-based position ("2", "2️⃣") or by
// label text (case-insensitive). Returns undefined when nothing matches, so
// the caller can reprompt instead of silently ending the flow.
function matchOption(
  text: string,
  options: DmFlowStepOption[]
): DmFlowStepOption | undefined {
  const normalized = text.trim().toLowerCase();
  const numeric = normalized.match(/^\d+/)?.[0];

  if (numeric) {
    const index = Number(numeric) - 1;
    if (index >= 0 && index < options.length) return options[index];
  }

  const exact = options.find((option) => option.label.trim().toLowerCase() === normalized);
  if (exact) return exact;

  if (normalized.length < 2) return undefined;
  return options.find((option) => option.label.trim().toLowerCase().includes(normalized));
}

function optionRetryMessage(options: DmFlowStepOption[]) {
  const range = options.length === 1 ? "1" : `1-${options.length}`;
  return `Sorry, didn't catch that — reply with ${range} to pick an option.`;
}

// Appends the numbered list a step's options describe, since the reply text
// typed in the flow builder never includes it — the list is generated here
// so it's always in sync with what matchOption() actually matches against.
function withOptionsList(messageText: string, options: DmFlowStepOption[]) {
  if (options.length === 0) return messageText;
  const list = options.map((option, i) => `${i + 1}. ${option.label}`).join("\n");
  return `${messageText}\n\n${list}`;
}

// Deliberately permissive (no lookahead/backtracking risk): local@domain.tld.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_RETRY_MESSAGE =
  "That doesn't look like a valid email — reply with your email address to continue.";

// Common TLDs only — not the full IANA list, and no live DNS/MX lookup (extra
// latency and failure surface for an edge function). Good enough to reject
// junk like "ravi@asdd.css" without false-rejecting real addresses.
const ALLOWED_TLDS = new Set([
  "com", "net", "org", "info", "biz", "name", "pro", "io", "co", "ai",
  "dev", "app", "xyz", "online", "site", "tech", "store", "cloud", "me",
  "tv", "cc", "edu", "gov", "mil",
  "in", "us", "uk", "ca", "au", "de", "fr", "jp", "cn", "br", "ru",
  "za", "nl", "es", "it", "mx", "sg", "ae", "sa", "ng", "id", "pk",
  "bd", "np", "lk", "ph", "my", "th", "vn", "kr", "tw", "hk", "nz",
  "ie", "se", "no", "dk", "fi", "pl", "pt", "gr", "tr", "il", "eg",
  "ke", "ch", "at", "be", "cz", "hu", "ro", "bg", "sk", "ua",
]);

function hasAllowedTld(email: string): boolean {
  const domain = email.split("@")[1] ?? "";
  const tld = domain.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_TLDS.has(tld);
}

Deno.serve(async (req) => {
  try {
    /**
     * ==========================================
     * META WEBHOOK VERIFICATION (GET)
     * ==========================================
     */

    if (req.method === "GET") {
      const url = new URL(req.url);

      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
        return new Response(challenge, { status: 200 });
      }

      return new Response("Forbidden", { status: 403 });
    }

    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    /**
     * ==========================================
     * VERIFY META SIGNATURE (must run on the raw
     * body, before JSON.parse)
     * ==========================================
     */

    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-hub-signature-256");

    if (!(await verifyMetaSignature(rawBody, signatureHeader))) {
      console.error("Invalid X-Hub-Signature-256, rejecting request");
      return new Response("Forbidden", { status: 403 });
    }

    let payload: InstagramWebhookPayload;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error("Malformed JSON payload");
      return new Response("Bad Request", { status: 400 });
    }

    if (payload.object !== "instagram") {
      return new Response("Ignored", { status: 200 });
    }

    for (const entry of payload.entry ?? []) {
      const instagramAccountId = entry?.id;

      for (const change of entry?.changes ?? []) {
        if (change?.field !== "comments") {
          continue;
        }

        await handleCommentChange(instagramAccountId, change.value, payload);
      }

      for (const messagingEvent of entry?.messaging ?? []) {
        await handleMessagingEvent(instagramAccountId, messagingEvent);
      }
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("Instagram webhook error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

type CommentValue = NonNullable<
  NonNullable<
    NonNullable<InstagramWebhookPayload["entry"]>[number]["changes"]
  >[number]["value"]
>;

async function handleCommentChange(
  instagramAccountId: string | undefined,
  comment: CommentValue | undefined,
  fullPayload: InstagramWebhookPayload
) {
  const commentId = comment?.id;
  const commentText = comment?.text?.trim() ?? "";
  const commenterId = comment?.from?.id;
  const commenterUsername = comment?.from?.username;
  const mediaId = comment?.media?.id;
  const parentCommentId = comment?.parent_id ?? null;

  /**
   * ======================================
   * FIND INSTAGRAM ACCOUNT
   * (resolved first so webhook_events can store a proper FK)
   * ======================================
   */

  const instagramAccount = await resolveInstagramAccount(instagramAccountId);

  /**
   * ======================================
   * STORE RAW WEBHOOK EVENT
   * ======================================
   */

  const { error: webhookError } = await supabaseAdmin
    .from("webhook_events")
    .insert({
      event_type: "comments",
      instagram_account_id: instagramAccount?.id ?? null,
      payload: fullPayload,
    });

  if (webhookError) {
    console.error("Failed to store webhook event:", webhookError.message);
  }

  if (!commentId || !commenterId || !mediaId || !commentText) {
    console.log("Skipping incomplete comment payload");
    return;
  }

  if (parentCommentId) {
    console.log("Skipping nested comment/reply:", commentId);
    return;
  }

  if (!instagramAccount) {
    console.log("Instagram account not found:", instagramAccountId);
    return;
  }

  if (!instagramAccount.is_active) {
    console.log("Instagram account inactive:", instagramAccountId);
    return;
  }

  /**
   * ======================================
   * DUPLICATE PROTECTION (best-effort check;
   * the unique constraint on instagram_comment_id
   * is the real race-condition guard)
   * ======================================
   */

  const { data: existingExecution } = await supabaseAdmin
    .from("automation_executions")
    .select("id")
    .eq("instagram_comment_id", commentId)
    .maybeSingle();

  if (existingExecution) {
    console.log("Comment already processed:", commentId);
    return;
  }

  /**
   * ======================================
   * MATCH DM FLOW
   * Same account + (media match or account-wide) + exact keyword match
   * as automation_rules, checked first. A match starts a multi-step
   * session instead of sending a single static reply, and short-circuits
   * the single-rule matching below. trigger_comment_id is unique, so a
   * retried webhook delivery can't start the same flow twice even though
   * this path isn't covered by the automation_executions dedupe above.
   * ======================================
   */

  const { data: flows, error: flowsError } = await supabaseAdmin
    .from("dm_flows")
    .select(
      "id, trigger_keyword, instagram_media_id, send_public_reply, public_reply_message"
    )
    .eq("instagram_account_id", instagramAccount.id)
    .eq("is_active", true);

  if (flowsError) {
    console.error("Failed to load dm_flows:", flowsError.message);
  }

  const normalizedCommentForFlow = commentText.trim().toLowerCase();

  const matchedFlow = ((flows ?? []) as DmFlow[])
    .filter(
      (flow) => flow.instagram_media_id === mediaId || flow.instagram_media_id === null
    )
    .filter(
      (flow) => flow.trigger_keyword.trim().toLowerCase() === normalizedCommentForFlow
    )
    .sort((a, b) =>
      (a.instagram_media_id === null ? 1 : 0) - (b.instagram_media_id === null ? 1 : 0)
    )[0];

  if (matchedFlow) {
    console.log("DM flow matched:", matchedFlow.id);
    await startDmFlow({
      flow: matchedFlow,
      instagramAccount,
      commentId,
      senderId: commenterId,
    });
    return;
  }

  /**
   * ======================================
   * MATCH AUTOMATION RULE
   * account + (media match or account-wide) + exact,
   * case-insensitive, trimmed keyword. A rule scoped to
   * this specific media_id wins over an account-wide one.
   * ======================================
   */

  const { data: rules, error: rulesError } = await supabaseAdmin
    .from("automation_rules")
    .select(
      "id, keyword, instagram_media_id, dm_message, require_follow, follow_prompt_message, send_public_reply, public_reply_message, attachment_url, attachment_type"
    )
    .eq("instagram_account_id", instagramAccount.id)
    .eq("is_active", true);

  if (rulesError) {
    console.error("Failed to load automation_rules:", rulesError.message);
    return;
  }

  const normalizedComment = commentText.trim().toLowerCase();

  const matchedRule = ((rules ?? []) as AutomationRule[])
    .filter(
      (rule) =>
        rule.instagram_media_id === mediaId ||
        rule.instagram_media_id === null
    )
    .filter((rule) => rule.keyword.trim().toLowerCase() === normalizedComment)
    .sort((a, b) =>
      (a.instagram_media_id === null ? 1 : 0) -
      (b.instagram_media_id === null ? 1 : 0)
    )[0];

  if (!matchedRule) {
    console.log("No automation matched for media:", mediaId);
    return;
  }

  console.log("Automation matched:", matchedRule.id);

  /**
   * ======================================
   * PUBLIC COMMENT REPLY (optional)
   * Fires once on keyword match, independent of the follow gate below —
   * it acknowledges the comment publicly regardless of whether the real
   * DM or the follow prompt ends up being sent privately.
   * ======================================
   */

  if (matchedRule.send_public_reply && matchedRule.public_reply_message) {
    const publicReplyResult = await postPublicCommentReply({
      commentId,
      accessToken: instagramAccount.access_token,
      message: matchedRule.public_reply_message,
    });

    if (!publicReplyResult.success) {
      console.error("Public comment reply failed:", commentId, publicReplyResult.error);
    }
  }

  /**
   * ======================================
   * FOLLOW GATE
   * When require_follow is on, only send the real dm_message to
   * commenters already following the business account. A commenter
   * who isn't following gets follow_prompt_message once per rule
   * (tracked in automation_follow_prompts) instead of the real DM,
   * and is silently skipped on any further matching comment until
   * they follow and the check passes.
   * ======================================
   */

  let outgoingMessage = matchedRule.dm_message;

  if (matchedRule.require_follow) {
    const isFollowing = await checkUserFollowsBusiness(
      commenterId,
      instagramAccount.access_token
    );

    if (!isFollowing) {
      const { data: existingPrompt } = await supabaseAdmin
        .from("automation_follow_prompts")
        .select("id")
        .eq("automation_rule_id", matchedRule.id)
        .eq("commenter_instagram_id", commenterId)
        .maybeSingle();

      if (existingPrompt) {
        await supabaseAdmin.from("automation_executions").insert({
          automation_rule_id: matchedRule.id,
          instagram_account_id: instagramAccount.id,
          instagram_comment_id: commentId,
          commenter_instagram_id: commenterId,
          commenter_username: commenterUsername,
          instagram_media_id: mediaId,
          comment_text: commentText,
          status: "skipped_already_prompted",
        });
        console.log("Already prompted to follow, skipping:", commentId);
        return;
      }

      const profileLink = `${INSTAGRAM_AUTHORIZE_BASE_URL}/_u/${
        instagramAccount.username ?? instagramAccount.instagram_user_id
      }/`;
      outgoingMessage = (matchedRule.follow_prompt_message ?? "").replaceAll(
        "{profile_link}",
        profileLink
      );
    }
  }

  /**
   * ======================================
   * CREATE EXECUTION (status: processing)
   * unique(instagram_comment_id) protects against
   * concurrent duplicate webhook deliveries.
   * ======================================
   */

  const { error: executionInsertError } = await supabaseAdmin
    .from("automation_executions")
    .insert({
      automation_rule_id: matchedRule.id,
      instagram_account_id: instagramAccount.id,
      instagram_comment_id: commentId,
      commenter_instagram_id: commenterId,
      commenter_username: commenterUsername,
      instagram_media_id: mediaId,
      comment_text: commentText,
      status: "processing",
      dm_message: outgoingMessage,
    });

  if (executionInsertError) {
    if (executionInsertError.code === "23505") {
      console.log("Duplicate execution detected:", commentId);
      return;
    }

    console.error("Failed to create execution:", executionInsertError.message);
    return;
  }

  const isFollowPrompt = outgoingMessage !== matchedRule.dm_message;

  /**
   * ======================================
   * SEND PRIVATE REPLY
   * ======================================
   */

  const result = await sendRuleOrStepMessage({
    instagramUserId: instagramAccount.instagram_user_id,
    accessToken: instagramAccount.access_token,
    recipient: { comment_id: commentId },
    text: outgoingMessage,
    // Attachment belongs to the real dm_message, not the follow-gate nudge.
    attachmentUrl: isFollowPrompt ? null : matchedRule.attachment_url,
    attachmentType: isFollowPrompt ? null : matchedRule.attachment_type,
  });

  if (result.success) {
    await supabaseAdmin
      .from("automation_executions")
      .update({
        status: isFollowPrompt ? "follow_prompt_sent" : "sent",
        instagram_message_id: result.messageId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("instagram_comment_id", commentId);

    if (isFollowPrompt) {
      await supabaseAdmin.from("automation_follow_prompts").insert({
        automation_rule_id: matchedRule.id,
        commenter_instagram_id: commenterId,
      });
    }

    console.log("Private reply sent:", commentId);
  } else {
    await supabaseAdmin
      .from("automation_executions")
      .update({
        status: "failed",
        error_message: result.error,
        updated_at: new Date().toISOString(),
      })
      .eq("instagram_comment_id", commentId);

    console.error("Private reply failed for comment:", commentId, result.error);
  }
}

/**
 * ============================================
 * RESOLVE INSTAGRAM ACCOUNT
 * Shared by comment and messaging events: both identify the receiving
 * account by entry.id, which is the IG-scoped instagram_user_id.
 * ============================================
 */

async function resolveInstagramAccount(instagramAccountId: string | undefined): Promise<{
  id: string;
  instagram_user_id: string;
  username: string | null;
  access_token: string;
  is_active: boolean;
} | null> {
  if (!instagramAccountId) return null;

  const { data, error } = await supabaseAdmin
    .from("instagram_accounts")
    .select("id, instagram_user_id, username, access_token, is_active")
    .eq("instagram_user_id", instagramAccountId)
    .maybeSingle();

  if (error) {
    console.error("Failed to look up instagram_accounts:", error.message);
    return null;
  }

  return data;
}

/**
 * ============================================
 * START DM FLOW
 * Opens a session at step 1 and sends its message as a comment private
 * reply. trigger_comment_id is unique, so a duplicate webhook delivery
 * hits a 23505 here instead of starting the flow twice.
 * ============================================
 */

async function startDmFlow({
  flow,
  instagramAccount,
  commentId,
  senderId,
}: {
  flow: DmFlow;
  instagramAccount: { id: string; instagram_user_id: string; access_token: string };
  commentId: string;
  senderId: string;
}) {
  const { data: firstStep, error: stepError } = await supabaseAdmin
    .from("dm_flow_steps")
    .select(
      "id, flow_id, step_order, message_text, expects_reply, intent_map, collects_email, options, attachment_url, attachment_type"
    )
    .eq("flow_id", flow.id)
    .eq("step_order", 1)
    .maybeSingle();

  if (stepError || !firstStep) {
    console.error("DM flow has no step 1, skipping:", flow.id, stepError?.message);
    return;
  }

  const { error: sessionInsertError } = await supabaseAdmin
    .from("dm_flow_sessions")
    .insert({
      flow_id: flow.id,
      instagram_account_id: instagramAccount.id,
      ig_sender_id: senderId,
      current_step_order: 1,
      status: firstStep.expects_reply ? "active" : "completed",
      trigger_comment_id: commentId,
    });

  if (sessionInsertError) {
    if (sessionInsertError.code === "23505") {
      console.log("DM flow already started for this comment:", commentId);
      return;
    }
    console.error("Failed to create dm_flow_sessions row:", sessionInsertError.message);
    return;
  }

  if (flow.send_public_reply && flow.public_reply_message) {
    const publicReplyResult = await postPublicCommentReply({
      commentId,
      accessToken: instagramAccount.access_token,
      message: flow.public_reply_message,
    });

    if (!publicReplyResult.success) {
      console.error("Public comment reply failed:", flow.id, publicReplyResult.error);
    }
  }

  const result = await sendRuleOrStepMessage({
    instagramUserId: instagramAccount.instagram_user_id,
    accessToken: instagramAccount.access_token,
    recipient: { comment_id: commentId },
    text: withOptionsList(
      (firstStep as DmFlowStep).message_text,
      (firstStep as DmFlowStep).options ?? []
    ),
    attachmentUrl: (firstStep as DmFlowStep).attachment_url,
    attachmentType: (firstStep as DmFlowStep).attachment_type,
  });

  if (!result.success) {
    console.error("DM flow step 1 send failed:", flow.id, result.error);
  }
}

/**
 * ============================================
 * HANDLE MESSAGING EVENT (DM reply)
 * Advances an active dm_flow_sessions row when the inbound DM comes from
 * someone with an open session, matching their text against the current
 * step's intent_map. Anything else (no open session, echo of our own
 * sent message, a step not waiting for a reply) is ignored — this
 * webhook only drives flows, not general inbox handling.
 * ============================================
 */

async function handleMessagingEvent(
  instagramAccountId: string | undefined,
  event: NonNullable<
    NonNullable<InstagramWebhookPayload["entry"]>[number]["messaging"]
  >[number]
) {
  if (event.message?.is_echo) return;

  const senderId = event.sender?.id;
  const text = event.message?.text?.trim();

  if (!senderId || !text) return;

  const instagramAccount = await resolveInstagramAccount(instagramAccountId);
  if (!instagramAccount || !instagramAccount.is_active) return;

  const { data: session, error: sessionError } = await supabaseAdmin
    .from("dm_flow_sessions")
    .select("id, flow_id, current_step_order")
    .eq("instagram_account_id", instagramAccount.id)
    .eq("ig_sender_id", senderId)
    .eq("status", "active")
    .order("last_interaction_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError) {
    console.error("Failed to look up dm_flow_sessions:", sessionError.message);
    return;
  }
  if (!session) return;

  const typedSession = session as DmFlowSession;

  const { data: currentStep } = await supabaseAdmin
    .from("dm_flow_steps")
    .select("id, flow_id, step_order, message_text, expects_reply, intent_map, collects_email, options")
    .eq("flow_id", typedSession.flow_id)
    .eq("step_order", typedSession.current_step_order)
    .maybeSingle();

  if (!currentStep || !(currentStep as DmFlowStep).expects_reply) {
    await supabaseAdmin
      .from("dm_flow_sessions")
      .update({ status: "completed", last_interaction_at: new Date().toISOString() })
      .eq("id", typedSession.id);
    return;
  }

  const step = currentStep as DmFlowStep;
  const intentMap = step.intent_map ?? {};
  const options = step.options ?? [];

  let targetStepOrder: number | undefined;

  if (options.length > 0) {
    const matched = matchOption(text, options);

    if (!matched) {
      const retryResult = await sendInstagramMessage({
        instagramUserId: instagramAccount.instagram_user_id,
        accessToken: instagramAccount.access_token,
        recipient: { id: senderId },
        message: optionRetryMessage(options),
      });

      if (!retryResult.success) {
        console.error(
          "Option retry prompt send failed:",
          typedSession.flow_id,
          retryResult.error
        );
      }

      await supabaseAdmin
        .from("dm_flow_sessions")
        .update({ last_interaction_at: new Date().toISOString() })
        .eq("id", typedSession.id);
      return;
    }

    targetStepOrder = matched.target_step_order ?? undefined;
  } else if (step.collects_email) {
    const email = text.trim();

    if (!EMAIL_PATTERN.test(email) || !hasAllowedTld(email)) {
      const retryResult = await sendInstagramMessage({
        instagramUserId: instagramAccount.instagram_user_id,
        accessToken: instagramAccount.access_token,
        recipient: { id: senderId },
        message: EMAIL_RETRY_MESSAGE,
      });

      if (!retryResult.success) {
        console.error(
          "Email retry prompt send failed:",
          typedSession.flow_id,
          retryResult.error
        );
      }

      await supabaseAdmin
        .from("dm_flow_sessions")
        .update({ last_interaction_at: new Date().toISOString() })
        .eq("id", typedSession.id);
      return;
    }

    const { error: leadError } = await supabaseAdmin.from("dm_flow_leads").upsert(
      {
        flow_id: typedSession.flow_id,
        instagram_account_id: instagramAccount.id,
        ig_sender_id: senderId,
        email,
      },
      { onConflict: "flow_id,ig_sender_id" }
    );

    if (leadError) {
      console.error("Failed to store dm_flow_leads row:", leadError.message);
    }

    targetStepOrder = intentMap.yes ?? intentMap.default;
  } else {
    const intent = matchIntent(text);
    targetStepOrder = intentMap[intent] ?? intentMap.default;
  }

  if (targetStepOrder == null) {
    await supabaseAdmin
      .from("dm_flow_sessions")
      .update({ status: "completed", last_interaction_at: new Date().toISOString() })
      .eq("id", typedSession.id);
    return;
  }

  const { data: nextStep } = await supabaseAdmin
    .from("dm_flow_steps")
    .select(
      "id, flow_id, step_order, message_text, expects_reply, intent_map, collects_email, options, attachment_url, attachment_type"
    )
    .eq("flow_id", typedSession.flow_id)
    .eq("step_order", targetStepOrder)
    .maybeSingle();

  if (!nextStep) {
    await supabaseAdmin
      .from("dm_flow_sessions")
      .update({ status: "completed", last_interaction_at: new Date().toISOString() })
      .eq("id", typedSession.id);
    return;
  }

  const result = await sendRuleOrStepMessage({
    instagramUserId: instagramAccount.instagram_user_id,
    accessToken: instagramAccount.access_token,
    recipient: { id: senderId },
    text: withOptionsList(
      (nextStep as DmFlowStep).message_text,
      (nextStep as DmFlowStep).options ?? []
    ),
    attachmentUrl: (nextStep as DmFlowStep).attachment_url,
    attachmentType: (nextStep as DmFlowStep).attachment_type,
  });

  if (!result.success) {
    console.error("DM flow step send failed:", typedSession.flow_id, result.error);
  }

  await supabaseAdmin
    .from("dm_flow_sessions")
    .update({
      current_step_order: targetStepOrder,
      status: (nextStep as DmFlowStep).expects_reply ? "active" : "completed",
      last_interaction_at: new Date().toISOString(),
    })
    .eq("id", typedSession.id);
}

/**
 * ============================================
 * VERIFY META WEBHOOK SIGNATURE
 * ============================================
 */

async function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null
): Promise<boolean> {
  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expectedHex = signatureHeader.slice("sha256=".length);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(META_APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody)
  );

  const computedHex = Array.from(new Uint8Array(signatureBytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(computedHex, expectedHex);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;

  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}

/**
 * ============================================
 * CHECK WHETHER A COMMENTER FOLLOWS THE BUSINESS ACCOUNT
 * Uses the Instagram Messaging "user profile" field
 * is_user_follow_business, available under the same
 * instagram_business_manage_messages permission already
 * used to send messages. Fails closed (treated as "not
 * following") on any error, since that's the safer default
 * for a follow-gate.
 * ============================================
 */

async function checkUserFollowsBusiness(
  instagramScopedId: string,
  accessToken: string
): Promise<boolean> {
  const url = `${INSTAGRAM_GRAPH_BASE_URL}/${INSTAGRAM_API_VERSION}/${instagramScopedId}?fields=is_user_follow_business&access_token=${accessToken}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("Follow-check API error:", JSON.stringify(data));
      return false;
    }

    return data.is_user_follow_business === true;
  } catch (error) {
    console.error("Follow-check network error:", String(error));
    return false;
  }
}

/**
 * ============================================
 * RECORD META'S APP-LEVEL RATE-LIMIT USAGE
 * `x-app-usage` is a JSON header Graph API returns on every response,
 * e.g. {"call_count":28,"total_cputime":25,"total_time":25} — each
 * already a 0-100 percentage of the app's current limit, so there is
 * no separate cap to look up or hardcode. Best-effort: a failure here
 * must never block the DM send it's piggybacking on.
 * ============================================
 */

async function recordApiUsage(header: string | null) {
  if (!header) return;

  let usage: { call_count?: number; total_cputime?: number; total_time?: number };
  try {
    usage = JSON.parse(header);
  } catch {
    console.error("Unparseable x-app-usage header:", header);
    return;
  }

  const { error } = await supabaseAdmin
    .from("api_usage")
    .update({
      call_count: usage.call_count ?? null,
      total_cputime: usage.total_cputime ?? null,
      total_time: usage.total_time ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error("Failed to record api_usage:", error.message);
  }
}

/**
 * ============================================
 * SEND INSTAGRAM MESSAGE (shared sender)
 * recipient is either a comment private-reply ({comment_id}) or an
 * ongoing-conversation send ({id: <ig-scoped user id>}).
 * ============================================
 */

async function sendInstagramMessage({
  instagramUserId,
  accessToken,
  recipient,
  message,
}: {
  instagramUserId: string;
  accessToken: string;
  recipient: { comment_id: string } | { id: string };
  message: string;
}): Promise<{ success: true; messageId?: string } | { success: false; error: string }> {
  const url = `${INSTAGRAM_GRAPH_BASE_URL}/${INSTAGRAM_API_VERSION}/${instagramUserId}/messages`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient,
        message: { text: message },
      }),
    });
  } catch (networkError) {
    return {
      success: false,
      error: `Network error calling Instagram API: ${String(networkError)}`,
    };
  }

  await recordApiUsage(response.headers.get("x-app-usage"));

  let responseBody: Record<string, unknown> = {};

  try {
    responseBody = await response.json();
  } catch {
    // non-JSON body; fall through with an empty object
  }

  if (!response.ok) {
    return {
      success: false,
      error: `Instagram API ${response.status}: ${JSON.stringify(responseBody)}`,
    };
  }

  const messageId =
    typeof responseBody.message_id === "string"
      ? responseBody.message_id
      : undefined;

  return { success: true, messageId };
}

/**
 * ============================================
 * SEND INSTAGRAM ATTACHMENT
 * Instagram's message object is text XOR attachment per call — this is a
 * separate send from sendInstagramMessage, not a param on it, so a rule/
 * step with both a message and an attachment goes out as two DM bubbles
 * (text, then attachment), same as sendRuleOrStepMessage below does it.
 * ============================================
 */

async function sendInstagramAttachment({
  instagramUserId,
  accessToken,
  recipient,
  attachmentUrl,
  attachmentType,
}: {
  instagramUserId: string;
  accessToken: string;
  recipient: { comment_id: string } | { id: string };
  attachmentUrl: string;
  attachmentType: AttachmentType;
}): Promise<{ success: true; messageId?: string } | { success: false; error: string }> {
  const url = `${INSTAGRAM_GRAPH_BASE_URL}/${INSTAGRAM_API_VERSION}/${instagramUserId}/messages`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient,
        message: {
          attachment: {
            type: attachmentType,
            payload: { url: attachmentUrl, is_reusable: true },
          },
        },
      }),
    });
  } catch (networkError) {
    return {
      success: false,
      error: `Network error calling Instagram API: ${String(networkError)}`,
    };
  }

  await recordApiUsage(response.headers.get("x-app-usage"));

  let responseBody: Record<string, unknown> = {};

  try {
    responseBody = await response.json();
  } catch {
    // non-JSON body; fall through with an empty object
  }

  if (!response.ok) {
    return {
      success: false,
      error: `Instagram API ${response.status}: ${JSON.stringify(responseBody)}`,
    };
  }

  const messageId =
    typeof responseBody.message_id === "string"
      ? responseBody.message_id
      : undefined;

  return { success: true, messageId };
}

/**
 * ============================================
 * SEND RULE/STEP MESSAGE (text, then optional attachment)
 * Shared by automation_rules and dm_flow_steps sends: always sends the
 * text first (rules/steps always require a message), then the attachment
 * if one is configured. The attachment's result (if sent) is returned,
 * since it's the more recent/significant send — matches what callers
 * store as "the" message id for this execution/step.
 * ============================================
 */

async function sendRuleOrStepMessage({
  instagramUserId,
  accessToken,
  recipient,
  text,
  attachmentUrl,
  attachmentType,
}: {
  instagramUserId: string;
  accessToken: string;
  recipient: { comment_id: string } | { id: string };
  text: string;
  attachmentUrl: string | null;
  attachmentType: AttachmentType | null;
}): Promise<{ success: true; messageId?: string } | { success: false; error: string }> {
  const textResult = await sendInstagramMessage({
    instagramUserId,
    accessToken,
    recipient,
    message: text,
  });

  if (!textResult.success || !attachmentUrl) {
    return textResult;
  }

  return await sendInstagramAttachment({
    instagramUserId,
    accessToken,
    recipient,
    attachmentUrl,
    attachmentType: attachmentType ?? "image",
  });
}

/**
 * ============================================
 * POST PUBLIC COMMENT REPLY (optional, alongside the private DM)
 * Distinct endpoint from sendInstagramMessage: this posts a visible reply
 * under the triggering comment (POST /{comment-id}/replies) rather than
 * sending a private message.
 * ============================================
 */

async function postPublicCommentReply({
  commentId,
  accessToken,
  message,
}: {
  commentId: string;
  accessToken: string;
  message: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const url = `${INSTAGRAM_GRAPH_BASE_URL}/${INSTAGRAM_API_VERSION}/${commentId}/replies`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
  } catch (networkError) {
    return {
      success: false,
      error: `Network error calling Instagram API: ${String(networkError)}`,
    };
  }

  await recordApiUsage(response.headers.get("x-app-usage"));

  if (!response.ok) {
    let responseBody: Record<string, unknown> = {};

    try {
      responseBody = await response.json();
    } catch {
      // non-JSON body; fall through with an empty object
    }

    return {
      success: false,
      error: `Instagram API ${response.status}: ${JSON.stringify(responseBody)}`,
    };
  }

  return { success: true };
}
