"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { SearchField, SelectField } from "@/components/ui/controls";
import { AutomationStatusChips, type AutomationStatusFilter } from "@/components/ui/AutomationStatusChips";
import { formatDate, formatTime } from "@/lib/utils/format";
import {
  BoltIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  EyeIcon,
  GridIcon,
  InstagramIcon,
  ListIcon,
  MailIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { deleteRule, deleteRules, duplicateRule, toggleRuleActive } from "@/features/rules/actions";
import { NewRuleButton } from "./NewRuleButton";
import { RuleFormModal } from "./RuleFormModal";
import { saveViewPreference } from "@/lib/viewPreference/client";
import { VIEW_PREFERENCE_KEYS } from "@/lib/viewPreference/keys";

const KEYWORD_PREVIEW_LIMIT = 3;

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export interface RuleTableRow {
  id: string;
  name: string;
  triggerType: string;
  keywordMatch: "specific" | "any";
  keywords: string[];
  instagram_media_id: string | null;
  instagram_media_shortcode: string | null;
  require_follow: boolean;
  dm_message: string;
  is_active: boolean;
  created_at: string;
  accountId: string | null;
  accountHandle: string;
  accountActive: boolean;
}

export interface AccountFilterOption {
  id: string;
  handle: string;
}

type ViewMode = "card" | "list";

const VIEW_STORAGE_KEY = VIEW_PREFERENCE_KEYS.rules;

const STATUS_META: Record<
  "active" | "paused" | "disabled",
  { label: string; bg: string; fg: string; dot: string }
> = {
  active: { label: "Active", bg: "var(--success-tint)", fg: "var(--success-text)", dot: "var(--success)" },
  paused: { label: "Paused", bg: "var(--warning-tint)", fg: "var(--warning-text)", dot: "var(--warning)" },
  disabled: { label: "Account paused", bg: "var(--danger-tint)", fg: "var(--danger-deep)", dot: "var(--danger)" },
};

function ruleStatus(rule: RuleTableRow): "active" | "paused" | "disabled" {
  if (!rule.accountActive) return "disabled";
  return rule.is_active ? "active" : "paused";
}

function StatusPill({ status }: { status: "active" | "paused" | "disabled" }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
      style={{ backgroundColor: m.bg, color: m.fg }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "animate-pulse-soft" : ""}`}
        style={{ backgroundColor: m.dot }}
      />
      {m.label}
    </span>
  );
}

function KeywordChip({ rule }: { rule: RuleTableRow }) {
  if (rule.keywordMatch === "any") {
    return (
      <span
        className="rounded-full px-3 py-1 text-sm font-bold"
        style={{ backgroundColor: "var(--neutral-tint)", color: "var(--neutral-text)" }}
      >
        Any comment
      </span>
    );
  }
  const shown = rule.keywords.slice(0, KEYWORD_PREVIEW_LIMIT);
  const hidden = rule.keywords.length - shown.length;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {shown.map((keyword) => (
        <span
          key={keyword}
          className="rounded-full px-3 py-1 text-sm font-bold"
          style={{ backgroundColor: "var(--tint2)", color: "var(--violet)" }}
        >
          {keyword}
        </span>
      ))}
      {hidden > 0 && (
        <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: "var(--neutral-tint)", color: "var(--neutral-text)" }}>
          +{hidden}
        </span>
      )}
    </span>
  );
}

function targetLabel(rule: RuleTableRow) {
  if (rule.instagram_media_id) return rule.instagram_media_id;
  if (rule.instagram_media_shortcode) return rule.instagram_media_shortcode;
  if (rule.triggerType === "story_reply") return "Any story";
  if (rule.triggerType === "post_share") return "Any post/reel";
  if (rule.triggerType === "dm_keyword") return "Direct messages";
  return "All posts";
}

const iconButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-full border transition-colors";
const iconButtonStyle = { borderColor: "var(--line)", backgroundColor: "#fff", color: "var(--ink)" };
const iconButtonDangerStyle = { borderColor: "var(--danger-border)", backgroundColor: "#fff", color: "var(--danger-strong)" };

function ToggleSwitch({ isActive }: { isActive: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      role="switch"
      aria-checked={isActive}
      disabled={pending}
      aria-label={isActive ? "Pause this AutoDM" : "Activate this AutoDM"}
      title={isActive ? "Pause AutoDM" : "Activate AutoDM"}
      className="flex h-[34px] w-[56px] shrink-0 items-center rounded-full p-1 transition-colors disabled:opacity-60"
      style={{ backgroundColor: isActive ? "var(--success)" : "var(--secondary-pale)" }}
    >
      {pending ? (
        <span className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
      ) : (
        <span
          className="h-[26px] w-[26px] rounded-full bg-white shadow transition-transform"
          style={{ transform: isActive ? "translateX(22px)" : "translateX(0)" }}
        />
      )}
    </button>
  );
}

function DuplicateButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" title="Duplicate AutoDM" aria-label="Duplicate AutoDM" disabled={pending} className={iconButtonClass} style={iconButtonStyle}>
      {pending ? <Spinner className="h-4 w-4 border-current/30 border-t-current" /> : <CopyIcon className="h-4 w-4" />}
    </button>
  );
}

function SelectBox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <span className="relative inline-flex h-[18px] w-[18px] shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer h-full w-full cursor-pointer appearance-none rounded-[6px] border-[1.5px] bg-white transition-colors hover:border-[var(--primary)] checked:border-[var(--primary)] checked:bg-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        style={{ borderColor: checked ? undefined : "var(--secondary-border)" }}
      />
      <CheckIcon className="pointer-events-none absolute top-1/2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
    </span>
  );
}

function RuleActions({
  rule,
  onToggle,
  onPreview,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  rule: RuleTableRow;
  onToggle: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" title="Preview DM" aria-label={`Preview DM for ${rule.name}`} onClick={onPreview} className={iconButtonClass} style={iconButtonStyle}>
        <EyeIcon className="h-4 w-4" />
      </button>
      <button type="button" title="Edit AutoDM" aria-label={`Edit ${rule.name}`} onClick={onEdit} className={iconButtonClass} style={iconButtonStyle}>
        <PencilIcon className="h-4 w-4" />
      </button>
      <form action={onDuplicate}>
        <DuplicateButton />
      </form>
      <Link
        href={`/dashboard/rules/${rule.id}/leads`}
        title="View collected emails"
        aria-label={`View emails collected by ${rule.name}`}
        className={iconButtonClass}
        style={iconButtonStyle}
      >
        <MailIcon className="h-4 w-4" />
      </Link>
      <ConfirmAction
        action={async () => onDelete()}
        title="Delete this AutoDM?"
        description={`"${rule.name}" will stop replying to comments. This can't be undone.`}
        confirmLabel="Delete AutoDM"
        trigger={
          <button type="button" title="Delete AutoDM" aria-label={`Delete ${rule.name}`} className={iconButtonClass} style={iconButtonDangerStyle}>
            <TrashIcon className="h-4 w-4" />
          </button>
        }
      />
      <span className="flex-1" />
      <form action={onToggle}>
        <ToggleSwitch isActive={rule.is_active} />
      </form>
    </div>
  );
}

