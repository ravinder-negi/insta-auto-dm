# Project Audit Report — Insta Auto DM

**Date:** 2026-11-03 · **Commit audited:** `9190109` (clean `main`) · **Mode:** read-only. No application code, dependencies, or schema were changed.

Legend: **CONFIRMED** = code read and behaviour established from it (some re-verified by a second check, marked ✔). **POSSIBLE** = plausible from code, needs runtime/environment verification. Effort S/M/L. Line numbers refer to the audited commit.

---

## Implementation status (updated 2026-11-04)

Batches 1 and 2 are **done**: merged to `main`, and their migrations applied to Supabase. Rows marked ✅ in §14 are done; ◐ is partly done. Everything not listed here is still open.

### Batch 1: done (PR #1, merged 2026-11-04)

| §14 # | Finding | Fix | Commit |
|---|---|---|---|
| 1 | SEC1: Next.js 16.3.5 advisories | Upgraded to 16.4.4 | `a2c598d` |
| 2 | SEC2: `instagram_accounts` tokens readable/writable from the browser | Column grants; OAuth callback and token reads use a server-only service-role client; `profile_id` index (part of R7) | `d67a9ca` |
| 3 | SEC3: Lead-magnet email gate bypass | `file_url` hidden from client roles, private bucket, signed download URLs | `68105f3` |
| 4–5 | R3, R1: Duplicate public replies and DM flow advances | Execution row before public reply; inbound `mid` dedupe table; compare-and-set session advance | `173dfb2` |
| 6–7 | B1, B2: Non-atomic saves; step delete mis-points branches | `replace_flow_steps` / `replace_rule_followups` RPCs; `removeStepAt` remap + server range check | `a2480a4` |

Verified with anonymous and logged-in database checks (18/18), browser checks, and live Instagram tests: connect + ownership block, one public reply per comment, flow advance.

### Batch 2: done (pushed to `main` 2026-11-04)

| §14 # | Finding | Fix | Commit |
|---|---|---|---|
| 8 | B4: Analytics totals capped at 1,000 rows | `link_in_bio_rollup`, `flow_analytics_rollup`, `flow_step_counts` count in SQL | `8c489cb` |
| 10 | SEC4: Upload limits only in the browser; SVG allowed | Bucket size/type limits; shared `uploadRules`; extension from file type | `a20e551` |
| 11 | B6: Move up/down dead after a drag | Move uses the same local order + queued save as drag | `644e293` |
| 12 | UI1/UI2: Never-rendered shadows; undefined colour tokens | Broken shadow classes **removed** (look unchanged, by choice); tokens defined as the colour they already fell back to | `218c202` |
| 13 | B3/FS3: Standalone `/new` and `/edit` pages (rule edit page reset settings) | 10 pages removed, modals only; onboarding shortcuts use `?new=1` | `b8ccb97` |
| 17, 19 | SEC6, SEC8, SEC9, Q11: Redirect check, URL/colour validation, reserved usernames | Hardened `safeRedirectPath`; `isHttpUrl` / `normalizeHexColor`; DB check constraints; 5 reserved usernames | `ca93f26` |
| 27 (part) | B7, B9: Signup notice shown as error; 3-digit brand colours | "Check your email" card; colours saved as `#rrggbb` | `57b8cf2`, `ca93f26` |

Verified with throwaway-user scripts against the live database (rollups over 1,000 rows, upload limits, direct-API writes) and page renders on the dev server.

**Still to check by hand:** Move up/down after a drag (B6) in the browser; the signup "Check your email" card with a real email (only shown if email confirmation is on).

---

## 1. Executive summary

The codebase is in **reasonably good shape structurally** — a clear `app/` (routing) / `features/` (domain) / `components/` / `lib/` split, strict TypeScript with **zero `any` and zero `@ts-ignore`**, `tsc` clean, RLS on every table, a correctly verified webhook HMAC, a CSRF-protected OAuth flow, and SECURITY DEFINER functions that all pin `search_path`.

The real problems are not style. They are:

1. **Security / data exposure** — `next@16.3.5` has published critical advisories; Instagram access tokens are readable and `instagram_accounts` rows are freely writable by the browser client; the lead-magnet email gate can be bypassed three different ways.
2. **Webhook reliability** — the 2,821-line edge function does all work (including `sleep` up to 10 s) before acknowledging Meta, posts public replies before its dedupe guard, and does not dedupe inbound DMs that advance flows. Retries can produce duplicate public replies and duplicate DMs.
3. **Data integrity in the dashboard** — non-atomic multi-table saves (flows can end up active with zero steps, which silently swallows comments); deleting a flow step mis-points branch targets; a stale edit page silently resets DM-keyword settings.
4. **Silently wrong analytics** — several pages pull whole tables and aggregate in JS, so counts cap at PostgREST's 1,000-row limit with no warning.
5. **Heavy copy-paste** — rules ↔ flows (~70% shared across tables, wizards, actions) and links ↔ products ↔ lead-magnets (~85% shared lists/actions/modals). Bugs already exist in only one copy (e.g. reorder bug in all three, validation present in rules but not flows).

There are **no tests in `src/`**, no `test` script, no CI, and the 23 existing Deno tests cover only token refresh and keyword matching.

---

## 2. Existing architecture overview

| Layer | Tech / location |
|---|---|
| Framework | Next.js **16.3.5** App Router, React 19.2.8, Turbopack, TypeScript 5.9 strict |
| Styling | Tailwind v4 (CSS-first, `src/app/globals.css`), no `tailwind.config` |
| Charts | recharts 3 (only in `features/analytics/components/{PerformanceTrendChart,TopRulesChart}.tsx`) |
| Backend | Supabase (Postgres + RLS + Storage + Auth + pg_cron), `@supabase/ssr` |
| Auth gate | `src/proxy.ts` (Next 16 name for middleware) |
| Server mutations | Server Actions in `src/features/<domain>/actions.ts` (15 `"use server"` files) |
| Instagram ingest | Deno edge function `supabase/functions/instagram-webhook/index.ts` (2,821 lines) |
| Scheduled work | `refresh-instagram-tokens` edge fn + SQL cron sweeps (`send_scheduled_dms`, follow-ups, reconcile) |
| Size | ~300 tracked files, 222 TS/TSX files in `src/`, 84 `"use client"` files, 52 migrations |

Data flow: Server Components read via `@/lib/supabase/server` (cookie session, RLS-scoped) → props → client components; mutations via Server Actions. **No Supabase reads from client components** except four storage uploads (`LinkForm`, `ProductForm`, `LeadMagnetForm`, `ProfileForm`). That's a sound pattern.

---

## 3. Folder structure assessment

The README's documented structure is followed well. Issues:

