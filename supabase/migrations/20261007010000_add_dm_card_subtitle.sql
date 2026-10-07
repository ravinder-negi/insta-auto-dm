-- Generic template subtitle: an authored caption shown on the button card
-- alongside its title, independent of the DM text (e.g. a product image
-- card with its own headline and subheading, like "Cards to Uplift &
-- Inspire" / "Explore our catalog"). When set, the DM text always goes out
-- as its own message, since it's no longer the card's copy.
alter table public.automation_rules
  add column if not exists dm_card_subtitle text;
