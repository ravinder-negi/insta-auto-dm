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
        // Present when the inbound DM is a reply to one of the business
        // account's stories — absent on every other messaging event.
        reply_to?: {
          story?: {
            id?: string;
            url?: string;
          };
        };
      };
    }>;
  }>;
}

type AttachmentType = "image" | "video" | "audio";

interface RuleButton {
  label: string;
  url: string;
}

interface RuleFollowup {
  step_order: number;
  delay_minutes: number;
  message: string;
}

interface AutomationRule {
  id: string;
  keyword_match: "specific" | "any";
  keywords: string[] | null;
  excluded_keywords: string[] | null;
  keyword: string | null;
  instagram_media_id: string | null;
  send_delay_seconds: number | null;
  dm_message: string;
  dm_buttons: RuleButton[] | null;
  dm_button_card_title: string | null;
  collect_email: boolean;
  email_prompt_message: string | null;
  require_follow: boolean;
  follow_prompt_message: string | null;
  send_public_reply: boolean;
  public_reply_messages: string[] | null;
  public_reply_message: string | null;
  attachment_url: string | null;
  attachment_type: AttachmentType | null;
}

/**
 * Word-boundary, case-insensitive containment — the keyword "ai" matches the
 * comment "ai" or "send me ai" but not "pain". Multi-word keywords work the
 * same way.
 */
