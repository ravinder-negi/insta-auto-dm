/** Curated accent presets — the admin picks one, never a free hex value, so
 *  every gradient stop can be hand-tuned to actually look good together
 *  instead of derived by a generic hue-rotation formula (which produced
 *  muddy olive/brown mids for some hues). `value` is the flat/500 tone used
 *  for the swatch, nav highlight and button base; `from`/`via`/`to` are the
 *  diagonal-gradient stops for the logo and primary buttons. */
export interface AccentColorOption {
  name: string;
  value: string;
  from: string;
  via: string;
  to: string;
}

export const ACCENT_COLOR_OPTIONS: AccentColorOption[] = [
  {
    name: "Primary (default)",
    value: "#6d5ef6",
    from: "#6366f1",
    via: "#7c3aed",
    to: "#a855f7",
  },
  {
    name: "Ocean",
    value: "#2563eb",
    from: "#3b82f6",
    via: "#2563eb",
    to: "#4f46e5",
  },
  {
    name: "Emerald",
    value: "#059669",
    from: "#10b981",
    via: "#059669",
    to: "#0d9488",
  },
  {
    name: "Sunset",
    value: "#f97316",
    from: "#f59e0b",
    via: "#f97316",
    to: "#ef4444",
  },
  {
    name: "Berry",
    value: "#db2777",
    from: "#ec4899",
    via: "#db2777",
    to: "#be123c",
  },
  {
    name: "Crimson",
    value: "#dc2626",
    from: "#ef4444",
    via: "#dc2626",
    to: "#b91c1c",
  },
  {
    name: "Teal",
    value: "#0891b2",
    from: "#06b6d4",
    via: "#0891b2",
    to: "#0e7490",
  },
  {
    name: "Gold",
    value: "#ca8a04",
    from: "#eab308",
    via: "#ca8a04",
    to: "#a16207",
  },
  {
    name: "Indigo",
    value: "#4338ca",
    from: "#4f46e5",
    via: "#4338ca",
    to: "#3730a3",
  },
  {
    name: "Slate",
    value: "#475569",
    from: "#64748b",
    via: "#475569",
    to: "#334155",
  },
];
