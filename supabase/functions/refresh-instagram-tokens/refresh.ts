import {
  MIN_TOKEN_AGE_HOURS,
  REFRESH_WINDOW_DAYS,
  type RefreshResult,
} from "../_shared/instagramToken.ts";

export interface DueAccount {
  id: string;
  instagram_user_id: string;
  access_token: string;
  token_expires_at: string | null;
}

/** Storage seam, so the refresh rules can be tested without a database. */
export interface TokenStore {
  /** Active-token accounts expiring before `expiresBefore` (or with an
   *  unknown expiry) whose token was issued before `issuedBefore`. */
  listDue(params: { expiresBefore: string; issuedBefore: string }): Promise<DueAccount[]>;
  /** Returns false when the row's token changed underneath us (the owner
   *  reconnected mid-run), so the fresher token is left alone. */
  saveRefreshed(
    account: DueAccount,
    update: { accessToken: string; expiresAt: string; refreshedAt: string },
  ): Promise<boolean>;
  saveFailure(account: DueAccount, update: { expired: boolean; error: string }): Promise<void>;
}

export interface RefreshSummary {
  checked: number;
  refreshed: number;
  expired: number;
  failed: number;
  superseded: number;
}

export async function refreshDueTokens({
  store,
  refresh,
  now = new Date(),
}: {
  store: TokenStore;
  refresh: (accessToken: string) => Promise<RefreshResult>;
  now?: Date;
}): Promise<RefreshSummary> {
  const accounts = await store.listDue({
    expiresBefore: new Date(now.getTime() + REFRESH_WINDOW_DAYS * 86_400_000).toISOString(),
    issuedBefore: new Date(now.getTime() - MIN_TOKEN_AGE_HOURS * 3_600_000).toISOString(),
  });

  const summary: RefreshSummary = {
    checked: accounts.length,
    refreshed: 0,
    expired: 0,
    failed: 0,
    superseded: 0,
  };

  // Sequential on purpose: a daily job over a 10-day window has plenty of
  // time, and it keeps us well clear of Meta's rate limits.
  for (const account of accounts) {
    const result = await refresh(account.access_token);

    if (result.ok) {
      const saved = await store.saveRefreshed(account, {
        accessToken: result.accessToken,
        expiresAt: new Date(now.getTime() + result.expiresInSeconds * 1000).toISOString(),
        refreshedAt: now.toISOString(),
      });
      if (saved) summary.refreshed += 1;
      else summary.superseded += 1;
      continue;
    }

    // A transient failure (network, rate limit) is retried on the next run
    // while the token is still alive; only a rejected or lapsed token needs
    // the owner to reconnect.
    const lapsed =
      account.token_expires_at !== null && new Date(account.token_expires_at) <= now;
    const expired = result.invalidToken || lapsed;

    await store.saveFailure(account, { expired, error: result.message });
    if (expired) summary.expired += 1;
    else summary.failed += 1;
  }

  return summary;
}