| # | Finding | Evidence | Recommendation |
|---|---|---|---|
| FS1 | Empty leftover route tree | `src/app/dashboard/(creator-profile)/**` contains only empty dirs (untracked); also empty `src/app/(marketing)/_components/ui/` | Delete the empty dirs (S) |
| FS2 | Dead files | `components/ui/RowMenu.tsx`, `components/ui/StatusBadge.tsx`, `(marketing)/_components/LandingHeader.tsx`, `LandingFooter.tsx` — 0 importers | Delete after a final grep (S) |
| FS3 | Unlinked standalone pages + `*AndRedirect` actions | `dashboard/{links,products,lead-magnets,rules,flows}/new` and `[id]/edit` — every Add/Edit in the UI opens a modal; nothing links to these. `flows/[id]/{executions,analytics}` also unlinked and on an older design | Decide: delete or redirect to list. They have already drifted (see Q3) |
| FS4 | Shared code living in one feature | `features/flows/components/LeadsTable.tsx` + `leadsCsv.ts` used by rules too | Move to `features/leads/` |
| FS5 | Dependency direction wrong | `features/rules/actions.ts:6-7` imports a type from client component `RuleWizard` and helpers from `components/wizard/shared` | Move schemas/constants to `features/rules/schema.ts` |
| FS6 | Features import from private app folder | auth/onboarding components import fonts/CSS from `@/app/(marketing)/_components/home/*`; Bricolage font configured 3× (`app/fonts.ts`, `lib/linkInBioTheme.ts`, marketing `fonts.ts`) | One `src/lib/fonts.ts` |
| FS7 | Hand-written DB types | `src/types/index.ts` (351 lines) maintained by hand; list pages use `as unknown as RuleQueryRow[]` casts | Generate with `supabase gen types typescript` and derive domain types |
| FS8 | `.env.example` is git-ignored | `.gitignore` has `.env*`, so `.env.example` (referenced by README) is untracked | Add `!.env.example` to `.gitignore` |
| FS9 | README stale | Mentions `/dashboard/admin/appearance`, which does not exist | Update README |
| FS10 | Edge function is one file | See §5 | Module split (proposed in §14) |

No circular dependencies were observed in the areas read (not tool-verified — see §16).

---

## 4. Duplicate-code findings

| ID | Where | Same or different rules? | Recommendation | Benefit / risk |
|---|---|---|---|---|
| **DUP1** | `rules/components/RulesTable.tsx` (730) vs `flows/components/FlowsTable.tsx` (642) — `STATUS_META`, `StatusPill`, switch, `SelectBox`, keyword chips, icon-button styles (`Rules:139-142` = `Flows:120-122`), `?created` toast effect (`Rules:278-285` / `Flows:244-251`), filtering, selection, bulk delete, view toggle, preview drawer. Only 186 lines differ after renaming | Mechanics same; rows/actions differ (rules: duplicate, trigger type; flows: step count) | `useAutomationListState` hook + small primitives (`StatusPill`, `Switch`, `BulkBar`, `ViewToggle`, `PreviewDrawer`). Keep cards/rows per feature. **Not** a generic DataTable | ~500 lines removed / low risk |
| **DUP2** | `LinksList` (591), `ProductsList` (614), `LeadMagnetsList` (558) — identical state, order memo, reorder queue, toolbar, bulk bar, empty state, handlers | Same rules; differ in search fields, product featured/price, link copy-URL, lead count | `useCollectionManager({items, actions, searchText})` + `CollectionToolbar`; each keeps its Card/Row. Fix B6 once | ~1,000 lines removed / low-med risk (test drag, move, bulk delete for all 3) |
| **DUP3** | `links/actions.ts:167-269` ≈ `products/actions.ts:172-280` ≈ `lead-magnets/actions.ts` — create(max+1), delete, deleteMany, toggle, reorder, move, `*AndRedirect` | Same | Plain helpers parameterised by `{table, path}` in `src/lib/collection/`, wrapped by named exports in each `"use server"` file; `reorder_profile_items` SQL fn | low risk |
| **DUP4** | Rules vs flows actions: constants (`MAX_KEYWORDS`, `MAX_BUTTONS`, `BUTTON_LABEL_MAX_LENGTH`, `ATTACHMENT_*`, `PUBLIC_REPLY_*`, DM max) defined in `rules/actions.ts`, `rules/wizard/shared.ts`, `flows/actions.ts`, `flows/wizard/shared.ts`, and the webhook; button validation (`rules:112-147` vs `flows:140-152`); `mapRuleFormAccounts` = `mapFlowFormAccounts`; HTTPS regex ×5-6 | **Partly different:** rules require card title with buttons, flows don't; rules drop excluded keywords in "any" mode, flows keep them; flows require reply slot 1 | `features/automation/{constants,validation}.ts` with shared zod pieces; keep per-entity top-level schemas. **Product owner must confirm** the "excluded keywords in any mode" difference is intended | Removes client/server drift / med risk |
| **DUP5** | Wizard pieces: `ChipInput` byte-identical (`KeywordStep.tsx:357-450` / `TriggerStep.tsx:319-412`); media picker (`PostStep` / flows `TriggerStep`); `AccountStep` ×2; button editor (`MessageStep:527-609` / `StepsStep:331-406`); attachment editor; public-reply slots (`KeywordStep:284-352` / `SettingsStep`) | Same UI; rules add card subtitle/image and post_share shortcode matching | Extract `ChipInput`, `MediaPicker` (strategy prop for `isActive/onSelect`), `AccountStep`, `ButtonListEditor`, `AttachmentEditor`, `PublicReplySlots` | low risk; keep post_share matching in rules |
| **DUP6** | Form modals ×5 (`Rule/Flow/Link/Product/LeadMagnetFormModal`) line-for-line equal; none has `.catch`, focus trap, or scroll lock | Same | One `FormModal({load, render, title})` on a shared `Modal` | Fixes Q5 everywhere |
| **DUP7** | Storage upload ×4 (`LinkForm:116-146`, `ProductForm:67-96`, `LeadMagnetForm:66-96`, `ProfileForm:84-113`) | Same | `useStorageUpload({bucket, maxBytes, mimeTypes})`; derive extension from MIME | S |
| **DUP8** | Saved-form pattern ×3 (`ProfileForm`, `ThemeForm`, `SocialsForm`) incl. same stale-closure bug (Q7); `Card` duplicated in `ProfileForm:445` / `ThemeForm:445` | Same | `useSavedFormState` that snapshots values at submit | S |
| **DUP9** | Public templates `Original` (314) / `Centered` (256) / `Noir` (230) + `LinkInBioPreview` (173): avatar, socials row, link row, footer, theme setup | Layout differs; parts same | Server components `ProfileAvatar`, `SocialIconRow`, `LinkRow(variant)`, `MadeWithFooter`, `getPublicTheme(profile)`; keep 3 layouts | low risk |
| **DUP10** | Decorative page heroes (~50-60 lines) pasted in ~9 pages (rules/flows analytics/executions/leads, links/products/lead-magnets/analytics) | Same | `<PageHero eyebrow title description>` (check `AutomationHero` fits) | S |
| **DUP11** | Leads pages `rules/[id]/leads` vs `flows/[id]/leads` (differ only in table names/copy) | Same | One server helper | S |
| **DUP12** | Webhook internals: `handleCommentChange:806-1090` ≈90% same as `runInboundDmRule:1695-1929`; rule selection ×3; mid-dedupe ×3; rule column list ×4; `sendInstagramAttachment` copies `sendMessagePayload`; template JSON built twice | Recipient/dedupe column differ | `runMatchedRule({recipient, dedupeKey, singleMessage})` — see §14 | Do after tests (L) |
| **DUP13** | Graph config ×3: Deno (with defaults), Node `src/lib/instagram/config.ts` (no defaults → `"undefined/undefined/me"` if env missing), SQL hard-codes `graph.instagram.com/v26.0` (`20261030020000:216,278`); `EMAIL_PATTERN` ×3; 60-day token lifetime ×2 | Same | Defaults in Node; single source for SQL (`app_config` row/GUC) | S |
| **DUP14** | Toggle switch (`role="switch"`) ×8 files; `StatusPill` ×4 while `StatusBadge` unused; pager ×2 (`ExecutionsTable:278-309`, `LeadsTable:169-200`); `RANGES` ×2 | Same | `Switch`, `StatusPill({meta})`, `Pager` | S |

**Keep separate (intentionally):** `ExecutionsTable` (per-send log) vs `FlowSessionsTable` (conversation state) — different domains; share only chrome. Auth forms are already well factored — leave them.

---

## 5. Large-file analysis

