type IconProps = { className?: string };

function Stroke({
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </Stroke>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </Stroke>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Stroke>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M21 20H3" />
    </Stroke>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </Stroke>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 5v14M5 12h14" />
    </Stroke>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Stroke>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="m6 9 6 6 6-6" />
    </Stroke>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </Stroke>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Stroke>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </Stroke>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M7 4.5 19 12 7 19.5z" />
    </Stroke>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M4 7h16" />
      <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M6.5 7 7.3 19a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
      <path d="M10.5 11v5.5M13.5 11v5.5" />
    </Stroke>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
      <path d="m14.5 6.5 3 3" />
    </Stroke>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5.5 15A2.5 2.5 0 0 1 4 12.7V6a2 2 0 0 1 2-2h6.7A2.5 2.5 0 0 1 15 5.5" />
    </Stroke>
  );
}

export function DotsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={props.className} fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5.5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="18.5" r="1.6" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5" />
      <path d="M13.7 19a2 2 0 0 1-3.4 0" />
    </Stroke>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Stroke>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </Stroke>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4 20l1.3-4.1A7.5 7.5 0 1 1 20 12z" />
    </Stroke>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6" />
      <path d="M17.5 14.2a5.5 5.5 0 0 1 3 4.8" />
    </Stroke>
  );
}

export function TrendingIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="m3 16 5.5-5.5 3.5 3.5L21 5" />
      <path d="M15.5 5H21v5.5" />
    </Stroke>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M21 3 10.5 13.5" />
      <path d="M21 3 14.5 21l-4-7.5L3 9.5z" />
    </Stroke>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="m12 3 9 4.5-9 4.5-9-4.5z" />
      <path d="m3 12.5 9 4.5 9-4.5" />
      <path d="m3 17 9 4.5L21 17" />
    </Stroke>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 9v4" />
      <path d="M10.3 3.9 1.8 18a1.5 1.5 0 0 0 1.3 2.2h17.8a1.5 1.5 0 0 0 1.3-2.2L13.7 3.9a1.5 1.5 0 0 0-2.6 0z" />
      <circle cx="12" cy="16.5" r="0.5" fill="currentColor" stroke="none" />
    </Stroke>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Stroke>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Stroke>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
    </Stroke>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Stroke>
  );
}

export function EmojiIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
      <circle cx="9.3" cy="9.8" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.7" cy="9.8" r="0.6" fill="currentColor" stroke="none" />
    </Stroke>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="9.5" r="1.4" />
      <path d="m4 17 4.8-4.5a2 2 0 0 1 2.7 0L20 20" />
    </Stroke>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M6 3.5h12v17l-2.5-1.5L13 20.5 10.5 19 8 20.5 6 19z" />
      <path d="M9.5 8.5h5M9.5 12.5h5" />
    </Stroke>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function SignOutIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </Stroke>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 20.5s-7.5-4.6-9.8-9.3C.8 8 2.3 4.8 5.5 4.1c2-.4 3.9.5 5 2.1 1.1-1.6 3-2.5 5-2.1 3.2.7 4.7 3.9 3.3 7.1-2.3 4.7-9.8 9.3-9.8 9.3z" />
    </Stroke>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 3.5 19 6v5.5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" />
      <path d="m9 12 2 2 4-4.2" />
    </Stroke>
  );
}

export function InfinityIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M6.5 8.5a3.5 3.5 0 1 0 0 7c2.5 0 4-2 5.5-3.5S15.5 8.5 18 8.5a3.5 3.5 0 1 1 0 7c-2.5 0-4-2-5.5-3.5S9.5 8.5 7 8.5" />
    </Stroke>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={props.className} fill="currentColor" aria-hidden="true">
      <path d="M11 2.5 12.4 9l6.6 1.5-6.6 1.5L11 18.5 9.6 12 3 10.5 9.6 9z" />
      <path d="M18.5 15.5 19.2 18l2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M5 4.5h3.2L9.7 8 8 9.5a9 9 0 0 0 5.5 5.5L15 13.3l3.5 1.5V18a1.5 1.5 0 0 1-1.6 1.5A15 15 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z" />
    </Stroke>
  );
}

export function VideoCameraIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="3" y="6.5" width="12" height="11" rx="2" />
      <path d="m15 10.5 6-3.2v9.4l-6-3.2" />
    </Stroke>
  );
}