function commentIncludesKeyword(normalizedComment: string, keyword: string) {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return false;

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(^|[^\\p{L}\\p{N}_])${escaped}([^\\p{L}\\p{N}_]|$)`,
    "u"
  ).test(normalizedComment);
}

interface KeywordMatchable {
  keyword_match: "specific" | "any";
  keywords: string[] | null;
  excluded_keywords: string[] | null;
  keyword: string | null;
}

/** Excluded keywords veto a match, including on "any comment" rules. Shared
 *  by automation_rules and dm_flows, which both use the same keyword-set
 *  shape. */
function commentMatchesRule(rule: KeywordMatchable, normalizedComment: string) {
  const excluded = rule.excluded_keywords ?? [];
  if (excluded.some((word) => commentIncludesKeyword(normalizedComment, word))) {
    return false;
  }

  if (rule.keyword_match === "any") return true;

  const keywords = rule.keywords?.length
    ? rule.keywords
    : rule.keyword
      ? [rule.keyword]
      : [];

  return keywords.some((word) => commentIncludesKeyword(normalizedComment, word));
}

/** Generic-template element titles are capped by Instagram; the card needs
 *  one even when the real copy lives in the text DM sent just before it. */
const CARD_TITLE_MAX_LENGTH = 80;
const CARD_SUBTITLE_MAX_LENGTH = 80;

/**
 * Delays up to this many seconds are waited out inside the webhook and sent
 * live, so the DM keeps its button card and its attachment and any Instagram
 * error is recorded on the execution. Longer delays go to scheduled_dms,
 * where the cron sweep sends them fire-and-forget.
 */
const LIVE_SEND_MAX_DELAY_SECONDS = 10;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const DEFAULT_CARD_TITLE = "Tap the button below 👇";

/**
 * Instagram shows buttons on a card with its own title and subtitle, so a DM
 * short enough to fit there goes out as ONE bubble: card copy = the DM text.
 * Only a message too long for both lines is sent as its own message first,
 * with the configured heading on the card beneath it.
 */
function cardCopy(text: string, cardTitle: string | null) {
  const message = text.trim();
  const fallbackTitle = cardTitle?.trim() || DEFAULT_CARD_TITLE;

  if (!message) {
    return { title: fallbackTitle, subtitle: null, sendTextSeparately: false };
  }

  if (message.length <= CARD_TITLE_MAX_LENGTH) {
    return { title: message, subtitle: null, sendTextSeparately: false };
  }

  if (message.length <= CARD_TITLE_MAX_LENGTH + CARD_SUBTITLE_MAX_LENGTH) {
    // Break on whitespace so a word isn't cut in half across the two lines.
    const breakAt = message.lastIndexOf(" ", CARD_TITLE_MAX_LENGTH);
    const splitAt = breakAt > 0 ? breakAt : CARD_TITLE_MAX_LENGTH;

    return {
      title: message.slice(0, splitAt).trim(),
      subtitle: message.slice(splitAt).trim().slice(0, CARD_SUBTITLE_MAX_LENGTH),
      sendTextSeparately: false,
    };
  }

  return { title: fallbackTitle, subtitle: null, sendTextSeparately: true };
}

/** The Instagram message objects a delayed send is queued as: the text, the
 *  button card, then the attachment — the same sequence sendRuleOrStepMessage
 *  sends live. */
function scheduledMessagePayloads({
  text,
  buttons,
  cardTitle,
  attachmentUrl,
  attachmentType,
}: {
  text: string;
  buttons: RuleButton[];
  cardTitle: string | null;
  attachmentUrl: string | null;
  attachmentType: AttachmentType | null;
}): Record<string, unknown>[] {
  const cardImage =
    attachmentUrl && (attachmentType ?? "image") === "image" ? attachmentUrl : null;

  const copy = buttons.length ? cardCopy(text, cardTitle) : null;

  const payloads: Record<string, unknown>[] =
    copy && !copy.sendTextSeparately ? [] : [{ text }];

  if (copy) {
    payloads.push({
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: copy.title,
              ...(copy.subtitle ? { subtitle: copy.subtitle } : {}),
              ...(cardImage ? { image_url: cardImage } : {}),
              buttons: buttons.slice(0, 3).map((button) => ({
                type: "web_url",
                url: button.url,
                title: button.label,
              })),
            },
          ],
        },
      },
    });
  }

  // An image already shown on the card isn't sent a second time.
  if (attachmentUrl && !(buttons.length && cardImage)) {
    payloads.push({
      attachment: {
        type: attachmentType ?? "image",
        payload: { url: attachmentUrl, is_reusable: true },
      },
    });
  }

  return payloads;
}

/** Used when Instagram rejects the button card: the links still reach the
 *  recipient as text. */
function buttonLinksText(buttons: RuleButton[]) {
  return buttons.map((button) => `${button.label}: ${button.url}`).join("\n");
}

/** Instagram threads a reply to the commenter only when it opens with their
 *  handle, the way a manual reply typed in the app does. */
function withCommenterMention(message: string, username: string | undefined) {
  if (!username) return message;

  const handle = `@${username}`;
  return message.includes(handle) ? message : `${handle} ${message}`;
}

/** Rotating a few wordings at random keeps public replies from reading like a
 *  bot posting the same line under every comment. Shared by automation_rules
 *  and dm_flows. */
function pickPublicReply(entity: {
  public_reply_messages: string[] | null;
  public_reply_message: string | null;
}) {
  const messages = (entity.public_reply_messages ?? []).filter(
    (message) => message.trim().length > 0
  );

  if (messages.length === 0) return entity.public_reply_message;

  return messages[Math.floor(Math.random() * messages.length)];
}

interface DmFlow {
  id: string;
  keyword_match: "specific" | "any";
  keywords: string[] | null;
  excluded_keywords: string[] | null;
  /** Legacy single-keyword column, kept in sync with keywords[0]. */
  trigger_keyword: string | null;
  instagram_media_id: string | null;
  send_public_reply: boolean;
  public_reply_messages: string[] | null;
  /** Legacy single-reply column, kept in sync with public_reply_messages[0]. */
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
  buttons: RuleButton[];
  button_card_title: string | null;
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
        if (change?.field === "comments") {
          await handleCommentChange(instagramAccountId, change.value, payload);
        } else if (change?.field === "live_comments") {
          await handleCommentChange(
            instagramAccountId,
            change.value,
            payload,
            "live_comment"
          );
        }
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
  fullPayload: InstagramWebhookPayload,
  triggerType: "comment_keyword" | "live_comment" = "comment_keyword"
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
      event_type: triggerType === "live_comment" ? "live_comments" : "comments",
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

  // The account's own comments must never trigger its automations — with an
  // "any comment" rule that would mean DMing yourself on every post.
  if (commenterId === instagramAccount.instagram_user_id) {
    console.log("Skipping the account's own comment:", commentId);
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
   * Same account + (media match or account-wide) + keyword match, same
   * rules as automation_rules (specific keyword set or "any comment"),
   * checked first. A match starts a multi-step session instead of
   * sending a single static reply, and short-circuits the single-rule
   * matching below. trigger_comment_id is unique, so a retried webhook
   * delivery can't start the same flow twice even though this path isn't
   * covered by the automation_executions dedupe above.
   * ======================================
   */

  const { data: flows, error: flowsError } = await supabaseAdmin
    .from("dm_flows")
    .select(
      "id, keyword_match, keywords, excluded_keywords, trigger_keyword, instagram_media_id, send_public_reply, public_reply_messages, public_reply_message"
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
    .filter((flow) =>
      commentMatchesRule(
        {
          keyword_match: flow.keyword_match,
          keywords: flow.keywords,
          excluded_keywords: flow.excluded_keywords,
          keyword: flow.trigger_keyword,
        },
        normalizedCommentForFlow
      )
    )
    .sort(
      (a, b) =>
        (a.instagram_media_id === null ? 1 : 0) -
          (b.instagram_media_id === null ? 1 : 0) ||
        (a.keyword_match === "any" ? 1 : 0) - (b.keyword_match === "any" ? 1 : 0)
    )[0];

  if (matchedFlow) {
    console.log("DM flow matched:", matchedFlow.id);
    await startDmFlow({
      flow: matchedFlow,
      instagramAccount,
      commentId,
      senderId: commenterId,
      commenterUsername,
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
      "id, keyword_match, keywords, excluded_keywords, keyword, instagram_media_id, send_delay_seconds, dm_message, dm_buttons, dm_button_card_title, require_follow, follow_prompt_message, collect_email, email_prompt_message, send_public_reply, public_reply_messages, public_reply_message, attachment_url, attachment_type"
    )
    .eq("instagram_account_id", instagramAccount.id)
    .eq("trigger_type", triggerType)
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
    .filter((rule) => commentMatchesRule(rule, normalizedComment))
    .sort(
      (a, b) =>
        // A rule scoped to this media wins over an account-wide one, and a
        // keyword rule wins over one that fires on any comment.
        (a.instagram_media_id === null ? 1 : 0) -
          (b.instagram_media_id === null ? 1 : 0) ||
        (a.keyword_match === "any" ? 1 : 0) - (b.keyword_match === "any" ? 1 : 0)
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

  const publicReply = pickPublicReply(matchedRule);

  if (matchedRule.send_public_reply && publicReply) {
    const publicReplyResult = await postPublicCommentReply({
      commentId,
      accessToken: instagramAccount.access_token,
      message: withCommenterMention(publicReply, commenterUsername),
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
  let isFollowPrompt = false;

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
      isFollowPrompt = true;
    } else {
      // Already following. If we nudged them earlier, stamp the prompt row so
      // analytics can attribute the follow to this rule. The `is null` guard
      // keeps the first conversion timestamp instead of bumping it on every
      // later comment.
      await supabaseAdmin
        .from("automation_follow_prompts")
        .update({ followed_at: new Date().toISOString() })
        .eq("automation_rule_id", matchedRule.id)
        .eq("commenter_instagram_id", commenterId)
        .is("followed_at", null);
    }
  }

  /**
   * ======================================
   * EMAIL ASK
   * A commenter whose address we don't have yet gets email_prompt_message
   * instead of the primary DM; their reply is captured in
   * handlePendingEmailPrompt, which then sends the real DM. Like the follow
   * gate, each commenter is asked at most once per rule.
   * ======================================
   */

  let isEmailPrompt = false;

  if (matchedRule.collect_email && !isFollowPrompt) {
    const { data: lead } = await supabaseAdmin
      .from("automation_rule_leads")
      .select("id")
      .eq("automation_rule_id", matchedRule.id)
      .eq("ig_sender_id", commenterId)
      .maybeSingle();

    if (!lead) {
      const { data: existingPrompt } = await supabaseAdmin
        .from("automation_email_prompts")
        .select("id")
        .eq("automation_rule_id", matchedRule.id)
        .eq("ig_sender_id", commenterId)
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
        console.log("Already asked for an email, skipping:", commentId);
        return;
      }

      outgoingMessage = matchedRule.email_prompt_message ?? "";
      isEmailPrompt = true;
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

  const isPrompt = isFollowPrompt || isEmailPrompt;
  const buttons = isPrompt ? [] : (matchedRule.dm_buttons ?? []);

  /**
   * ======================================
   * DELAYED SEND
   * A rule with a time delay hands the primary DM to scheduled_dms, which
   * pg_cron sweeps. Prompts (follow / email) always go out immediately —
   * they're the reply to the comment, not the payload. The sweep sends
   * plain text, so button links ride along in the message body.
   * ======================================
   */

  const delaySeconds = isPrompt ? 0 : (matchedRule.send_delay_seconds ?? 0);

  if (delaySeconds > LIVE_SEND_MAX_DELAY_SECONDS) {
    const sendAt = Date.now() + delaySeconds * 1000;

    const { error: scheduleError } = await supabaseAdmin
      .from("scheduled_dms")
      .insert(
        scheduledMessagePayloads({
          text: outgoingMessage,
          buttons,
          cardTitle: matchedRule.dm_button_card_title,
          attachmentUrl: isPrompt ? null : matchedRule.attachment_url,
          attachmentType: isPrompt ? null : matchedRule.attachment_type,
        }).map((payload, index) => ({
          instagram_account_id: instagramAccount.id,
          automation_rule_id: matchedRule.id,
          recipient_ig_id: commenterId,
          // Only the first message can use the comment's private-reply
          // allowance; the rest ride the thread it opens.
          recipient_comment_id: index === 0 ? commentId : null,
          message: typeof payload.text === "string" ? payload.text : "",
          message_payload: payload,
          // One second apart so the sweep keeps them in order.
          send_after: new Date(sendAt + index * 1000).toISOString(),
        }))
      );

    await supabaseAdmin
      .from("automation_executions")
      .update({
        status: scheduleError ? "failed" : "scheduled",
        error_message: scheduleError?.message ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("instagram_comment_id", commentId);

    if (scheduleError) {
      console.error("Failed to schedule delayed DM:", commentId, scheduleError.message);
      return;
    }

    await scheduleFollowups({
      ruleId: matchedRule.id,
      instagramAccountId: instagramAccount.id,
      recipientIgId: commenterId,
      baseDelaySeconds: delaySeconds,
    });

    console.log("Private reply scheduled:", commentId);
    return;
  }

  /**
   * ======================================
   * SEND PRIVATE REPLY
   * ======================================
   */

  if (delaySeconds > 0) {
    await sleep(delaySeconds * 1000);
  }

  const result = await sendRuleOrStepMessage({
    instagramUserId: instagramAccount.instagram_user_id,
    accessToken: instagramAccount.access_token,
    recipient: { comment_id: commentId },
    text: outgoingMessage,
    buttons,
    cardTitle: matchedRule.dm_button_card_title,
    // Attachment belongs to the real dm_message, not a follow/email nudge.
    attachmentUrl: isPrompt ? null : matchedRule.attachment_url,
    attachmentType: isPrompt ? null : matchedRule.attachment_type,
  });

  if (result.success) {
    await supabaseAdmin
      .from("automation_executions")
      .update({
        status: isFollowPrompt
          ? "follow_prompt_sent"
          : isEmailPrompt
            ? "email_prompt_sent"
            : "sent",
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

    if (isEmailPrompt) {
      await supabaseAdmin.from("automation_email_prompts").insert({
        automation_rule_id: matchedRule.id,
        instagram_account_id: instagramAccount.id,
        ig_sender_id: commenterId,
        instagram_comment_id: commentId,
      });
    }

    if (!isPrompt) {
      await scheduleFollowups({
        ruleId: matchedRule.id,
        instagramAccountId: instagramAccount.id,
        recipientIgId: commenterId,
        baseDelaySeconds: 0,
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
 * SCHEDULE FOLLOW-UPS
 * Queued once the primary DM is sent (or scheduled), each offset from that
 * send rather than from each other. Follow-ups address the recipient by id:
 * a comment_id private reply is a one-shot allowance.
 * ============================================
 */

async function scheduleFollowups({
  ruleId,
  instagramAccountId,
  recipientIgId,
  baseDelaySeconds,
}: {
  ruleId: string;
  instagramAccountId: string;
  recipientIgId: string;
  baseDelaySeconds: number;
}) {
  const { data: followups, error } = await supabaseAdmin
    .from("automation_rule_followups")
    .select("step_order, delay_minutes, message")
    .eq("automation_rule_id", ruleId)
    .order("step_order");

  if (error) {
    console.error("Failed to load follow-ups:", error.message);
    return;
  }
  if (!followups?.length) return;

  const now = Date.now();

  const { error: insertError } = await supabaseAdmin.from("scheduled_dms").insert(
    (followups as RuleFollowup[]).map((followup) => ({
      instagram_account_id: instagramAccountId,
      automation_rule_id: ruleId,
      recipient_ig_id: recipientIgId,
      message: followup.message,
      message_payload: { text: followup.message },
      send_after: new Date(
        now + (baseDelaySeconds + followup.delay_minutes * 60) * 1000
      ).toISOString(),
    }))
  );

  if (insertError) {
    console.error("Failed to schedule follow-ups:", insertError.message);
  }
}

/**
 * ============================================
 * PENDING EMAIL ASK
 * A DM from someone who still owes an address is read as that address: a
 * valid one is stored and the primary DM follows, an invalid one is
 * re-prompted. Returns whether the message was consumed here.
 * ============================================
 */

async function handlePendingEmailPrompt({
  instagramAccount,
  senderId,
  text,
}: {
  instagramAccount: { id: string; instagram_user_id: string; access_token: string };
  senderId: string;
  text: string;
}): Promise<boolean> {
  const { data: prompt } = await supabaseAdmin
    .from("automation_email_prompts")
    .select("id, automation_rule_id")
    .eq("instagram_account_id", instagramAccount.id)
    .eq("ig_sender_id", senderId)
    .eq("status", "pending")
    .order("prompted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!prompt) return false;

  const email = text.trim();

  if (!EMAIL_PATTERN.test(email) || !hasAllowedTld(email)) {
    const retryResult = await sendInstagramMessage({
      instagramUserId: instagramAccount.instagram_user_id,
      accessToken: instagramAccount.access_token,
      recipient: { id: senderId },
      message: EMAIL_RETRY_MESSAGE,
    });

    if (!retryResult.success) {
      console.error("Email retry prompt send failed:", retryResult.error);
    }

    return true;
  }

  const ruleId = prompt.automation_rule_id as string;

  const { error: leadError } = await supabaseAdmin
    .from("automation_rule_leads")
    .upsert(
      {
        automation_rule_id: ruleId,
        instagram_account_id: instagramAccount.id,
        ig_sender_id: senderId,
        email,
      },
      { onConflict: "automation_rule_id,ig_sender_id" }
    );

  if (leadError) {
    console.error("Failed to store rule lead:", leadError.message);
  }

  await supabaseAdmin
    .from("automation_email_prompts")
    .update({ status: "collected", collected_at: new Date().toISOString() })
    .eq("id", prompt.id);

  const { data: rule } = await supabaseAdmin
    .from("automation_rules")
    .select(
      "id, send_delay_seconds, dm_message, dm_buttons, dm_button_card_title, attachment_url, attachment_type"
    )
    .eq("id", ruleId)
    .maybeSingle();

  if (!rule) return true;

  const typedRule = rule as Pick<
    AutomationRule,
    | "id"
    | "send_delay_seconds"
    | "dm_message"
    | "dm_buttons"
    | "dm_button_card_title"
    | "attachment_url"
    | "attachment_type"
  >;
  const buttons = typedRule.dm_buttons ?? [];
  const delaySeconds = typedRule.send_delay_seconds ?? 0;

  if (delaySeconds > LIVE_SEND_MAX_DELAY_SECONDS) {
    const sendAt = Date.now() + delaySeconds * 1000;

    await supabaseAdmin.from("scheduled_dms").insert(
      scheduledMessagePayloads({
        text: typedRule.dm_message,
        buttons,
        cardTitle: typedRule.dm_button_card_title,
        attachmentUrl: typedRule.attachment_url,
        attachmentType: typedRule.attachment_type,
      }).map((payload, index) => ({
        instagram_account_id: instagramAccount.id,
        automation_rule_id: typedRule.id,
        recipient_ig_id: senderId,
        message: typeof payload.text === "string" ? payload.text : "",
        message_payload: payload,
        send_after: new Date(sendAt + index * 1000).toISOString(),
      }))
    );
  } else {
    if (delaySeconds > 0) {
      await sleep(delaySeconds * 1000);
    }

    const result = await sendRuleOrStepMessage({
      instagramUserId: instagramAccount.instagram_user_id,
      accessToken: instagramAccount.access_token,
      recipient: { id: senderId },
      text: typedRule.dm_message,
      buttons,
      cardTitle: typedRule.dm_button_card_title,
      attachmentUrl: typedRule.attachment_url,
      attachmentType: typedRule.attachment_type,
    });

    if (!result.success) {
      console.error("Primary DM after email capture failed:", result.error);
    }
  }

  await scheduleFollowups({
    ruleId: typedRule.id,
    instagramAccountId: instagramAccount.id,
    recipientIgId: senderId,
    baseDelaySeconds: delaySeconds,
  });

  return true;
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
  commenterUsername,
}: {
  flow: DmFlow;
  instagramAccount: { id: string; instagram_user_id: string; access_token: string };
  commentId: string;
  senderId: string;
  commenterUsername?: string;
}) {
  const { data: firstStep, error: stepError } = await supabaseAdmin
    .from("dm_flow_steps")
    .select(
      "id, flow_id, step_order, message_text, expects_reply, intent_map, collects_email, options, attachment_url, attachment_type, buttons, button_card_title"
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

  const publicReply = pickPublicReply(flow);

  if (flow.send_public_reply && publicReply) {
    const publicReplyResult = await postPublicCommentReply({
      commentId,
      accessToken: instagramAccount.access_token,
      message: withCommenterMention(publicReply, commenterUsername),
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
    buttons: (firstStep as DmFlowStep).buttons ?? [],
    cardTitle: (firstStep as DmFlowStep).button_card_title,
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
  const mid = event.message?.mid;
  const storyId = event.message?.reply_to?.story?.id;

  if (!senderId || !text) return;

  const instagramAccount = await resolveInstagramAccount(instagramAccountId);
  if (!instagramAccount || !instagramAccount.is_active) return;

  // A story reply is its own trigger, matched against story_reply rules
  // rather than an in-progress dm_flow session or a pending email ask.
  if (storyId && mid) {
    await handleStoryReplyEvent({
      instagramAccount,
      senderId,
      storyId,
      mid,
      text,
    });
    return;
  }

  // An outstanding email ask owns the next reply from that sender.
  const emailHandled = await handlePendingEmailPrompt({
    instagramAccount,
    senderId,
    text,
  });
  if (emailHandled) return;

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
      "id, flow_id, step_order, message_text, expects_reply, intent_map, collects_email, options, attachment_url, attachment_type, buttons, button_card_title"
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
    buttons: (nextStep as DmFlowStep).buttons ?? [],
    cardTitle: (nextStep as DmFlowStep).button_card_title,
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
 * HANDLE STORY REPLY
 * A DM whose message.reply_to.story is set. Matched against story_reply
 * automation_rules the same way a comment matches comment_keyword rules
 * (account + specific story or account-wide + keyword), but sent as an
 * ordinary thread message ({id: senderId}) since there's no comment to
 * privately reply to, and deduped on the inbound mid rather than a
 * comment id.
 * ============================================
 */

async function handleStoryReplyEvent({
  instagramAccount,
  senderId,
  storyId,
  mid,
  text,
}: {
  instagramAccount: { id: string; instagram_user_id: string; username: string | null; access_token: string };
  senderId: string;
  storyId: string;
  mid: string;
  text: string;
}) {
  const { data: existingExecution } = await supabaseAdmin
    .from("automation_executions")
    .select("id")
    .eq("inbound_message_id", mid)
    .maybeSingle();

  if (existingExecution) {
    console.log("Story reply already processed:", mid);
    return;
  }

  const { data: rules, error: rulesError } = await supabaseAdmin
    .from("automation_rules")
    .select(
      "id, keyword_match, keywords, excluded_keywords, keyword, instagram_media_id, send_delay_seconds, dm_message, dm_buttons, dm_button_card_title, require_follow, follow_prompt_message, collect_email, email_prompt_message, send_public_reply, public_reply_messages, public_reply_message, attachment_url, attachment_type"
    )
    .eq("instagram_account_id", instagramAccount.id)
    .eq("trigger_type", "story_reply")
    .eq("is_active", true);

  if (rulesError) {
    console.error("Failed to load story_reply automation_rules:", rulesError.message);
    return;
  }

  const normalizedText = text.trim().toLowerCase();

  const matchedRule = ((rules ?? []) as AutomationRule[])
    .filter(
      (rule) =>
        rule.instagram_media_id === storyId || rule.instagram_media_id === null
    )
    .filter((rule) => commentMatchesRule(rule, normalizedText))
    .sort(
      (a, b) =>
        (a.instagram_media_id === null ? 1 : 0) -
          (b.instagram_media_id === null ? 1 : 0) ||
        (a.keyword_match === "any" ? 1 : 0) - (b.keyword_match === "any" ? 1 : 0)
    )[0];

  if (!matchedRule) {
    console.log("No story-reply automation matched for story:", storyId);
    return;
  }

  console.log("Story-reply automation matched:", matchedRule.id);

  let outgoingMessage = matchedRule.dm_message;
  let isFollowPrompt = false;

  if (matchedRule.require_follow) {
    const isFollowing = await checkUserFollowsBusiness(
      senderId,
      instagramAccount.access_token
    );

    if (!isFollowing) {
      const { data: existingPrompt } = await supabaseAdmin
        .from("automation_follow_prompts")
        .select("id")
        .eq("automation_rule_id", matchedRule.id)
        .eq("commenter_instagram_id", senderId)
        .maybeSingle();

      if (existingPrompt) {
        await supabaseAdmin.from("automation_executions").insert({
          automation_rule_id: matchedRule.id,
          instagram_account_id: instagramAccount.id,
          inbound_message_id: mid,
          commenter_instagram_id: senderId,
          instagram_media_id: storyId,
          comment_text: text,
          status: "skipped_already_prompted",
        });
        console.log("Already prompted to follow, skipping story reply:", mid);
        return;
      }

      const profileLink = `${INSTAGRAM_AUTHORIZE_BASE_URL}/_u/${
        instagramAccount.username ?? instagramAccount.instagram_user_id
      }/`;
      outgoingMessage = (matchedRule.follow_prompt_message ?? "").replaceAll(
        "{profile_link}",
        profileLink
      );
      isFollowPrompt = true;
    } else {
      await supabaseAdmin
        .from("automation_follow_prompts")
        .update({ followed_at: new Date().toISOString() })
        .eq("automation_rule_id", matchedRule.id)
        .eq("commenter_instagram_id", senderId)
        .is("followed_at", null);
    }
  }

  let isEmailPrompt = false;

  if (matchedRule.collect_email && !isFollowPrompt) {
    const { data: lead } = await supabaseAdmin
      .from("automation_rule_leads")
      .select("id")
      .eq("automation_rule_id", matchedRule.id)
      .eq("ig_sender_id", senderId)
      .maybeSingle();

    if (!lead) {
      const { data: existingPrompt } = await supabaseAdmin
        .from("automation_email_prompts")
        .select("id")
        .eq("automation_rule_id", matchedRule.id)
        .eq("ig_sender_id", senderId)
        .maybeSingle();

      if (existingPrompt) {
        await supabaseAdmin.from("automation_executions").insert({
          automation_rule_id: matchedRule.id,
          instagram_account_id: instagramAccount.id,
          inbound_message_id: mid,
          commenter_instagram_id: senderId,
          instagram_media_id: storyId,
          comment_text: text,
          status: "skipped_already_prompted",
        });
        console.log("Already asked for an email, skipping story reply:", mid);
        return;
      }

      outgoingMessage = matchedRule.email_prompt_message ?? "";
      isEmailPrompt = true;
    }
  }

  const { error: executionInsertError } = await supabaseAdmin
    .from("automation_executions")
    .insert({
      automation_rule_id: matchedRule.id,
      instagram_account_id: instagramAccount.id,
      inbound_message_id: mid,
      commenter_instagram_id: senderId,
      instagram_media_id: storyId,
      comment_text: text,
      status: "processing",
      dm_message: outgoingMessage,
    });

  if (executionInsertError) {
    if (executionInsertError.code === "23505") {
      console.log("Duplicate story-reply execution detected:", mid);
      return;
    }

    console.error("Failed to create story-reply execution:", executionInsertError.message);
    return;
  }

  const isPrompt = isFollowPrompt || isEmailPrompt;
  const buttons = isPrompt ? [] : (matchedRule.dm_buttons ?? []);
  const delaySeconds = isPrompt ? 0 : (matchedRule.send_delay_seconds ?? 0);

  if (delaySeconds > LIVE_SEND_MAX_DELAY_SECONDS) {
    const sendAt = Date.now() + delaySeconds * 1000;

    const { error: scheduleError } = await supabaseAdmin
      .from("scheduled_dms")
      .insert(
        scheduledMessagePayloads({
          text: outgoingMessage,
          buttons,
          cardTitle: matchedRule.dm_button_card_title,
          attachmentUrl: isPrompt ? null : matchedRule.attachment_url,
          attachmentType: isPrompt ? null : matchedRule.attachment_type,
        }).map((payload, index) => ({
          instagram_account_id: instagramAccount.id,
          automation_rule_id: matchedRule.id,
          recipient_ig_id: senderId,
          message: typeof payload.text === "string" ? payload.text : "",
          message_payload: payload,
          // One second apart so the sweep keeps them in order.
          send_after: new Date(sendAt + index * 1000).toISOString(),
        }))
      );

    await supabaseAdmin
      .from("automation_executions")
      .update({
        status: scheduleError ? "failed" : "scheduled",
        error_message: scheduleError?.message ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("inbound_message_id", mid);

    if (scheduleError) {
      console.error("Failed to schedule delayed story-reply DM:", mid, scheduleError.message);
      return;
    }

    await scheduleFollowups({
      ruleId: matchedRule.id,
      instagramAccountId: instagramAccount.id,
      recipientIgId: senderId,
      baseDelaySeconds: delaySeconds,
    });

    console.log("Story-reply DM scheduled:", mid);
    return;
  }

  if (delaySeconds > 0) {
    await sleep(delaySeconds * 1000);
  }

  const result = await sendRuleOrStepMessage({
    instagramUserId: instagramAccount.instagram_user_id,
    accessToken: instagramAccount.access_token,
    recipient: { id: senderId },
    text: outgoingMessage,
    buttons,
    cardTitle: matchedRule.dm_button_card_title,
    attachmentUrl: isPrompt ? null : matchedRule.attachment_url,
    attachmentType: isPrompt ? null : matchedRule.attachment_type,
  });

  if (result.success) {
    await supabaseAdmin
      .from("automation_executions")
      .update({
        status: isFollowPrompt
          ? "follow_prompt_sent"
          : isEmailPrompt
            ? "email_prompt_sent"
            : "sent",
        instagram_message_id: result.messageId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("inbound_message_id", mid);

    if (isFollowPrompt) {
      await supabaseAdmin.from("automation_follow_prompts").insert({
        automation_rule_id: matchedRule.id,
        commenter_instagram_id: senderId,
      });
    }

    if (isEmailPrompt) {
      await supabaseAdmin.from("automation_email_prompts").insert({
        automation_rule_id: matchedRule.id,
        instagram_account_id: instagramAccount.id,
        ig_sender_id: senderId,
      });
    }

    if (!isPrompt) {
      await scheduleFollowups({
        ruleId: matchedRule.id,
        instagramAccountId: instagramAccount.id,
        recipientIgId: senderId,
        baseDelaySeconds: 0,
      });
    }

    console.log("Story-reply DM sent:", mid);
  } else {
    await supabaseAdmin
      .from("automation_executions")
      .update({
        status: "failed",
        error_message: result.error,
        updated_at: new Date().toISOString(),
      })
      .eq("inbound_message_id", mid);

    console.error("Story-reply DM failed:", mid, result.error);
  }
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
}) {
  return await sendMessagePayload({
    instagramUserId,
    accessToken,
    recipient,
    message: { text: message },
  });
}

/**
 * Up to three link buttons, as a one-element generic template — the template
 * Instagram Login supports (the plain button template and quick_replies are
 * dropped on this integration). The card carries its own title, so the DM
 * text is sent as a separate message just before it.
 *
 * Callers fall back to plain text when this fails — see sendRuleOrStepMessage.
 */
async function sendInstagramButtonTemplate({
  instagramUserId,
  accessToken,
  recipient,
  title,
  subtitle,
  imageUrl,
  buttons,
}: {
  instagramUserId: string;
  accessToken: string;
  recipient: { comment_id: string } | { id: string };
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  buttons: RuleButton[];
}) {
  return await sendMessagePayload({
    instagramUserId,
    accessToken,
    recipient,
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: title.slice(0, CARD_TITLE_MAX_LENGTH),
              ...(subtitle
                ? { subtitle: subtitle.slice(0, CARD_SUBTITLE_MAX_LENGTH) }
                : {}),
              ...(imageUrl ? { image_url: imageUrl } : {}),
              buttons: buttons.slice(0, 3).map((button) => ({
                type: "web_url",
                url: button.url,
                title: button.label,
              })),
            },
          ],
        },
      },
    },
  });
}

/** Shared POST to /{ig-user-id}/messages — the message object is whatever
 *  shape the caller needs (text, attachment, template). */
async function sendMessagePayload({
  instagramUserId,
  accessToken,
  recipient,
  message,
}: {
  instagramUserId: string;
  accessToken: string;
  recipient: { comment_id: string } | { id: string };
  message: Record<string, unknown>;
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
      body: JSON.stringify({ recipient, message }),
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
 * SEND RULE/STEP MESSAGE (text and/or button card, then attachment)
 * Shared by automation_rules and dm_flow_steps sends. Without buttons it
 * sends the text, then the attachment if one is configured. With buttons
 * the text rides on the card when it fits there, so the DM lands as a
 * single bubble. The last send's result is returned, since that's what
 * callers store as "the" message id for this execution/step.
 * ============================================
 */

async function sendRuleOrStepMessage({
  instagramUserId,
  accessToken,
  recipient,
  text,
  buttons = [],
  cardTitle,
  attachmentUrl,
  attachmentType,
}: {
  instagramUserId: string;
  accessToken: string;
  recipient: { comment_id: string } | { id: string };
  text: string;
  buttons?: RuleButton[];
  cardTitle?: string | null;
  attachmentUrl: string | null;
  attachmentType: AttachmentType | null;
}): Promise<{ success: true; messageId?: string } | { success: false; error: string }> {
  // With buttons, the DM text rides on the card itself whenever it fits, so
  // the recipient gets one bubble instead of a message plus a card.
  const copy = buttons.length ? cardCopy(text, cardTitle ?? null) : null;

  let lastResult: { success: true; messageId?: string } | { success: false; error: string } = {
    success: true,
  };

  if (!copy || copy.sendTextSeparately) {
    lastResult = await sendInstagramMessage({
      instagramUserId,
      accessToken,
      recipient,
      message: text,
    });

    if (!lastResult.success) return lastResult;
  }

  // An image shown on the card isn't sent again as a separate attachment.
  let imageSentOnCard = false;

  if (copy) {
    const cardImage =
      attachmentUrl && (attachmentType ?? "image") === "image" ? attachmentUrl : null;

    const cardResult = await sendInstagramButtonTemplate({
      instagramUserId,
      accessToken,
      recipient,
      title: copy.title,
      subtitle: copy.subtitle,
      imageUrl: cardImage,
      buttons,
    });

    if (cardResult.success) {
      lastResult = cardResult;
      imageSentOnCard = Boolean(cardImage);
    } else {
      // Templates aren't accepted on every account — send the links as text
      // so the DM still carries them.
      console.error("Generic template rejected, falling back to text:", cardResult.error);

      const linksResult = await sendInstagramMessage({
        instagramUserId,
        accessToken,
        recipient,
        // The card never went out, so its copy has to come along as text.
        message: copy.sendTextSeparately
          ? buttonLinksText(buttons)
          : `${text}\n\n${buttonLinksText(buttons)}`,
      });

      if (!linksResult.success) return linksResult;
      lastResult = linksResult;
    }
  }

  if (!attachmentUrl || imageSentOnCard) {
    return lastResult;
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