| File | Lines | Responsibilities | Why hard to maintain | Proposed split | Priority |
|---|---|---|---|---|---|
| `supabase/functions/instagram-webhook/index.ts` | 2,821 | env/clients, types, message composition, flow reply parsing, email validation, HTTP + signature, comment pipeline, email gate, flow engine, inbound DM rules (dm_keyword / story reply / post share), follow check, Graph send client, public reply | Two near-identical pipelines; reliability bugs (R1-R3) hide inside; pure logic untestable in place | See §14 proposal (~13 modules, `index.ts` ≈ 60 lines) | **Critical** (after tests for pure parts) |
| `features/rules/components/wizard/MessageStep.tsx` | 904 | delay, follow/email gates, format chooser (two hand-synced booleans `contentType`+`sendMode`, :89-162), emoji picker, card, buttons, attachment, follow-ups | Derived state stored in state; dead branches (:446-448, :459-461) | Single `dm_format` value; `DelayField`, `PreDmGates`, `FormatPicker`, `TextMessageEditor`, `CardEditor`, shared `ButtonListEditor`/`AttachmentEditor`, `FollowupList` | **High** |
| `features/flows/components/wizard/StepsStep.tsx` | 898 | step list, `StepEditor`, intent targets, options, example flow, ~250-line help modal + diagram | Contains B2 bug; help UI unrelated to editing | `stepOps.ts` (pure, tested remap), `StepEditor`, `StepNextMode`, `FlowHelpModal`, `exampleFlow.ts` | **High** |
| `features/rules/components/RulesTable.tsx` / `flows/.../FlowsTable.tsx` | 730 / 642 | filters, selection, bulk ops, toggles, card & list views, drawer | ~70% duplicated (DUP1) | DUP1 + `RuleCard`, `RuleListRow`, `RuleActions`, `RulePreviewDrawer` | **High** |
| `features/rules/actions.ts` | 726 | parsing/validation (~330), persistence, form-data loader, list mutations | Validation mixed with persistence; wrong dependency direction (FS5) | `schema.ts` (zod), `queries.ts`, thin `actions.ts`, `save_rule` RPC | **High** |
| `components/icons/index.tsx` | 708 | 72 named icon components | Cohesive; tree-shakes | **Leave as is** | Low |
| `LinksList` / `ProductsList` / `LeadMagnetsList` | 591 / 614 / 558 | state machine, reorder queue, toolbar, card & row | Triplicated; shared bug B6 | DUP2 | **High** |
| `features/rules/components/wizard/RuleWizard.tsx` | 548 | initial-state mapping, trigger rules, validation, ~140 lines of hidden inputs | Trigger rules duplicated in `readRuleFields` | `toWizardValues.ts`, pure `ruleValidation.ts`, or a single JSON payload field | Medium |
| `features/flows/actions.ts` | 521 | parse, persist, load, mutate | Weak validation (Q1), non-atomic (B1) | Same split as rules | Medium (fix B1/Q1 first) |
| `ProfileForm` / `ThemeForm` | 484 / 479 | mostly markup + saved-form state | Repeated pattern | DUP8, extract preview pane | Low |
| `AccountsList` | 478 | list + detail panel | — | `AccountDetail` | Low |
| `rules/wizard/KeywordStep.tsx` / flows `TriggerStep.tsx` | 450 / 412 | trigger copy, match picker, chips, replies / media grid | Dead `post_share` branch (`KeywordStep:85-94, 209-216`) | DUP5 → ~250 lines each | Medium |
| `src/app/globals.css` | 566 | tokens, dark mode, animations, utilities | Unused selectors; dark rules escape scope (UI5) | Remove dead rules; register tokens (§10) | Medium |
| `ExecutionsTable.tsx` | 393 | filters, mobile/desktop, pager, detail modal | Reasonably cohesive | Extract `Pager`, `ExecutionDetailModal` | Low |
| `features/analytics/lib/metrics.ts` | 360 | pure metrics | Cohesive, testable | **Leave as is**; add tests | — |
| `app/dashboard/analytics/page.tsx` | 303 | fetch + JS aggregation + hero | Wrong numbers (B5) | RPC + `features/analytics/lib/linkInBio.ts` + `PageHero` | High (with B5) |

---

## 6. Reusability opportunities

| Candidate | Type | Verdict |
|---|---|---|
| `Modal` (portal, backdrop, Escape, initial/return focus, scroll lock; native `<dialog>`) | Shared component | **Yes** — 12 hand-rolled overlays; none manages focus; Escape in 11/16 |
| `FormModal` on top of `Modal` | Shared component | **Yes** (DUP6) |
| `Switch`, `StatusPill`, `Pager` | Shared components | **Yes** (DUP14) |
| `ChipInput`, `MediaPicker`, `ButtonListEditor`, `AttachmentEditor`, `PublicReplySlots`, `AccountStep` | `features/automation/components/` | **Yes** (DUP5) |
| `useCollectionManager`, `useAutomationListState` | Hooks | **Yes** (DUP1/DUP2) |
| `useStorageUpload`, `useSavedFormState` | Hooks | **Yes** |
| `ActionResult<T>` type + helper | Utility | **Yes** (Q2) |
| `getCurrentUser()` wrapped in React `cache()` | Utility | **Yes** (P4) |
| `isHttpUrl()`, `safeRedirectPath()` hardening, shared zod schemas | Utility | **Yes** |
| `PageHero` | Shared component | **Yes** |
| Generic `DataTable` | — | **No** — row content differs too much; share sub-pieces instead |
| `Button` component | — | **No** — class-name constants in `styles.ts` are enough |
| Pagination component beyond `Pager` / date-range picker / permission wrapper | — | **No** current need |
| Route `loading.tsx` skeletons | Per-section | Only where navigation feels slow (measure first) |

---

## 7. Code quality findings

### Confirmed bugs (behaviour is wrong today)

