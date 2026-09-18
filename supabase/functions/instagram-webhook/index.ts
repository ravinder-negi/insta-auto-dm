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
  }>;
}

interface AutomationRule {
  id: string;
  keyword: string;
  instagram_media_id: string | null;
  dm_message: string;
  require_follow: boolean;
  follow_prompt_message: string | null;
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

  let instagramAccount: {
    id: string;
    instagram_user_id: string;
    username: string | null;
    access_token: string;
    is_active: boolean;
  } | null = null;

  if (instagramAccountId) {
    const { data, error } = await supabaseAdmin
      .from("instagram_accounts")
      .select("id, instagram_user_id, username, access_token, is_active")
      .eq("instagram_user_id", instagramAccountId)
      .maybeSingle();

    if (error) {
      console.error("Failed to look up instagram_accounts:", error.message);
    } else {
      instagramAccount = data;
    }
  }

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
   * MATCH AUTOMATION RULE
   * account + (media match or account-wide) + exact,
   * case-insensitive, trimmed keyword. A rule scoped to
   * this specific media_id wins over an account-wide one.
   * ======================================
   */

  const { data: rules, error: rulesError } = await supabaseAdmin
    .from("automation_rules")
    .select(
      "id, keyword, instagram_media_id, dm_message, require_follow, follow_prompt_message"
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

      const profileLink = `https://www.instagram.com/_u/${
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

  const result = await sendPrivateReply({
    instagramUserId: instagramAccount.instagram_user_id,
    accessToken: instagramAccount.access_token,
    commentId,
    message: outgoingMessage,
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
  const url = `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${instagramScopedId}?fields=is_user_follow_business&access_token=${accessToken}`;

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
 * SEND INSTAGRAM PRIVATE REPLY
 * ============================================
 */

async function sendPrivateReply({
  instagramUserId,
  accessToken,
  commentId,
  message,
}: {
  instagramUserId: string;
  accessToken: string;
  commentId: string;
  message: string;
}): Promise<{ success: true; messageId?: string } | { success: false; error: string }> {
  const url = `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${instagramUserId}/messages`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { comment_id: commentId },
        message: { text: message },
      }),
    });
  } catch (networkError) {
    return {
      success: false,
      error: `Network error calling Instagram API: ${String(networkError)}`,
    };
  }

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
