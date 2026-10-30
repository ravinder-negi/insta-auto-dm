/**
 * Turns a stored send error into something a creator can act on.
 *
 * Errors are stored raw, e.g. `Instagram API 403: {"error":{"message":
 * "...","code":10,"error_subcode":2534022}}`. Meta translates `message`
 * into the account's language, so matching goes by code and subcode, which
 * never change.
 */

export interface SendErrorExplanation {
  title: string;
  hint: string | null;
  /** The stored error, for the "Technical details" disclosure. */
  raw: string;
}

interface Rule {
  code?: number;
  subcode?: number;
  title: string;
  hint: string | null;
}

// Most specific first: a code+subcode rule wins over a code-only one.
const RULES: Rule[] = [
  {
    code: 10,
    subcode: 2534022,
    title: "Outside Instagram's 24-hour messaging window",
    hint: "Instagram only allows DMs within 24 hours of the person's last message to you, so nothing can be sent until they message again.",
  },
  {
    code: 100,
    subcode: 2534080,
    title: "Instagram doesn't support this attachment",
    hint: "Use a JPG or PNG image, an MP4 video, or a PDF, then edit the automation and upload it again.",
  },
  {
    code: 100,
    subcode: 2534014,
    title: "This person can't be found",
    hint: "Their account was deleted or deactivated, or they blocked you.",
  },
  {
    code: 551,
    title: "This person isn't available",
    hint: "They've blocked messages from your account or restricted who can DM them.",
  },
  {
    code: 190,
    title: "Instagram connection expired",
    hint: "Reconnect the account on the Accounts page to start sending again.",
  },
  {
    code: 200,
    title: "Missing Instagram permission",
    hint: "Reconnect the account on the Accounts page and keep every permission switched on.",
  },
  {
    code: 4,
    title: "Instagram rate limit reached",
    hint: "Too many messages went out in a short time. Sending resumes on its own shortly.",
  },
  {
    code: 613,
    title: "Instagram rate limit reached",
    hint: "Too many messages went out in a short time. Sending resumes on its own shortly.",
  },
  {
    code: 1,
    title: "Temporary problem on Instagram's side",
    hint: "Instagram couldn't process the message right then. Later triggers usually go through.",
  },
  {
    code: 2,
    title: "Temporary problem on Instagram's side",
    hint: "Instagram couldn't process the message right then. Later triggers usually go through.",
  },
];

/** Failures recorded by our own code rather than by Instagram. */
const OWN_ERRORS: { prefix: string; title: string; hint: string | null }[] = [
  {
    prefix: "Canceled: more than 24 hours overdue",
    title: "Canceled: more than a day late",
    hint: "The account was paused or disconnected when this DM was due, so it was dropped instead of arriving days late.",
  },
  {
    prefix: "No response from Instagram API",
    title: "No answer from Instagram",
    hint: "The request went out but Instagram never replied, so delivery couldn't be confirmed.",
  },
  {
    prefix: "Network error",
    title: "Couldn't reach Instagram",
    hint: "A network problem stopped the message from going out.",
  },
];

function readCode(raw: string, field: "code" | "error_subcode"): number | undefined {
  const match = raw.match(new RegExp(`"${field}"\\s*:\\s*(\\d+)`));
  return match ? Number(match[1]) : undefined;
}

export function explainSendError(raw: string | null | undefined): SendErrorExplanation | null {
  if (!raw?.trim()) return null;

  const own = OWN_ERRORS.find((error) => raw.startsWith(error.prefix));
  if (own) return { title: own.title, hint: own.hint, raw };

  const code = readCode(raw, "code");
  const subcode = readCode(raw, "error_subcode");

  if (code !== undefined) {
    const rule =
      RULES.find((r) => r.code === code && r.subcode !== undefined && r.subcode === subcode) ??
      RULES.find((r) => r.code === code && r.subcode === undefined);
    if (rule) return { title: rule.title, hint: rule.hint, raw };
  }

  return {
    title: raw.startsWith("Instagram API") ? "Instagram rejected this message" : "Something went wrong",
    hint: null,
    raw,
  };
}