| ID | Pri | Where | Problem | Fix | Effort |
|---|---|---|---|---|---|
| **B1** ✔ | P1 | `flows/actions.ts:352-364` (update), `:271-296` (create); `rules/actions.ts:445-463, 504-514, 696-723` | Multi-table saves not atomic. Flow update deletes steps then re-inserts; if insert fails the flow stays **active with 0 steps**. Webhook still matches it, `startDmFlow` returns at "no step 1" (`index.ts:1356`) and `handleCommentChange` returns before rule matching (`:720`) → matching comments get nothing. Create can leave empty active flow / duplicate rule on retry | `save_flow(jsonb)` / `save_rule(jsonb)` Postgres functions, `security invoker`, via `supabase.rpc` | M |
| **B2** ✔ | P1 | `flows/components/wizard/StepsStep.tsx:41-43`; server `flows/actions.ts:199-213` | `removeStep` filters the array but never remaps 1-based `intent_map` / `options[].target_step_order`. Deleting step 2 of 4 makes branches to old step 3 point at old step 4, and to old step 4 point past the end. Server stores targets unchecked | Pure `removeStep` that decrements/clears targets (+ tests); server range-check 1..n | S |
| **B3** ✔ | P1 | `app/dashboard/rules/[id]/edit/page.tsx:22` | Select omits `keyword_exact`, `dm_repeat_after_days`; `RuleWizard.tsx:173` then defaults to `false`/""; saving silently turns off exact match and resets repeat. Only reachable by direct URL | Use `getRuleFormData` (or delete page, FS3) | S |
| **B4** | P1 | `src/app/dashboard/analytics/page.tsx:69-78` (and `flows/analytics/page.tsx:35-39`, `flows/[id]/analytics`, `flows/executions/page.tsx:33`, `lead-magnets/[id]/leads/page.tsx:26-31`) | Unbounded selects aggregated in JS. `supabase/config.toml:18` sets `max_rows = 1000` → totals silently cap, and unordered queries make 7-day counts come from an arbitrary 1,000 rows. `metrics.ts:4-8` documents this exact cap and fixes it for rules via `analytics_rollup` — these pages never got the fix | `link_in_bio_rollup(p_days)` and `flow_analytics_rollup(p_days)` RPCs; `count: "exact", head: true` for counts; `max(step_order) group by flow_id` | M |
| **B5** | P2 | `rules/executions/page.tsx:37` `.limit(200)`; `ExecutionsTable.tsx:41-46,94-102`; `flows/[id]/executions/page.tsx:27,53`; `LeadsTable.tsx:74-76` | UI offers "All time" and status counts but sees only 200 rows; leads paginate client-side over all rows | Server-side `.range()` pagination; counts via `head: true` | M |
| **B6** | P1 | `LinksList.tsx:73,86-92,160-166,185` (same in Products/LeadMagnets) | `localOrder` set on drop and never cleared; it overrides fresh server props, so after any drag **Move up/down appears to do nothing** | Clear `localOrder` when reorder queue drains or in `handleMove` | S |
| **B7** | P2 | `features/auth/actions/login.ts:67-70` → `SignupForm.tsx` ~:87 | "Check your inbox" success shown as red error | Add `{notice}` state | S |
| **B8** | P2 | `profile`, `theme`, `socials` forms (`ProfileForm.tsx:56-76,126` etc.) | `setSaved(values)` after await captures edits typed during save → form shows not-dirty but those edits weren't saved | Snapshot values at submit (DUP8) | S |
| **B9** | P2 | `theme/actions.ts:13` accepts `#abc`; `ProductCard.tsx:34,46`, `LeadMagnetCard.tsx:46-48` append alpha → `#abc0f` (invalid) | Card tints/gradients dropped for 3-digit colors | Normalize to 6 digits on save or use `color-mix` | S |
| **B10** | P3 | `StepsStep.tsx:65,352,495`; `MessageStep.tsx:538,677`; `RuleWizard.tsx:461` | Index keys on deletable lists → focus/DOM state jumps rows after delete (values OK, inputs controlled) | Client-side `uid` | S |
| **B11** | P3 | `FlowsAnalyticsDashboard.tsx:113-122`, `flows/[id]/analytics/page.tsx:43-50` | Funnel "reached step N" = `current_step_order >= N`; wrong for branching flows (POSSIBLE impact) | Needs per-step visit log | M |
| **B12** | P3 | `LinkForm.tsx:333` | Preview uses `initialValues?.link_type`, ignores type change | Use current value | S |
| **B13** | P3 | `ProductsList` `formatPrice` → `Intl.NumberFormat(undefined, …)` | POSSIBLE hydration mismatch when browser locale ≠ server | Fixed locale or format on server | S |

### Quality / convention issues

| ID | Pri | Finding | Evidence | Fix |
|---|---|---|---|---|
| **Q1** | P2 | Flows server validation far weaker than rules | `flows/actions.ts:69-78,122-237`: `JSON.parse` output used unchecked (non-array → 500; non-string `message_text`/`label` → `.trim()` throws); no cap on steps, reply count/length, `followup_delay_hours`; `intent_map` stored verbatim. Both entities: DM 1,000-char limit is client-only. Rules client lacks 7-day follow-up cap the server enforces | Shared zod schemas (DUP4) |
| **Q2** | P2 | Inconsistent error shape; thrown messages hidden in prod | List/toggle/delete actions `throw new Error(error.message)` (`rules/actions.ts:641-726`, `flows/actions.ts:390-521`, `links/products/lead-magnets`, `accounts/actions.ts:14,28`); tables toast `err.message`. Next sanitizes thrown server-action errors in production (see `node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md`) | `ActionResult<T>` everywhere |
| **Q3** | P2 | Duplicate loaders drift | B3 is the result; accounts query repeated in ~10 pages | `queries.ts` per feature |
| **Q4** | P3 | Silent no-op updates | `.update().eq("id", id)` on a row hidden by RLS returns success with 0 rows (`rules/actions.ts:504-507`, `links/actions.ts:126-139`, etc.); `updateRuleCore` validates against submitted not stored `trigger_type` (:493) | `.select("id").single()`; add `profile_id` filter as defence in depth |
| **Q5** | P3 | Modal loaders hang on error | `RuleFormModal.tsx:40`, `LinkFormModal.tsx:37` + twins have no `.catch` | DUP6 |
| **Q6** | P3 | Set-state-in-effect with lint suppressed | `LeadsTable.tsx:68-72`, `ExecutionsTable.tsx:116-120`; `exhaustive-deps` suppressed in `FlowWizard:82`, `RuleWizard`, `RulesTable`, `FlowsTable:250`, `LinkForm:103`, `LeadMagnetForm:56`, `LeadMagnetsList:104`, `AccountsList:114` | Reset page in onChange; `useEffectEvent` (React 19.2) |
| **Q7** | P3 | Prop drilling / scattered state | `FlowWizard` 10 `useState`s, 16 props into `TriggerStep` (:56-90) | One `values` + `update`, like RuleWizard |
| **Q8** | P3 | Nested ternaries | `RuleWizard.tsx:157-165,213-218,251-256`; `flows/actions.ts:199-205` (4 deep) | Small helper functions |
| **Q9** | P3 | Dead code / stale comments | `MessageStep.tsx:446-448,459-461`; `KeywordStep.tsx:85-94,209-216`; `flows/actions.ts:36` comment wrong; `RulesTable.tsx:97-105,508` comment copy shown for non-comment triggers; commented-out `ThemeToggle` in shell | Remove / correct |
| **Q10** | P3 | Weak typing at DB boundary | `as unknown as RuleQueryRow[]` in list pages; `(entry as RuleButton)` `rules/actions.ts:128`; unchecked `as TriggerType` `RuleWizard.tsx:154` | Generated types (FS7) |
| **Q11** | P3 | `completeOnboarding` reimplements redirect check, missing `/\` case | `onboarding/actions.ts:127-128` | Use `safeRedirectPath` |
| **Q12** | P3 | Hard-coded domain | `ThemeForm.tsx` ~:387 `insta-auto-dm-xi.vercel.app` | Use `publicOrigin` prop as ProfileForm does |
| **Q13** | P3 | Lint error | `(marketing)/_components/home/HomeHeader.tsx:21` — `<a href="/">` (`@next/next/no-html-link-for-pages`) | `<Link>` |

---

## 8. API & state-management findings

**API / data layer**

- **Centralization:** good — server reads via one helper, mutations via Server Actions. Main gaps: duplicated loaders (Q3), inconsistent result shape (Q2), and no shared validation (Q1).
- **Auth round-trips (P2, CONFIRMED):** `auth.getUser()` in `proxy.ts:36`, `dashboard/layout.tsx`, and again in every page → ~3 Auth calls per navigation. Wrap in React `cache()` as `getCurrentUser()`.
- **Instagram Graph calls on render (P2, CONFIRMED):** `accounts/page.tsx` ~:64 calls `fetchInstagramProfileStats` per account with `cache:"no-store"` (`lib/instagram/profile.ts:25`), no timeout, and again on every `router.refresh`. `rules/analytics/page.tsx:47-52` makes up to 12 uncached Graph calls per view. Cache ~10 min (`"use cache"`/`unstable_cache` keyed by account/media) and add `AbortSignal.timeout`.
- **Duplicate fetch:** `getPublishedProfile` runs in both `generateMetadata` and the page without `cache()`.
- **Possibly redundant refresh (POSSIBLE):** edit modal `onSaved` → `router.refresh()` (`RulesTable.tsx:611`, `FlowsTable.tsx:544`) after the action already `revalidatePath`s.
- **Reorder (P3):** one UPDATE per item per drop (`links/actions.ts:207-215`); `move*` swaps with two non-atomic updates (:253-262). → `reorder_profile_items` RPC.
- **Sequential awaits:** `lead-magnets/page.tsx:23-33`, `products/page.tsx` (links uses `Promise.all`).
- **Response coupling:** `RuleTableRow` mixes camelCase and raw snake_case; legacy-column fallbacks (`keyword`→`keywords`, `public_reply_message`) handled in 3+ places per entity → one mapper.
- **Revalidation:** only `/dashboard/rules` / `/dashboard/flows` revalidated after toggles; home and analytics pages read cookies (dynamic) so staleness risk is low.

**State management**

No global store (no Redux/Context-store) — appropriate for this app. Issues are local:
- Derived state stored in state: `MessageStep` `contentType` + `sendMode` (:89,125) — stale if parent resets values. `StepEditor` already derives these correctly; follow that.
- `localOrder` never cleared (B6).
- Saved-form snapshot race (B8).
- **Theme restore (P2, CONFIRMED by logic):** saved light/dark choice is applied only by the `beforeInteractive` script in `layout.tsx:17,51`. A soft navigation into `/dashboard` (e.g. after login redirect) mounts `.dashboard-theme` without the class until a hard reload. Have `DashboardShell` apply it (e.g. `useSyncExternalStore` on localStorage).
- `proxy.ts:56` trusts `user_metadata.onboarding_step` (user-writable via `auth.updateUser`) — only lets a user skip onboarding; low impact.

---

## 9. Performance findings

| ID | Status | Finding | Recommendation |
|---|---|---|---|
| **P1** | CONFIRMED | Unbounded queries + JS aggregation (B4/B5) — payload grows without bound | RPC rollups, server pagination |
| **P2** | CONFIRMED | Root layout (`layout.tsx:30-35`) creates a cookie-reading client and queries `app_settings.accent_color` on **every** request → every route (landing, legal, public profile) is dynamic + 1 DB round-trip. The admin accent only reaches ~9 files (`brand-NNN` 36 uses) while the fixed `--primary` is used 139× | Cache with a tag (no cookies), revalidate on admin save. Product decision: should `--primary` derive from the admin accent? |
| **P3** | CONFIRMED | Uncached Graph API calls on accounts/analytics renders | Cache + timeout |
| **P4** | CONFIRMED | Triple `getUser()` per navigation | `cache()` |
| **P5** | CONFIRMED | 17 `<img>`, 0 `next/image`; public page images have no width/height/lazy (CLS, eager below-fold loads); up to 5 MB product images in 170 px tiles | At minimum `loading="lazy" decoding="async"` + dimensions; or `next/image` with Supabase `remotePatterns` / Supabase image transforms (do this **after** the Next upgrade, see SEC1) |
| **P6** | CONFIRMED | Centered template is a client component: all tab content except the first is absent from SSR HTML (SEO for shop/lead magnets) | Server shell + small client `<SectionTabs>` (also fixes SEC3) |
| **P7** | CONFIRMED | ~9 `next/font` instances; root loads 4 on every page; Lora used once (`font-serif` ×1); Bricolage configured 3× | Drop Lora if not needed; one fonts module |
| **P8** | CONFIRMED | `(marketing)/page.tsx` calls `auth.getUser()` → landing can't be static; `HomeHero.tsx:43` re-renders every 1 s with no reduced-motion check | Move auth-aware CTA to a client island; respect `prefers-reduced-motion` |
| **P9** | POSSIBLE | Edge webhook does all work inline incl. `sleep` (see R2) — latency/timeouts under batched payloads | Ack-first architecture |
| — | OK | recharts only loaded on `/dashboard/rules/analytics`; icons tree-shake; no large-list virtualization need found | No action |

---

## 10. Styling & theme findings

There are effectively **two design systems**:
- **A:** Tailwind `@theme` brand ramp + zinc + `dark:` variants — admin-configurable; used by `components/ui` primitives.
- **B:** a fixed `:root` palette (`--primary`, `--ink`, `--line`, `--muted`, `--violet`, …) consumed through **1,131 arbitrary `x-[var(--…)]` utilities** (`text-[var(--muted)]` 235, `border-[var(--line)]` 180, `text-[var(--ink)]` 87).

Other counts (`src/**/*.tsx`): `text-[Npx]` 203; `rounded-[..]` 165; `shadow-[..]` 77; hex arbitrary classes 61 in 26 files; inline hex in style objects 146 (`"#fff"` ×57, `#6366f1` ×11, brand fallback duplicated in 7 places); **736 `style={{` in 90 files** (`MessageStep` 67, `StepsStep` 54, `RulesTable` 48, `FlowsTable` 47); `border-[1.5px] border-[var(--line)]` 89×.

