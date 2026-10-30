-- Cron-sent DM failures stored only Meta's error message, which Meta
-- translates into the account's language and which drops the error code.
-- Store the raw response body instead, the same shape the webhook stores
-- for live sends ("Instagram API <status>: {json}"), so the dashboard can
-- explain every failure by its code.
--
-- CREATE OR REPLACE keeps the function's existing grants, so it stays
-- revoked from the API roles (see 20261030020000).

create or replace function public.instagram_send_error(
  response net._http_response,
  account_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, net
as $$
declare
  body jsonb;
begin
  if response.status_code between 200 and 299 then
    return null;
  end if;

  if response.timed_out or response.status_code is null then
    return coalesce('Network error: ' || response.error_msg, 'No response from Instagram API');
  end if;

  begin
    body := response.content::jsonb;
  exception when others then
    body := null;
  end;

  if (body->'error'->>'code') = '190' then
    update public.instagram_accounts
      set token_status = 'expired',
          token_error = (body->'error'->>'message') || ' (code 190)'
      where id = account_id
        and token_status = 'active';
  end if;

  return 'Instagram API ' || response.status_code || ': ' || left(response.content, 1000);
end;
$$;
