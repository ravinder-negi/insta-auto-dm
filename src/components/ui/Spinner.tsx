export function Spinner({ className = "h-4 w-4 border-current/30 border-t-current" }: { className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 animate-spin rounded-full border-2 ${className}`}
    />
  );
}