| ID | Pri | Finding | Fix |
|---|---|---|---|
| **UI1** ✔ | P1 | 26+ arbitrary shadows contain spaces (`color-mix(in srgb, …)`) → Tailwind never generates them. Verified absent in compiled CSS. Includes **auth input focus ring** (`AuthTextField.tsx:29`) and active-nav glow (`DashboardShell.tsx:106`), plus `OriginalTemplate:164,201`, `AccountsList:223,267`, `ProductsList:456,559`, `ProfileForm:410`, `ThemeForm:283,367`, `settings/page.tsx:165`, Home* components | Use underscores (as `Avatar.tsx:45` does) or `@theme --shadow-*` tokens |
| **UI2** ✔ | P1 | Undefined tokens: `--primary-deep` (`settings/page.tsx:97`, `chart-primitives.tsx:20`), `--primary-strong` (`KeywordStep:164,197`, `PostStep:182`, `TriggerStep:123,258`); `bg-brand-950/60` (`DashboardShell:363`) — ramp stops at 900 | Define tokens or swap |
| **UI3** | P2 | `--accent` defined only inside `linkInBioCssVars`/`homeCssVars`; breaks outside them; Noir doesn't spread it | Define in `:root` |
| **UI4** | P2 | Selected-card inline style object copy-pasted 5× (KeywordStep, PostStep, TriggerStep×2) | `data-selected` + shared class |
| **UI5** | P2 | Dark rules escape `.dashboard-theme` scope: `.viz` and `.thin-scrollbar` dark blocks key off `:root:not(.light)`, so OS-dark users who pick Light still get dark chart tokens/scrollbars | `.dashboard-theme:not(.light) …` (consistent with the intended dashboard-only scope) |
| **UI6** | P2 | Thin dark-mode coverage (POSSIBLE, not viewed): 112 files use fixed light palette, only 26 have `dark:` variants | Make `--ink/--line/--bg/--muted` theme-aware under `.dashboard-theme.dark`, or default to light |
| **UI7** | P3 | Unused CSS: `.no-scrollbar`, `.animate-gradient-shift`, `.animate-badge-pulse`, `.animate-marquee` (+ keyframes); `pp-drift-1/2` duplicate `haDrift1/2`; `bg-background`/`text-foreground` 0 uses | Delete |

**Recommended centralized theme (incremental, no visual change):**
1. Register System B in `@theme inline` (`--color-ink: var(--ink); --color-line: var(--line); …`) so `text-ink`, `border-line` work.
2. Add `--text-*`, `--radius-*`, `--shadow-*` tokens for the recurring values (13/15/11/28 px; 22/24/30/32/40 px radii).
3. Codemod arbitrary values → tokens file by file (visual diff each).
4. Shared class constants for System B buttons/fields in `components/ui/styles.ts` (currently used by only 3 files; features define `ghostButtonClass`, `primaryPillClass`, `fieldInputClass` ×2 locally).
5. Keep inline `style` only for truly dynamic values (creator brand color).

---

## 11. Security & dependency findings

> Secrets: `.env` and `.env.local` exist locally and are git-ignored; no secret values found in tracked files or git history for those paths. No values are reproduced here.

