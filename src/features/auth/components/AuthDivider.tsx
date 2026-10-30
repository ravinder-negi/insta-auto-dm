export function AuthDivider() {
  return (
    <div className="flex items-center gap-3.5">
      <div className="h-px flex-1 bg-[var(--line)]" />
      <span className="text-[13px] font-semibold text-[var(--muted)]">OR</span>
      <div className="h-px flex-1 bg-[var(--line)]" />
    </div>
  );
}
