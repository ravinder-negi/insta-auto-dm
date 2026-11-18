import "server-only";
import {
  INSTAGRAM_API_VERSION as API_VERSION,
  INSTAGRAM_GRAPH_BASE_URL,
} from "@/lib/instagram/config";

/**
 * Stops Meta delivering an account's webhook events. Call it before the
 * instagram_accounts row (and with it the only copy of the token) is gone.
 *
 * Best effort: a dead token or a Meta outage must not block disconnecting or
 * deleting an account. Anything Meta still sends afterwards is dropped by
 * the webhook, which ignores accounts it doesn't know.
 */
export async function unsubscribeFromWebhooks(instagramUserId: string, accessToken: string) {
  try {
    const url = new URL(
      `${INSTAGRAM_GRAPH_BASE_URL}/${API_VERSION}/${instagramUserId}/subscribed_apps`,
    );
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url, {
      method: "DELETE",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      // Safe to log: the IG account id and Meta's error fields, never the token.
      console.error("Instagram webhook unsubscribe failed", {
        instagramUserId,
        httpStatus: response.status,
        metaErrorCode: body?.error?.code,
        metaErrorMessage: body?.error?.message,
      });
    }
  } catch (error) {
    console.error("Instagram webhook unsubscribe failed", {
      instagramUserId,
      error: String(error),
    });
  }
}