| ID | Pri | Status | Finding | Fix | Effort / risk |
|---|---|---|---|---|---|
| **SEC1** | **P0** | CONFIRMED (`npm audit`) | `next` pinned to **16.3.5**. Advisories affecting it include: critical *Unauthenticated RCE in Image Optimization API with SVG* (≤16.4.0), critical *RCE in `use cache` returning typed arrays* (≤16.4.0), critical *RCE in next/og ImageResponse* (<16.3.6), high *DoS in App Router using Server Actions* (≤16.4.0), high *SSRF in Image Optimization*, several cache-poisoning issues. The app uses Server Actions heavily; it does **not** import `next/image`, `next/og`, or `"use cache"`, but `/_next/image` is still served by default | Upgrade `next` + `eslint-config-next` to **16.4.4** (non-major per npm). Read the 16.4 notes in `node_modules/next/dist/docs` first; run build + smoke test | S / low-med |
| **SEC2** | **P0/P1** | CONFIRMED ✔ | `instagram_accounts` RLS (`20260914130100:41-61`) gives `authenticated` full CRUD on own rows with no column restriction, and no later migration narrows it. (a) `access_token` is readable from the browser with anon key + session (any XSS/extension can exfiltrate long-lived IG tokens). (b) A user can insert a row with **any** `instagram_user_id` (unique) → squats a victim's IG id so the real owner can't connect (callback `:143-171`), and webhook events for that id would be recorded against the attacker's row. Severity depends on how easily an attacker obtains a target's IG user id (POSSIBLE). Comment in `20260914130000:150-153` claiming tokens are out of reach is no longer true | Revoke INSERT/UPDATE (or grant only `is_active` column) from `authenticated`; do the callback upsert with service role after OAuth; move tokens to a table with no client policy (or Vault) and read server-side only via service client/definer RPC | M / med (3 pages + media route need a server-only token reader) |
| **SEC3** | P1 | CONFIRMED ✔ | Lead-magnet email gate bypassable 3 ways: (1) `lead_magnets_select_public` (`20260923110000:49-59`) exposes every column incl. `file_url` to `anon` → `GET /rest/v1/lead_magnets?select=file_url`; (2) `lead-magnets` storage bucket is public (`:116-124`); (3) `CenteredTemplate.tsx` is `"use client"` and receives `select("*")` lead magnets (`page.tsx:48-58`), so `file_url` is serialized into the page HTML | Explicit column list on public page; column-level grant or view hiding `file_url`; private bucket + short-lived `createSignedUrl` from `submitLeadMagnetEmail` | M / med (existing URLs need migration) |
| **SEC4** | P1 | CONFIRMED | Uploads: type/size checked only client-side; buckets created without `file_size_limit`/`allowed_mime_types` (products, lead-magnets, link-icons, avatars); extension from user filename; `LinkForm.tsx:258` allows `image/svg+xml` into a public bucket (POSSIBLE stored-script on storage origin); lead-magnet bucket accepts any type if client bypassed. No storage `.remove()` anywhere → orphaned files. Path ownership **is** correctly enforced | Bucket limits + MIME allow-list via migration; drop/sanitize SVG; derive ext from MIME; cleanup on delete/replace | S-M / low |
| **SEC5** | P2 | CONFIRMED | Public insert endpoints unbounded: `contact_messages … with check (true)` (`20261005000000:18-21`) — server-action validation bypassable via direct PostgREST insert, no length caps; `profile_views`/`link_clicks` anon inserts with unbounded text, no throttling; `track-click/route.ts:45-50` stores raw `referer` | CHECK constraints on lengths; route inserts through server with rate limit; captcha on contact | S-M / low |
| **SEC6** | P2 | POSSIBLE (needs browser test) | `safeRedirectPath` (`src/lib/auth/redirect.ts:11`) rejects only `//` and `/\`; `"/\t/evil.com"` may pass and be normalized by browsers to `//evil.com`. Used by `login.ts:22,34` | Parse with `new URL(raw, base)`, require same origin, reject control chars; unit tests | S / low |
| **SEC7** | P2 | CONFIRMED | `instagram_accounts.profile_id … on delete set null` (`20260914130000:19-21`): deleting a user leaves an active account + live token; webhook (`index.ts:1311-1315`) and cron sweeps keep sending; IG id can never be reconnected. Disconnect (`accounts/actions.ts:20-31`) deletes the row without unsubscribing `subscribed_apps` | Cascade or deactivate+null token via trigger; exclude `profile_id is null` in webhook/sweeps; unsubscribe on disconnect | S / low |
| **SEC8** | P2 | CONFIRMED | Unvalidated URL/color fields rendered on public page: `avatar_url` (`profile/actions.ts:30`), `image_url` (`products/actions.ts:29`), `custom_icon_url` (`links/actions.ts:34`), `brand_color` (lands in inline style). Validated URLs use a case-sensitive regex ×4 and there are no DB CHECK constraints, so owners can write any scheme via PostgREST (React 19 blocks `javascript:` hrefs; `data:` etc. remain) | Shared `isHttpUrl()` with `new URL()`; DB CHECKs (`~ '^https?://'`, `brand_color ~ '^#[0-9a-fA-F]{6}$'`); `isOwnStorageUrl` for uploads | S / low |
| **SEC9** | P3 | CONFIRMED | Reserved usernames (`profile/actions.ts:10-21`) missing `onboarding`, `contact`, `privacy`, `terms`, `data-deletion` | Add them (+ check existing profiles) | S |
| **SEC10** | P3 | CONFIRMED | IG tokens in query strings: `index.ts:2316`, `lib/instagram/profile.ts:23`, `media.ts:19`, `api/instagram/media/route.ts:51` (other calls use Bearer) | Authorization header | S |
| **SEC11** | P3 | POSSIBLE | Email redirect URLs built from request `Origin` header (`login.ts:50,59`, `forgot-password.ts:13,17`); local `config.toml` has `minimum_password_length = 6`, `enable_confirmations = false` | `SITE_URL` env; verify prod Auth settings + redirect allow-list | S |

**Checked and OK:** webhook HMAC on raw body with constant-time compare, fails closed (`index.ts:521-527, 2255-2298`); OAuth state in httpOnly cookie compared in callback, scope check, token not logged; all SECURITY DEFINER fns set `search_path`, EXECUTE revoked from public/anon/authenticated on sweeps; rollups are `security invoker`; `dangerouslySetInnerHTML` only in `layout.tsx:46,53` (static script + hex-validated color); `refresh-instagram-tokens` checks constant-time `x-cron-secret`; no tokens/emails in logs (webhook logs pseudonymous IG ids); 16/17 `target="_blank"` have `rel` (the 17th is same-origin); RLS present on every table checked, no IDOR found.

**Dependencies (`package.json` is lean — 6 runtime deps, no duplicates or unused packages found):**

| Package | Current → available | Note |
|---|---|---|
| `next`, `eslint-config-next` | 16.3.5 → **16.4.4** | SEC1 — do first |
| `react`, `react-dom` | 19.2.8 → 19.3.1 | Minor; upgrade with Next |
| `@supabase/supabase-js` | 2.116 → 2.118 | Patch-level |
| `tailwindcss`, `@tailwindcss/postcss` | 4.3.3 → 4.3.4 | Patch |
| `supabase` (CLI) | 2.117 → 3.0.0 | **Major** — read migration notes; dev-only |
| `typescript` | 5.9.3 → 7.0.2 | **Major** (native compiler) — defer; check Next support |
| `@types/node` | 20 → 26 | Match deployed Node version |
| transitive: `zod`, `source-map-js`, `sharp`, `brace-expansion`, `minimatch` | high/moderate advisories | Mostly dev-tooling; `npm audit fix` (non-force) after review |