export function RulesTable({
  rules,
  accounts,
  initialView = "card",
}: {
  rules: RuleTableRow[];
  accounts: AccountFilterOption[];
  initialView?: ViewMode;
}) {
  const [query, setQuery] = useState("");
  const [accountId, setAccountId] = useState("all");
  const [status, setStatus] = useState<AutomationStatusFilter>("all");
  const [editRuleId, setEditRuleId] = useState<string | null>(null);
  const [previewRuleId, setPreviewRuleId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>(initialView);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastShown = useRef(false);

  useEffect(() => {
    if (toastShown.current) return;
    if (!searchParams.has("created") && !searchParams.has("updated")) return;
    toastShown.current = true;
    toast.success(searchParams.has("created") ? "AutoDM created." : "AutoDM updated.");
    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);


  function handleViewChange(next: ViewMode) {
    setView(next);
    saveViewPreference(VIEW_STORAGE_KEY, next);
  }

  async function handleToggle(id: string, name: string, nextActive: boolean) {
    try {
      await toggleRuleActive(id, nextActive);
      toast.success(`"${name}" ${nextActive ? "activated" : "paused"}.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update AutoDM."));
    }
  }

  async function handleDuplicate(id: string, name: string) {
    try {
      await duplicateRule(id);
      toast.success(`Duplicated "${name}".`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to duplicate AutoDM."));
    }
  }

  async function handleDelete(id: string, name: string) {
    try {
      await deleteRule(id);
      toast.success(`"${name}" deleted.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete AutoDM."));
    }
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete(ids: string[]) {
    try {
      await deleteRules(ids);
      toast.success(`${ids.length} AutoDM${ids.length === 1 ? "" : "s"} deleted.`);
      setSelected(new Set());
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete AutoDMs."));
    }
  }

  const counts = useMemo(() => {
    const result = { all: rules.length, active: 0, paused: 0, disabled: 0 };
    for (const rule of rules) result[ruleStatus(rule)] += 1;
    return result;
  }, [rules]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rules.filter((rule) => {
      if (status !== "all" && ruleStatus(rule) !== status) return false;
      if (accountId !== "all" && rule.accountId !== accountId) return false;
      if (!needle) return true;
      return `${rule.name} ${rule.keywords.join(" ")} ${rule.accountHandle}`
        .toLowerCase()
        .includes(needle);
    });
  }, [rules, query, accountId, status]);

  // Only rules still on the page count — a filter change or a delete elsewhere
  // can leave stale ids in the set.
  const selectedIds = visible.filter((rule) => selected.has(rule.id)).map((rule) => rule.id);
  const allSelected = visible.length > 0 && selectedIds.length === visible.length;

  const previewRule = rules.find((rule) => rule.id === previewRuleId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AutomationStatusChips counts={counts} value={status} onChange={setStatus} />

        <div className="flex flex-wrap items-center gap-2">
          <SearchField value={query} onChange={setQuery} placeholder="Search AutoDMs..." className="sm:w-48" />
          <SelectField
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            aria-label="Filter by account"
            icon={<InstagramIcon className="h-4 w-4" />}
            className="sm:w-40"
          >
            <option value="all">All accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                @{account.handle}
              </option>
            ))}
          </SelectField>
          <div className="inline-flex rounded-full border p-1" style={{ borderColor: "var(--line)", backgroundColor: "#fff" }}>
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={view === "card"}
              onClick={() => handleViewChange("card")}
              className="flex h-9 w-10 items-center justify-center rounded-full transition-colors"
              style={{ backgroundColor: view === "card" ? "var(--ink)" : "transparent", color: view === "card" ? "#fff" : "var(--ink)" }}
            >
              <GridIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => handleViewChange("list")}
              className="flex h-9 w-10 items-center justify-center rounded-full transition-colors"
              style={{ backgroundColor: view === "list" ? "var(--ink)" : "transparent", color: view === "list" ? "#fff" : "var(--ink)" }}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
          <NewRuleButton className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full bg-[var(--primary)] px-6 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5">
            <PlusIcon className="h-4 w-4" />
            New rule
          </NewRuleButton>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3"
          style={{ borderColor: "var(--primary)", backgroundColor: "var(--tint-faint)" }}
        >
          <SelectBox
            checked={allSelected}
            label="Select all shown AutoDMs"
            onChange={() =>
              setSelected(allSelected ? new Set() : new Set(visible.map((rule) => rule.id)))
            }
          />
          <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            {selectedIds.length} selected
          </span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="rounded-full border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: "var(--line)", backgroundColor: "#fff", color: "var(--ink)" }}
          >
            Clear
          </button>
          <ConfirmAction
            action={() => handleBulkDelete(selectedIds)}
            title={`Delete ${selectedIds.length} AutoDM${selectedIds.length === 1 ? "" : "s"}?`}
            description="They will stop replying to comments. This can't be undone."
            confirmLabel={`Delete ${selectedIds.length}`}
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: "var(--danger-border)", backgroundColor: "#fff", color: "var(--danger-strong)" }}
              >
                <TrashIcon className="h-4 w-4" />
                Delete selected
              </button>
            }
          />
        </div>
      )}

      {visible.length === 0 ? (
        <p
          className="flex items-center justify-center gap-2 rounded-2xl border px-5 py-14 text-sm"
          style={{ borderColor: "var(--line)", color: "var(--muted)" }}
        >
          <SearchIcon className="h-4 w-4" />
          No AutoDMs match the current filters.
        </p>
      ) : view === "card" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((rule) => {
            const rStatus = ruleStatus(rule);
            return (
              <div
                key={rule.id}
                className="flex flex-col gap-4.5 rounded-[30px] border p-5.5"
                style={{ borderColor: "var(--line)", backgroundColor: "#fff" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <SelectBox
                      checked={selected.has(rule.id)}
                      label={`Select ${rule.name}`}
                      onChange={() => toggleSelected(rule.id)}
                    />
                    <StatusPill status={rStatus} />
                  </span>
                  <form action={() => handleToggle(rule.id, rule.name, !rule.is_active)}>
                    <ToggleSwitch isActive={rule.is_active} />
                  </form>
                </div>

                <div>
                  <h3 className="text-[22px] leading-tight font-extrabold tracking-tight" style={{ color: "var(--ink)" }}>
                    {rule.name}
                  </h3>
                  <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                    Created {formatDate(rule.created_at)} · {formatTime(rule.created_at)}
                  </div>
                </div>

                <div className="rounded-[22px] border p-4.5" style={{ borderColor: "var(--line)", backgroundColor: "var(--bg)" }}>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-2xl text-white"
                      style={{ backgroundColor: "var(--primary)" }}
                    >
                      <BoltIcon className="h-5 w-5" />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                        When a comment contains
                      </span>
                      <KeywordChip rule={rule} />
                    </span>
                  </div>
                  <div className="relative ml-5 h-6.5 w-0.5" style={{ backgroundColor: "#CFC6F5" }} />
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-2xl text-white"
                      style={{ backgroundColor: "var(--violet)" }}
                    >
                      <BoltIcon className="h-5 w-5" />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                        Send an automatic DM from
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-bold">
                        <Avatar name={rule.accountHandle} size="sm" muted={!rule.accountActive} />@{rule.accountHandle}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="font-semibold">Post ID</span>
                  <span className="truncate font-mono" style={{ color: "var(--ink)" }} title={targetLabel(rule)}>
                    {targetLabel(rule)}
                  </span>
                </div>

                <div className="flex items-center gap-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
                  <RuleActions
                    rule={rule}
                    onToggle={() => handleToggle(rule.id, rule.name, !rule.is_active)}
                    onPreview={() => setPreviewRuleId(rule.id)}
                    onEdit={() => setEditRuleId(rule.id)}
                    onDuplicate={() => handleDuplicate(rule.id, rule.name)}
                    onDelete={() => handleDelete(rule.id, rule.name)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((rule) => {
            const rStatus = ruleStatus(rule);
            return (
              <div
                key={rule.id}
                className="flex flex-wrap items-center gap-4 rounded-[24px] border p-4"
                style={{ borderColor: "var(--line)", backgroundColor: "#fff" }}
              >
                <div className="flex min-w-0 flex-1 basis-[220px] items-center gap-3.5">
                  <SelectBox
                    checked={selected.has(rule.id)}
                    label={`Select ${rule.name}`}
                    onChange={() => toggleSelected(rule.id)}
                  />
                  <span
                    className="flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: "var(--tint2)", color: "var(--violet)" }}
                  >
                    <BoltIcon className="h-5 w-5" />
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-base font-bold">{rule.name}</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {formatDate(rule.created_at)} · {formatTime(rule.created_at)}
                    </span>
                  </span>
                </div>
                <KeywordChip rule={rule} />
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Avatar name={rule.accountHandle} size="sm" muted={!rule.accountActive} />@{rule.accountHandle}
                </span>
                <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>
                  {targetLabel(rule)}
                </span>
                <StatusPill status={rStatus} />
                <RuleActions
                  rule={rule}
                  onToggle={() => handleToggle(rule.id, rule.name, !rule.is_active)}
                  onPreview={() => setPreviewRuleId(rule.id)}
                  onEdit={() => setEditRuleId(rule.id)}
                  onDuplicate={() => handleDuplicate(rule.id, rule.name)}
                  onDelete={() => handleDelete(rule.id, rule.name)}
                />
              </div>
            );
          })}
        </div>
      )}

      {editRuleId && (
        <RuleFormModal
          ruleId={editRuleId}
          onClose={() => setEditRuleId(null)}
          onSaved={() => {
            setEditRuleId(null);
            toast.success("AutoDM updated.");
            router.refresh();
          }}
        />
      )}

      {previewRule && (
        <RulePreviewDrawer rule={previewRule} onClose={() => setPreviewRuleId(null)} onEdit={() => {
          setEditRuleId(previewRule.id);
          setPreviewRuleId(null);
        }} />
      )}
    </div>
  );
}

function RulePreviewDrawer({
  rule,
  onClose,
  onEdit,
}: {
  rule: RuleTableRow;
  onClose: () => void;
  onEdit: () => void;
}) {
  const status = ruleStatus(rule);
  const m = STATUS_META[status];
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close preview"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="AutoDM preview"
        className="animate-fade-in-up relative flex h-full w-full max-w-[440px] flex-col gap-5.5 overflow-y-auto bg-white p-7 shadow-[-30px_0_80px_-30px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--muted)" }}>
              DM preview
            </div>
            <h3 className="mt-1 truncate text-[28px] leading-tight font-extrabold tracking-tight">{rule.name}</h3>
          </div>
          <button type="button" aria-label="Close preview" onClick={onClose} className={iconButtonClass} style={iconButtonStyle}>
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-[28px] border p-5" style={{ borderColor: "#E1D9FB", backgroundColor: "var(--secondary-soft-bg)" }}>
          <div className="flex items-center gap-2.5 rounded-2xl border bg-white p-3.5" style={{ borderColor: "var(--line)" }}>
            <span className="min-w-0 text-sm leading-snug">
              <span style={{ color: "var(--muted)" }}>Comment contains</span>
              <br />
              <strong className="break-words">
                {rule.keywordMatch === "any" ? "any comment" : rule.keywords.join(", ") || "—"}
              </strong>
            </span>
          </div>
          <div className="text-center text-xs font-semibold" style={{ color: "var(--muted)" }}>
            Auto DM from @{rule.accountHandle}
          </div>
          <div
            className="max-w-[90%] self-start rounded-[20px] rounded-bl-md border bg-white p-3.5 text-[15px] leading-snug break-words"
            style={{ borderColor: "var(--line)" }}
          >
            {rule.dm_message || "No message set yet."}
          </div>
        </div>

        <div className="flex flex-col">
          {[
            ["Status", <StatusPill key="s" status={status} />],
            ["Keyword", <strong key="k">{rule.keywordMatch === "any" ? "Any comment" : rule.keywords.join(", ")}</strong>],
            ["Account", <strong key="a">@{rule.accountHandle}</strong>],
            [
              "Post ID",
              <span key="t" className="truncate font-mono text-sm">
                {targetLabel(rule)}
              </span>,
            ],
            ["Created", <span key="c">{formatDate(rule.created_at)} · {formatTime(rule.created_at)}</span>],
          ].map(([label, value], i, arr) => (
            <div
              key={label as string}
              className={`flex items-center justify-between gap-3 py-3 ${i === arr.length - 1 ? "border-t border-b" : "border-t"}`}
              style={{ borderColor: "var(--line)" }}
            >
              <span style={{ color: "var(--muted)" }}>{label}</span>
              {value}
            </div>
          ))}
        </div>

        <div className="mt-auto flex gap-2.5">
          <button
            type="button"
            onClick={onEdit}
            className="flex min-h-[52px] flex-1 items-center justify-center rounded-full font-bold text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Edit rule
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[52px] rounded-full border px-6 font-semibold"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            Close
          </button>
        </div>
        <p className="sr-only">{m.label}</p>
      </aside>
    </div>
  );
}
