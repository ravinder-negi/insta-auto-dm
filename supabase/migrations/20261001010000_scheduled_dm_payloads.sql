-- The sweep used to send plain text only, so a delayed DM lost its button
-- card and its attachment. Each row now carries the full Instagram message
-- object instead, and a DM with buttons is queued as several rows (text,
-- then card, then attachment) ordered by send_after.
alter table public.scheduled_dms
  add column message_payload jsonb;

create or replace function public.send_scheduled_dms()
returns void
language plpgsql
security definer
set search_path = public, net
as $$
declare
  due record;
begin
  for due in
    select
      d.id,
      d.recipient_ig_id,
      d.recipient_comment_id,
      coalesce(d.message_payload, jsonb_build_object('text', d.message)) as message,
      ia.instagram_user_id,
      ia.access_token
    from public.scheduled_dms d
    join public.instagram_accounts ia
      on ia.id = d.instagram_account_id
    where d.status = 'pending'
      and d.send_after <= now()
      and ia.is_active = true
    order by d.send_after
    limit 200
  loop
    -- Fire-and-forget, like the DM flow sweep: pg_net queues the request
    -- and records the response in net._http_response. A failed send isn't
    -- retried, matching the webhook's own best-effort sends.
    perform net.http_post(
      url := format(
        'https://graph.instagram.com/v26.0/%s/messages',
        due.instagram_user_id
      ),
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || due.access_token,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'recipient',
        case
          when due.recipient_comment_id is not null
            then jsonb_build_object('comment_id', due.recipient_comment_id)
          else jsonb_build_object('id', due.recipient_ig_id)
        end,
        'message', due.message
      )
    );

    update public.scheduled_dms
      set status = 'sent', sent_at = now()
      where id = due.id;
  end loop;
end;
$$;