**Config:** `next.config.ts` empty (no `images.remotePatterns`, no security headers — consider CSP/`X-Frame-Options` via `headers()`); ESLint = Next core-web-vitals + TS (1 error, Q13); no Prettier; no `typecheck` / `test` scripts; no CI workflow in repo; no `error.tsx` / `global-error.tsx` error boundaries anywhere (only `not-found.tsx`).

---

## 12. Webhook reliability findings (edge function)

| ID | Pri | Status | Finding | Fix | Effort |
|---|---|---|---|---|---|
| **R1** | P1 | CONFIRMED code; retry frequency POSSIBLE | Inbound DMs that advance flows / answer the email prompt are not deduped by `mid` (`handleMessagingEvent`, `index.ts:1485-1663`); only dm_keyword/story/share paths dedupe (`:1983, 2065, 2182`). Session advance (`:1655-1662`) has no compare-and-set → redelivery or concurrent delivery double-advances or double-sends | `processed_inbound_messages(mid unique)` insert-first; `update … where current_step_order = $expected returning id` | M |
| **R2** | P1 | CONFIRMED code; timeout behaviour POSSIBLE | `Deno.serve` (`:542-567`) awaits every entry sequentially including `sleep(delay*1000)` up to 10 s (`:141, 1018-1020, 1261-1264, 1861-1863`), follow checks, public reply and up to 3 Graph sends; any exception → 500 → Meta retries the whole batch (amplifying R1/R3); repeated failures can get the webhook disabled | Verify signature → persist raw event with dedupe key → 200 immediately; process via `EdgeRuntime.waitUntil` or queue; all delays via `scheduled_dms` | M-L |
| **R3** | P1 | CONFIRMED ✔ | Public comment reply posted (`:783`) **before** the unique-insert guard (`:917`); pre-check at `:651-660` is best-effort → concurrent duplicates post two public replies under the creator's post | Insert execution row (`processing`) first, as `startDmFlow` does (`:1361-1393`) | S |
| **R4** | P2 | CONFIRMED | Rows stuck in `processing` forever if function dies (`:926, 1790`); `dmRuleRecentlyRan` counts `processing` as ran (`:1951`) → user blocked permanently. Post-email-capture send writes no execution row (`:1240-1281`); several insert errors ignored (`:1054,1061,1243,1893,1900,1592-1604`); `resolveInstagramAccount` returns null on DB error (`:1317-1320`) → event silently dropped | Sweep stale `processing` → `failed`; record post-capture sends; check errors; return non-200 on transient DB errors (only after R1-R3) | M |
| **R5** | P2 | POSSIBLE | Callback subscribes `"comments,messages"` only (`callback/route.ts:185`) but webhook handles `live_comments` and rules offer a `live_comment` trigger | Verify with Meta; add field + resubscribe | S |
| **R6** | P3 | CONFIRMED | Check-then-insert races (dm_keyword repeat guard `:2016-2023`→`:1781`; follow prompt `:816-836`); webhook ignores `token_status` (`:1313`); `send_dm_flow_followups` lacks `ia.is_active` filter (`20261030020000:265-268` vs `:209`); `send_scheduled_dms` lacks `FOR UPDATE SKIP LOCKED` | Unique constraints / CAS; filters; row locking | S-M |
| **R7** | P3 | CONFIRMED | No index on `instagram_accounts.profile_id` though every ownership policy subqueries it; policies use bare `auth.uid()`; `webhook_events` stores whole payload per change, no retention, `processed` never set | Index; `(select auth.uid())`; retention job | S |

---

## 13. Testing gaps

**Measured state:** 23 Deno tests in 3 files — `_shared/keywordMatch.test.ts`, `_shared/instagramToken.test.ts`, `refresh-instagram-tokens/refresh.test.ts`. **Zero tests in `src/`.** No test runner, no `test` script, no CI. Deno is not installed on this machine, so the existing tests were **not run** during this audit. Coverage was not measured.

**Practical strategy (highest value first):**
1. **Extract & unit-test pure webhook logic** (Deno test, no mocks): `cardCopy`, `collapseToSingleMessage`, `scheduledMessagePayloads`, `withOptionsList`, `matchIntent`, `matchOption`, email/TLD check, `extractSharedMediaId`/`extractShortcode`, `verifyMetaSignature`, rule-priority selection.
2. **Add Vitest for `src/`** (single dev dependency): `safeRedirectPath` (incl. tab/newline), shared zod schemas / `readRuleFields` / `readFlowFields`, `stepOps.removeStep` (B2), `metrics.ts`, color helpers.
3. **SQL/RLS tests with pgTAP** (Supabase CLI supports `supabase test db`): `instagram_accounts` write restrictions, anon-readable columns, `send_scheduled_dms` / `reconcile_cron_sends` transitions.
4. **Webhook integration tests** behind a Supabase/Graph seam (like existing `TokenStore`): flow state machine, dedupe paths, replay of `test-payload.json`.
5. **One Playwright smoke suite** later: login → create rule → toggle → delete; link reorder + move.

---

## 14. Prioritized action plan

Ranked by impact. "Verify" = how to confirm the fix.

### P0 — Critical

| # | Item | Files | Effort | Risk | Depends on | Verify |
|---|---|---|---|---|---|---|
| ✅ 1 | SEC1 Upgrade Next to 16.4.4 | `package.json` | S | Low-med | — | `npm audit` clean for `next`; `npm run build`; smoke all routes |
| ✅ 2 | SEC2 Lock down `instagram_accounts` writes + token reads | new migration; `api/instagram/{callback,media}`; `dashboard/{accounts,rules/analytics}/page.tsx` | M | Med | — | As `authenticated` via REST: insert/update rejected, `select=access_token` denied; connect flow still works |

### P1 — High

| # | Item | Files | Effort | Risk | Depends on | Verify |
|---|---|---|---|---|---|---|
| ✅ 3 | SEC3 Lead-magnet gate | migration; `(public)/[username]/page.tsx`, `actions.ts`, `CenteredTemplate.tsx` | M | Med | — | Anon REST can't read `file_url`; view-source has no URL; email flow returns signed URL |
| ✅ 4 | R3 Execution row before public reply | `instagram-webhook/index.ts` | S | Low | — | Replay same comment concurrently → one public reply |
| ✅ 5 | R1 Inbound DM dedupe + CAS advance | webhook + migration | M | Low | — | Replay same `mid` twice → one step advance |
| ✅ 6 | B1 Atomic `save_flow` / `save_rule` | migrations; `flows/actions.ts`, `rules/actions.ts` | M | Med | (ideally 9) | Force step-insert failure → flow unchanged |
| ✅ 7 | B2 Step-removal target remap | `StepsStep.tsx` → `stepOps.ts`; `flows/actions.ts` | S | Low | — | Unit tests; delete middle step in UI, branches intact |
| ✅ 8 | B4 Analytics rollups / counts | migrations; `dashboard/analytics/page.tsx`; flows analytics/executions pages | M | Low | — | Seed >1,000 views; totals correct |
| 9 | Q1/DUP4 Shared zod schemas (automation) | `features/automation/*`, both actions + wizards | M | Med | — | Malformed payload returns validation error, not 500 |
| ✅ 10 | SEC4 Upload limits + SVG | migration; 4 forms | S-M | Low | — | Direct upload of 50 MB / `.html` rejected |
| ✅ 11 | B6 Reorder `localOrder` bug | 3 list components | S | Low | — | Drag then Move up/down moves row |
| ✅ 12 | UI1/UI2 Broken shadows + undefined tokens | ~20 files, `globals.css` | S | Low | — | Classes present in built CSS; auth input focus ring visible |
| ✅ 13 | B3 Edit page loader / FS3 decide on standalone pages | `rules/[id]/edit` + others | S | Low | — | Save via `/edit` preserves `keyword_exact` |
| 14 | R2 Ack-first webhook | webhook | M-L | Med | 4, 5 | Webhook p95 response < 1 s; no Meta retries in logs |

