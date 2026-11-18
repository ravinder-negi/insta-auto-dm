-- ============================================================
-- Deleting a user must take their Instagram accounts (and the access tokens
-- on them) with it. profile_id was ON DELETE SET NULL, which left ownerless
-- rows holding live tokens behind. The delete-account action removes them
-- explicitly too; this is the safety net for any other path.
-- ============================================================

-- Rows already orphaned by the old rule have no owner to act for.
delete from public.instagram_accounts where profile_id is null;

alter table public.instagram_accounts
  drop constraint instagram_accounts_profile_id_fkey;

alter table public.instagram_accounts
  add constraint instagram_accounts_profile_id_fkey
    foreign key (profile_id)
    references public.profiles(id)
    on delete cascade;