export function PaperclipIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M16.5 7.5 9 15a3 3 0 0 0 4.2 4.2l7-7a5 5 0 0 0-7-7l-7 7a1.8 1.8 0 0 0 2.5 2.5l6.3-6.3" />
    </Stroke>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r="0.6" fill="currentColor" stroke="none" />
    </Stroke>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="9.5" y="3" width="5" height="10" rx="2.5" />
      <path d="M6 11.5a6 6 0 0 0 12 0" />
      <path d="M12 17.5V21M9 21h6" />
    </Stroke>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h1.8l1-1.6h7.4l1 1.6h1.8A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="13" r="3.2" />
    </Stroke>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Stroke>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 6.5 8 6 8-6" />
    </Stroke>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </Stroke>
  );
}

export function DotsHorizontalIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={props.className} fill="currentColor" aria-hidden="true">
      <circle cx="5.5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18.5" cy="12" r="1.6" />
    </svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="m3 11 17-8-8 17-2.5-7L3 11z" />
    </Stroke>
  );
}

export function BookmarkIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M6 4h12v16l-6-4.5L6 20V4z" />
    </Stroke>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 12.5 5a3.5 3.5 0 0 1 5 5L16 11.5" />
      <path d="M13 17.5 11.5 19a3.5 3.5 0 0 1-5-5L8 12.5" />
    </Stroke>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.3 3.6 5 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5-3.6-8.5S9.6 5.8 12 3.5z" />
    </Stroke>
  );
}

export function YoutubeIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="3" y="6" width="18" height="12" rx="3.5" />
      <path d="m10.5 9.5 5 2.5-5 2.5v-5z" fill="currentColor" stroke="none" />
    </Stroke>
  );
}

export function DesktopIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </Stroke>
  );
}

export function MobileIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </Stroke>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M9.5 14.5 20 4" />
      <path d="M13 4h7v7" />
      <path d="M18.5 13v5A2.5 2.5 0 0 1 16 20.5H6A2.5 2.5 0 0 1 3.5 18V8A2.5 2.5 0 0 1 6 5.5h5" />
    </Stroke>
  );
}

export function LinkedInIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M6.94 8.5v10.5H3.6V8.5zM5.27 3.5a1.94 1.94 0 1 1 0 3.88 1.94 1.94 0 0 1 0-3.88z" />
      <path d="M9.3 8.5h3.2v1.44a3.5 3.5 0 0 1 3.15-1.73c3.37 0 4 2.22 4 5.1V19h-3.34v-5.02c0-1.2-.02-2.74-1.67-2.74s-1.93 1.3-1.93 2.65V19H9.3z" />
    </svg>
  );
}

export function GripIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={props.className} fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z" />
      <path d="M14 3.5V8h4" />
      <path d="M8.5 13h7M8.5 16.5h7" />
    </Stroke>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M14.5 8.2h2.3V5.1h-2.5c-2.4 0-4 1.5-4 4v2h-2.1v3.1h2.1V21h3.1v-6.8h2.3l.4-3.1h-2.7v-1.6c0-.85.28-1.3 1.1-1.3z"
        fill="currentColor"
      />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M5 4.5h3.6l4 5.4 4.6-5.4h2l-5.7 6.6 6.2 8.4h-3.6l-4.4-6-5 6h-2l6.1-7.2z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M15 3v9.8a2.7 2.7 0 1 1-2.2-2.65v-2.2a4.9 4.9 0 1 0 4.2 4.85v-5a6 6 0 0 0 3.5 1.1V6.7A3.9 3.9 0 0 1 17 3z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PaletteIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1 0 1.7-.8 1.7-1.7 0-.45-.18-.85-.46-1.14-.28-.3-.46-.7-.46-1.14 0-.9.72-1.62 1.62-1.62h1.6a3.5 3.5 0 0 0 3.5-3.5c0-4.14-3.5-7.9-7.5-7.9z" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="7.3" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="7.3" r="1" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="11" r="1" fill="currentColor" stroke="none" />
    </Stroke>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 3.5v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M5 17.5v1.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5" />
    </Stroke>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 15.5v-11" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M5 17.5v1.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5" />
    </Stroke>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="4" y="9.5" width="16" height="10.5" rx="1.5" />
      <path d="M4 13h16" />
      <path d="M12 9.5v10.5" />
      <path d="M12 9.5H8.3a2.35 2.35 0 1 1 0-4.7c2.6 0 3.7 2.6 3.7 4.7z" />
      <path d="M12 9.5h3.7a2.35 2.35 0 1 0 0-4.7c-2.6 0-3.7 2.6-3.7 4.7z" />
    </Stroke>
  );
}

export function ShoppingBagIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M7 8.5V6.5a5 5 0 0 1 10 0v2" />
      <path d="M5.5 8.5h13l.9 11.2a1.5 1.5 0 0 1-1.5 1.8H6.1a1.5 1.5 0 0 1-1.5-1.8z" />
    </Stroke>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="m12 3.5 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z"
        fill="currentColor"
      />
    </svg>
  );
}