### P2 — Medium

| # | Item | Effort | Risk |
|---|---|---|---|
| 15 | Q2 `ActionResult<T>` across all actions | S-M | Low |
| 16 | SEC5 Public insert limits / rate limit / captcha | S-M | Low |
| ✅ 17 | SEC6 Harden `safeRedirectPath` + tests | S | Low |
| 18 | SEC7 Orphaned accounts on profile delete | S | Low |
| ✅ 19 | SEC8 URL/color validation + DB CHECKs | S | Low |
| 20 | P2 Cache root-layout `app_settings` query | M | Med (product decision) |
| 21 | P3/P4 Cache Graph calls; `cache()` `getUser` | S-M | Low |
| 22 | B5 Server-side pagination & counts | M | Low |
| 23 | DUP2/DUP3 Collections hook + action helpers | M | Low-med |
| 24 | DUP1/DUP5/DUP6 Automation tables, wizard parts, `Modal`/`FormModal` | M | Low |
| 25 | Split MessageStep / StepsStep / RulesTable / rules actions | M-L | Low |
| 26 | Webhook module split (after tests) | L | Med |
| ◐ 27 | Theme restore + UI5 scope fix; B7 ✅, B8, B9 ✅ | S | Low |
| 28 | Testing setup (§13 steps 1-3) + CI (lint, tsc, tests, build) | M | Low |
| 29 | R4 stuck `processing` sweep, error checks | M | Low |

### P3 — Low

Index on `instagram_accounts.profile_id` (R7); R6 races; SEC9-SEC11; Q4-Q13; B10-B13; DUP7-DUP14 not already covered; design-token registration + codemod (§10); delete dead files/CSS (FS1, FS2, UI7); generated DB types (FS7); `.env.example` tracking + README (FS8, FS9); fonts (P7); landing static (P8); images (P5); a11y: modal focus, `LeadMagnetCard.tsx:104` unlabeled email input, `ShareButton` popover Escape, `ConfirmAction.tsx:37` onClick on `<span>`, duplicate toggle tab stop `DashboardShell.tsx:179-213`.

### Proposed structure for the edge function

```
supabase/functions/
  _shared/
    graph/client.ts        graphGet/graphPost: Bearer auth, usage, token flagging, error parsing
    keywordMatch.ts        (exists)
    instagramToken.ts      (exists)
  instagram-webhook/
    index.ts               ~60 lines: verify, persist, route
    config.ts  types.ts
    security/signature.ts
    messaging/compose.ts   pure payload builders (shared by live send + scheduler)
    messaging/send.ts
    matching/rules.ts      selectRule() + column list constant
    flows/parse.ts         pure intent/option parsing
    flows/engine.ts        startDmFlow, advanceSession (CAS)
    gates/{follow,email}.ts
    pipeline/runRule.ts    runMatchedRule({recipient, dedupeKey, singleMessage})
    triggers/{comment,storyReply,postShare,dmKeyword,pendingEmail}.ts
```

### Proposed additions to `src/` (only where justified)

```
src/
  components/ui/          + Modal, Switch, StatusPill, Pager, PageHero, ChipInput
  features/
    automation/           NEW: constants.ts, validation.ts (zod), components/{MediaPicker,ButtonListEditor,AttachmentEditor,PublicReplySlots,AccountStep}
    leads/                MOVED from flows: LeadsTable, leadsCsv
    <domain>/queries.ts   loaders shared by modal + pages
    <domain>/schema.ts    per-entity zod schema
  lib/
    auth/getCurrentUser.ts  cache()-wrapped
    collection/             reorder/move/delete/toggle helpers
    hooks/                  useStorageUpload, useSavedFormState, useCollectionManager
    fonts.ts
    validation/url.ts       isHttpUrl, isOwnStorageUrl
  types/database.ts       generated by supabase gen types
```

---

## 15. Recommended refactoring sequence

1. **Safety net first:** add `typecheck` and `test` scripts, Vitest, CI running lint + tsc + tests + build; install Deno and run the existing 23 tests.
2. **Security P0s:** Next upgrade (SEC1) → `instagram_accounts` lockdown (SEC2) → lead-magnet gate (SEC3).
3. **Webhook correctness:** R3 → R1 → extract pure modules + tests → R2 ack-first.
4. **Data integrity:** B2 (with tests) → B1 transactional RPCs → B3/FS3.
5. **Validation & errors:** shared zod schemas (Q1) → `ActionResult` (Q2) → upload/URL/DB constraints (SEC4, SEC8).
6. **Correct numbers:** rollup RPCs (B4) → server pagination (B5).
7. **Quick UI fixes:** UI1, UI2, B6, B7, B8, B9, theme scope.
8. **Deduplication:** shared primitives (`Modal`, `Switch`, `StatusPill`, `Pager`) → automation wizard parts → collection hook/actions → table hooks → large-file splits.
9. **Design tokens:** register palette in `@theme`, codemod incrementally with visual checks.
10. **Webhook module split**, now covered by tests.

Each step is independently shippable; don't combine a refactor with a behaviour change in one PR.

---

## 16. Coverage & items requiring manual verification

**Inspected:** all of `supabase/functions/**` (webhook read fully), the RLS/security-relevant migrations (others partially), `src/proxy.ts`, `src/app/api/**`, `src/lib/**` (most), all `actions.ts` files, rules/flows/executions features (largest files fully), links/products/lead-magnets/profile/theme/socials/accounts/onboarding/auth/analytics (main files fully, some partially), `components/**`, `globals.css`, root layout, public templates, configs, `package.json`. Tooling run: `tsc --noEmit` (clean), `eslint` (1 error), `npm outdated`, `npm audit`.

**Only partly read or skimmed:** `FlowsTable.tsx` (lines 1-330 + pattern search), `FlowSessionsTable`, `ProductForm`, `LeadMagnetForm`, `ProfileForm`, `ThemeForm`, `SocialsForm`, `AccountsList`, `ConnectStep`, `OnboardingLayout`, `WizardShell`, `LinkInBioCollection`, several older migrations.

**Not read:** `HomeHero`/`HomeSections` bodies (beyond the timer/hero findings), `TopMediaCard`, `RuleLeaderboard`, `chart-primitives` body, `PerformanceTrendChart`, `TopRulesChart`, `BarList`, `mediaMetrics`, `LinkInBioPreview` (beyond structure), `ContactForm`, legal pages, settings page (beyond specific lines).

**Needs manual verification:**
- Hosted Supabase `max_rows` value (local `config.toml` = 1000) — determines exact B4 impact.
- Prod Supabase Auth settings: password length, email confirmations, redirect allow-list (SEC11).
- Whether `"/\t/evil.com"` is followed as an off-site redirect in target browsers (SEC6).
- How easily a third party can learn a target's `instagram_user_id` (SEC2 severity).
- Meta webhook retry/timeout behaviour and whether `live_comments` requires explicit subscription (R1, R2, R5).
- Whether SVG uploads execute script on the Supabase storage origin (SEC4).
- Dark-mode visual coverage (UI6) and theme restore after soft navigation — needs the app running.
- Whether Next's production build hides thrown server-action messages in this deployment (Q2).
- Branching-flow funnel accuracy (B11).
- Whether the "excluded keywords in any mode" rules/flows difference is intentional (DUP4) — product decision.
- Circular dependencies — not tool-checked (e.g. `npx madge --circular src` would confirm).
- Existing Deno tests were not executed (Deno not installed).
