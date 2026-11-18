/**
 * Copy for the Instagram connect hand-off, shared by the dashboard modal and
 * the onboarding step. It mirrors Meta's Unified Login screens in order, so
 * creators aren't surprised by the portfolio and ad-account pickers.
 */
export const CONNECT_STEPS = [
  "Sign in with Instagram or Facebook",
  "Pick your business portfolio, or create one there",
  "Select your Instagram account",
  "Skip the ad account (optional) and approve",
] as const;

/** What the configuration's three permissions let Auto DM do. */
export const CONNECT_PERMISSIONS = [
  "Read comments on your posts and lives",
  "Send DMs and replies for you",
  "View your basic profile details",
] as const;

/** The two most common reasons a connect works but automations don't. */
export const CONNECT_REQUIREMENT =
  "Needs an Instagram Business or Creator account, with “Allow access to messages” turned on in Instagram settings.";
