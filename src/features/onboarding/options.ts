import type { SocialPlatform } from "@/types";

/** Niches offered on step 1. `value` is what lands in profiles.content_niche —
 *  keep the slugs stable, labels and order are free to change. Ordered so the
 *  broad niches sit near the top of each column rather than grouping by theme. */
export const CONTENT_NICHES = [
  { value: "entertainment_media", label: "Entertainment & Media", emoji: "🍿" },
  { value: "gaming", label: "Gaming", emoji: "🎮" },
  { value: "finance_trading", label: "Finance & Trading", emoji: "💰" },
  { value: "coaching", label: "Coaching", emoji: "🎤" },
  { value: "medical", label: "Medical", emoji: "🩺" },
  { value: "digital_marketing", label: "Digital Marketing", emoji: "📊" },
  { value: "travel_hospitality", label: "Travel / Hospitality", emoji: "✈️" },
  { value: "food_cooking", label: "Food & Cooking", emoji: "🍳" },
  { value: "education_career", label: "Education & Career", emoji: "🎓" },
  {
    value: "beauty_personal_care",
    label: "Beauty & Personal Care",
    emoji: "💄",
  },
  { value: "real_estate", label: "Real Estate", emoji: "🏠" },
  { value: "technology_it", label: "Technology & IT", emoji: "💻" },
  {
    value: "astrology_numerology",
    label: "Astrology / Numerology",
    emoji: "🔮",
  },
  { value: "design_arts", label: "Design & Arts", emoji: "🎨" },
  { value: "photography_video", label: "Photography & Video", emoji: "📸" },
  { value: "law_legal", label: "Law & Legal Services", emoji: "📓" },
  { value: "music_audio", label: "Music & Audio", emoji: "🎵" },
  { value: "fitness_nutrition", label: "Fitness & Nutrition", emoji: "💪" },
  { value: "other", label: "Other", emoji: "✨" },
] as const;

/** Email is a contact channel, not a place content gets posted — the rest of
 *  SOCIAL_PLATFORMS carries over from the socials feature. */
export const ONBOARDING_SOCIAL_PLATFORMS: SocialPlatform[] = [
  "instagram",
  "youtube",
  "facebook",
  "x",
  "tiktok",
  "linkedin",
];

/** Step 2. `tailoring` is what we actually reorder in the dashboard for the
 *  goal — our own promise, shown on the wide layout. */
export const ONBOARDING_GOALS = [
  {
    value: "grow_audience",
    title: "Grow my followers & audience on Instagram",
    description: "Get real followers and increase engagement.",
    emoji: "📈",
    tailoring: [
      "Follow-gate before the DM goes out",
      "Comment AutoDMs and lead magnets up front",
    ],
  },
  {
    value: "sell_products",
    title: "Sell digital products or services to my audience",
    description: "Promote and sell your products, courses, or services.",
    emoji: "🛍️",
    tailoring: [
      "Products and checkout links up front",
      "DM flows that pitch and close",
    ],
  },
  {
    value: "get_leads",
    title: "Get more leads and customers",
    description: "Collect leads and grow my business.",
    emoji: "👥",
    tailoring: [
      "Email collection inside every DM flow",
      "Lead magnets and a leads inbox up front",
    ],
  },
] as const;
