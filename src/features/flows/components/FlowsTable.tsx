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
  CheckIcon,
  CloseIcon,
  EyeIcon,
  GridIcon,
  InstagramIcon,
  LayersIcon,
  ListIcon,
  MailIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import { useToast } from "@/components/ui/Toast";
import { deleteFlow, deleteFlows, toggleFlowActive } from "@/features/flows/actions";
import type { KeywordMatch } from "@/types";
import { FlowFormModal } from "./FlowFormModal";
import { NewFlowButton } from "./NewFlowButton";
import { saveViewPreference } from "@/lib/viewPreference/client";
import { VIEW_PREFERENCE_KEYS } from "@/lib/viewPreference/keys";

const KEYWORD_PREVIEW_LIMIT = 3;

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export interface FlowTableRow {
  id: string;
  name: string;
  keywordMatch: KeywordMatch;
  keywords: string[];
  instagram_media_id: string | null;
  step_count: number;
  firstMessage: string | null;
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

const VIEW_STORAGE_KEY = VIEW_PREFERENCE_KEYS.flows;

const STATUS_META: Record<
  "active" | "paused" | "disabled",
  { label: string; bg: string; fg: string; dot: string }
> = {
  active: { label: "Active", bg: "var(--success-tint)", fg: "var(--success-text)", dot: "var(--success)" },
  paused: { label: "Paused", bg: "var(--warning-tint)", fg: "var(--warning-text)", dot: "var(--warning)" },
  disabled: { label: "Account paused", bg: "var(--danger-tint)", fg: "var(--danger-deep)", dot: "var(--danger)" },
};

function flowStatus(flow: FlowTableRow): "active" | "paused" | "disabled" {
  if (!flow.accountActive) return "disabled";
  return flow.is_active ? "active" : "paused";
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

function KeywordChip({ flow }: { flow: FlowTableRow }) {
  if (flow.keywordMatch === "any") {
    return (
      <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ backgroundColor: "var(--neutral-tint)", color: "var(--neutral-text)" }}>
        Any comment
      </span>
    );
  }
  const shown = flow.keywords.slice(0, KEYWORD_PREVIEW_LIMIT);
  const hidden = flow.keywords.length - shown.length;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {shown.map((keyword) => (
        <span key={keyword} className="rounded-full px-3 py-1 text-sm font-bold" style={{ backgroundColor: "var(--tint2)", color: "var(--violet)" }}>
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

const iconButtonClass = "flex h-10 w-10 items-center justify-center rounded-full border transition-colors";
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
      aria-label={isActive ? "Pause this flow" : "Activate this flow"}
      title={isActive ? "Pause flow" : "Activate flow"}
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

function FlowActions({
  flow,
  onToggle,
  onPreview,
  onEdit,
  onDelete,
}: {
  flow: FlowTableRow;
  onToggle: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" title="Preview flow" aria-label={`Preview ${flow.name}`} onClick={onPreview} className={iconButtonClass} style={iconButtonStyle}>
        <EyeIcon className="h-4 w-4" />
      </button>
      <button type="button" title="Edit flow" aria-label={`Edit ${flow.name}`} onClick={onEdit} className={iconButtonClass} style={iconButtonStyle}>
        <PencilIcon className="h-4 w-4" />
      </button>
      <Link
        href={`/dashboard/flows/${flow.id}/leads`}
        title="View collected emails"
        aria-label={`View emails collected by ${flow.name}`}
        className={iconButtonClass}
        style={iconButtonStyle}
      >
        <MailIcon className="h-4 w-4" />
      </Link>
      <ConfirmAction
        action={async () => onDelete()}
        title="Delete this flow?"
        description={`"${flow.name}" will stop starting for new comments, and any conversations in progress will stop advancing. This can't be undone.`}
        confirmLabel="Delete flow"
        trigger={
          <button type="button" title="Delete flow" aria-label={`Delete ${flow.name}`} className={iconButtonClass} style={iconButtonDangerStyle}>
            <TrashIcon className="h-4 w-4" />
          </button>
        }
      />
      <span className="flex-1" />
      <form action={onToggle}>
        <ToggleSwitch isActive={flow.is_active} />
      </form>
    </div>
  );
}

export function FlowsTable({
  flows,
  accounts,
  initialView = "card",
}: {
  flows: FlowTableRow[];
  accounts: AccountFilterOption[];
  initialView?: ViewMode;
}) {
  const [query, setQuery] = useState("");
  const [accountId, setAccountId] = useState("all");
  const [status, setStatus] = useState<AutomationStatusFilter>("all");
  const [editFlowId, setEditFlowId] = useState<string | null>(null);
  const [previewFlowId, setPreviewFlowId] = useState<string | null>(null);
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
    toast.success(searchParams.has("created") ? "Flow created." : "Flow updated.");
    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);


  function handleViewChange(next: ViewMode) {
    setView(next);
    saveViewPreference(VIEW_STORAGE_KEY, next);
  }

  async function handleToggle(id: string, name: string, nextActive: boolean) {
    try {
      await toggleFlowActive(id, nextActive);
      toast.success(`"${name}" ${nextActive ? "activated" : "paused"}.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update flow."));
    }
  }

  async function handleDelete(id: string, name: string) {
    try {
      await deleteFlow(id);
      toast.success(`"${name}" deleted.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete flow."));
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
      await deleteFlows(ids);
      toast.success(`${ids.length} flow${ids.length === 1 ? "" : "s"} deleted.`);
      setSelected(new Set());
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete flows."));
    }
  }

  const counts = useMemo(() => {
    const result = { all: flows.length, active: 0, paused: 0, disabled: 0 };
    for (const flow of flows) result[flowStatus(flow)] += 1;
    return result;
  }, [flows]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return flows.filter((flow) => {
      if (status !== "all" && flowStatus(flow) !== status) return false;
      if (accountId !== "all" && flow.accountId !== accountId) return false;
      if (!needle) return true;
      return `${flow.name} ${flow.keywords.join(" ")} ${flow.accountHandle}`.toLowerCase().includes(needle);
    });
  }, [flows, query, accountId, status]);

  // Only flows still on the page count — a filter change or a delete elsewhere
  // can leave stale ids in the set.
  const selectedIds = visible.filter((flow) => selected.has(flow.id)).map((flow) => flow.id);
  const allSelected = visible.length > 0 && selectedIds.length === visible.length;

  const previewFlow = flows.find((flow) => flow.id === previewFlowId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AutomationStatusChips counts={counts} value={status} onChange={setStatus} />

        <div className="flex flex-wrap items-center gap-2">
          <SearchField value={query} onChange={setQuery} placeholder="Search flows..." className="sm:w-48" />
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
          <NewFlowButton className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full bg-[var(--primary)] px-6 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5">
            <PlusIcon className="h-4 w-4" />
            New flow
          </NewFlowButton>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3"
          style={{ borderColor: "var(--primary)", backgroundColor: "var(--tint-faint)" }}
        >
          <SelectBox
            checked={allSelected}
            label="Select all shown flows"
            onChange={() =>
              setSelected(allSelected ? new Set() : new Set(visible.map((flow) => flow.id)))
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
            title={`Delete ${selectedIds.length} flow${selectedIds.length === 1 ? "" : "s"}?`}
            description="They will stop starting for new comments, and any conversations in progress will stop advancing. This can't be undone."
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
        <p className="flex items-center justify-center gap-2 rounded-2xl border px-5 py-14 text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
          <SearchIcon className="h-4 w-4" />
          No flows match the current filters.
        </p>
      ) : view === "card" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((flow) => {
            const fStatus = flowStatus(flow);
            return (
              <div key={flow.id} className="flex flex-col gap-4.5 rounded-[30px] border p-5.5" style={{ borderColor: "var(--line)", backgroundColor: "#fff" }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <SelectBox
                      checked={selected.has(flow.id)}
                      label={`Select ${flow.name}`}
                      onChange={() => toggleSelected(flow.id)}
                    />
                    <StatusPill status={fStatus} />
                  </span>
                  <form action={() => handleToggle(flow.id, flow.name, !flow.is_active)}>
                    <ToggleSwitch isActive={flow.is_active} />
                  </form>
                </div>

                <div>
                  <h3 className="text-[22px] leading-tight font-extrabold tracking-tight" style={{ color: "var(--ink)" }}>
                    {flow.name}
                  </h3>
                  <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                    Created {formatDate(flow.created_at)} · {formatTime(flow.created_at)}
                  </div>
                </div>

                <div className="rounded-[22px] border p-4.5" style={{ borderColor: "var(--line)", backgroundColor: "var(--bg)" }}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: "var(--primary)" }}>
                      <LayersIcon className="h-5 w-5" />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                        When a comment contains
                      </span>
                      <KeywordChip flow={flow} />
                    </span>
                  </div>
                  <div className="relative ml-5 h-6.5 w-0.5" style={{ backgroundColor: "#CFC6F5" }} />
                  <div className="flex items-center gap-3">
                    <span className="flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: "var(--violet)" }}>
                      <LayersIcon className="h-5 w-5" />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                        Start a {flow.step_count}-step DM flow from
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-bold">
                        <Avatar name={flow.accountHandle} size="sm" muted={!flow.accountActive} />@{flow.accountHandle}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="font-semibold">Steps</span>
                  <span style={{ color: "var(--ink)" }}>
                    {flow.step_count} step{flow.step_count === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="flex items-center gap-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
                  <FlowActions
                    flow={flow}
                    onToggle={() => handleToggle(flow.id, flow.name, !flow.is_active)}
                    onPreview={() => setPreviewFlowId(flow.id)}
                    onEdit={() => setEditFlowId(flow.id)}
                    onDelete={() => handleDelete(flow.id, flow.name)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((flow) => {
            const fStatus = flowStatus(flow);
            return (
              <div key={flow.id} className="flex flex-wrap items-center gap-4 rounded-[24px] border p-4" style={{ borderColor: "var(--line)", backgroundColor: "#fff" }}>
                <div className="flex min-w-0 flex-1 basis-[220px] items-center gap-3.5">
                  <SelectBox
                    checked={selected.has(flow.id)}
                    label={`Select ${flow.name}`}
                    onChange={() => toggleSelected(flow.id)}
                  />
                  <span className="flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--tint2)", color: "var(--violet)" }}>
                    <LayersIcon className="h-5 w-5" />
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-base font-bold">{flow.name}</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {formatDate(flow.created_at)} · {formatTime(flow.created_at)}
                    </span>
                  </span>
                </div>
                <KeywordChip flow={flow} />
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Avatar name={flow.accountHandle} size="sm" muted={!flow.accountActive} />@{flow.accountHandle}
                </span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {flow.step_count} step{flow.step_count === 1 ? "" : "s"}
                </span>
                <StatusPill status={fStatus} />
                <FlowActions
                  flow={flow}
                  onToggle={() => handleToggle(flow.id, flow.name, !flow.is_active)}
                  onPreview={() => setPreviewFlowId(flow.id)}
                  onEdit={() => setEditFlowId(flow.id)}
                  onDelete={() => handleDelete(flow.id, flow.name)}
                />
              </div>
            );
          })}
        </div>
      )}

      {editFlowId && (
        <FlowFormModal
          flowId={editFlowId}
          onClose={() => setEditFlowId(null)}
          onSaved={() => {
            setEditFlowId(null);
            toast.success("Flow updated.");
            router.refresh();
          }}
        />
      )}

      {previewFlow && (
        <FlowPreviewDrawer
          flow={previewFlow}
          onClose={() => setPreviewFlowId(null)}
          onEdit={() => {
            setEditFlowId(previewFlow.id);
            setPreviewFlowId(null);
          }}
        />
      )}
    </div>
  );
}

function FlowPreviewDrawer({
  flow,
  onClose,
  onEdit,
}: {
  flow: FlowTableRow;
  onClose: () => void;
  onEdit: () => void;
}) {
  const status = flowStatus(flow);
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" aria-label="Close preview" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Flow preview"
        className="animate-fade-in-up relative flex h-full w-full max-w-[440px] flex-col gap-5.5 overflow-y-auto bg-white p-7 shadow-[-30px_0_80px_-30px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--muted)" }}>
              Flow preview
            </div>
            <h3 className="mt-1 truncate text-[28px] leading-tight font-extrabold tracking-tight">{flow.name}</h3>
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
                {flow.keywordMatch === "any" ? "any comment" : flow.keywords.join(", ") || "—"}
              </strong>
            </span>
          </div>
          <div className="text-center text-xs font-semibold" style={{ color: "var(--muted)" }}>
            DM flow from @{flow.accountHandle} · step 1 of {flow.step_count}
          </div>
          <div className="max-w-[90%] self-start rounded-[20px] rounded-bl-md border bg-white p-3.5 text-[15px] leading-snug break-words" style={{ borderColor: "var(--line)" }}>
            {flow.firstMessage || "No message set yet."}
          </div>
        </div>

        <div className="flex flex-col">
          {[
            ["Status", <StatusPill key="s" status={status} />],
            ["Keyword", <strong key="k">{flow.keywordMatch === "any" ? "Any comment" : flow.keywords.join(", ")}</strong>],
            ["Account", <strong key="a">@{flow.accountHandle}</strong>],
            ["Steps", <span key="st">{flow.step_count}</span>],
            ["Created", <span key="c">{formatDate(flow.created_at)} · {formatTime(flow.created_at)}</span>],
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
          <button type="button" onClick={onEdit} className="flex min-h-[52px] flex-1 items-center justify-center rounded-full font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>
            Edit flow
          </button>
          <button type="button" onClick={onClose} className="min-h-[52px] rounded-full border px-6 font-semibold" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
