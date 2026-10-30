"use client";

import { useActionState, useEffect, useState } from "react";
import type { RuleFormState } from "@/features/rules/actions";
import { WizardShell, type WizardStepMeta } from "@/components/ui/WizardShell";
import { useInstagramMedia } from "@/lib/hooks/useInstagramMedia";
import { AccountStep } from "./AccountStep";
import { KeywordStep } from "./KeywordStep";
import { MessageStep } from "./MessageStep";
import { PostStep } from "./PostStep";
import { TriggerStep } from "./TriggerStep";
import {
  DEFAULT_CARD_TITLE,
  DEFAULT_DM_MESSAGE,
  DEFAULT_EMAIL_PROMPT_MESSAGE,
  DEFAULT_FOLLOW_PROMPT_MESSAGE,
  DEFAULT_PUBLIC_REPLY_MESSAGES,
  delayFromSeconds,
  delayToSeconds,
  followupToMinutes,
  type KeywordMatch,
  type MediaScope,
  type RuleButtonValue,
  type RuleFollowupValue,
  type RuleWizardAccountOption,
  type RuleWizardValues,
  type TriggerType,
} from "./shared";

/** A shared post/reel carries no text, so there's no keyword to match — that
 *  step is meaningless for post_share and is dropped from the wizard
 *  entirely rather than shown empty. The post it was shared from can still
 *  be picked (matched by shortcode — see shared.ts). */
type StepKind = "trigger" | "account" | "post" | "keyword" | "message";

function stepKindsFor(triggerType: TriggerType): StepKind[] {
  if (triggerType === "post_share") return ["trigger", "account", "post", "message"];
  return ["trigger", "account", "post", "keyword", "message"];
}

function getSteps(triggerType: TriggerType): (WizardStepMeta & { kind: StepKind })[] {
  const isStory = triggerType === "story_reply";
  const isLive = triggerType === "live_comment";
  const isShare = triggerType === "post_share";

  const metaByKind: Record<StepKind, WizardStepMeta> = {
    trigger: {
      title: "Trigger",
      description: "Choose what starts this AutoDM.",
    },
    account: {
      title: "Account & name",
      description:
        "Pick the Instagram account this AutoDM runs on and give it a name you'll recognize.",
    },
    post: {
      title: isStory ? "Trigger story" : isLive ? "Trigger live" : "Trigger post",
      description: isStory
        ? "Choose which story the reply has to be on."
        : isLive
          ? "Every comment on any of your Lives is checked — a Live can't be picked ahead of time."
          : isShare
            ? "Choose which post or reel has to be shared into the DM."
            : "Choose which post or reel the comment has to be on.",
    },
    keyword: {
      title: isStory ? "Reply trigger" : "Comment trigger",
      description: isStory
        ? "Decide which story replies start this automation."
        : isLive
          ? "Decide which Live comments start this automation, and whether to reply publicly."
          : "Decide which comments start this automation, and whether to reply publicly.",
    },
    message: {
      title: "DM message",
      description: "Write the DM that gets sent, and how it should be delivered.",
    },
  };

  return stepKindsFor(triggerType).map((kind) => ({ ...metaByKind[kind], kind }));
}

export interface RuleWizardInitialValues {
  instagram_account_id: string;
  name: string;
  trigger_type?: string | null;
  keyword_match: string | null;
  keywords: string[] | null;
  excluded_keywords: string[] | null;
  instagram_media_id: string | null;
  instagram_media_shortcode: string | null;
  dm_message: string;
  require_follow: boolean;
  follow_prompt_message: string | null;
  send_public_reply: boolean;
  public_reply_messages: string[] | null;
  collect_email: boolean;
  email_prompt_message: string | null;
  send_delay_seconds: number | null;
  dm_buttons: RuleButtonValue[] | null;
  dm_button_card_title: string | null;
  dm_card_subtitle: string | null;
  dm_default_action_url: string | null;
  followups: RuleFollowupValue[];
  attachment_url: string | null;
  attachment_type: string | null;
}

export function RuleWizard({
  accounts,
  action,
  initialValues,
  submitLabel,
  onCancel,
  onSuccess,
}: {
  accounts: RuleWizardAccountOption[];
  action: (state: RuleFormState, formData: FormData) => Promise<RuleFormState>;
  initialValues?: RuleWizardInitialValues;
  submitLabel: string;
  /** Renders Cancel as a button instead of a link to "/dashboard/rules" —
   *  used when the wizard runs inside a modal. */
  onCancel?: () => void;
  /** Called when `action` reports success without redirecting — used inside
   *  a modal, which closes itself instead of navigating away. */
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState<RuleFormState, FormData>(
    action,
    undefined
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const [step, setStep] = useState(0);
  const [manualEntry, setManualEntry] = useState(false);
  const [values, setValues] = useState<RuleWizardValues>(() => ({
    instagram_account_id:
      initialValues?.instagram_account_id ?? accounts[0]?.id ?? "",
    name: initialValues?.name ?? "",
    trigger_type:
      (initialValues?.trigger_type as TriggerType) ?? "comment_keyword",
    // An existing rule without a media id (or, for post_share, a shortcode)
    // is an account-wide one.
    media_scope: initialValues
      ? initialValues.trigger_type === "post_share"
        ? initialValues.instagram_media_shortcode
          ? "specific"
          : "any"
        : initialValues.instagram_media_id
          ? "specific"
          : "any"
      : "specific",
    instagram_media_id: initialValues?.instagram_media_id ?? "",
    instagram_media_shortcode: initialValues?.instagram_media_shortcode ?? "",
    keyword_match: (initialValues?.keyword_match as KeywordMatch) ?? "specific",
    keywords: initialValues?.keywords ?? [],
    excluded_keywords: initialValues?.excluded_keywords ?? [],
    // New AutoDMs start from a usable message; an existing one keeps its own,
    // including a blank it was saved with.
    dm_message: initialValues ? initialValues.dm_message : DEFAULT_DM_MESSAGE,
    require_follow: initialValues?.require_follow ?? false,
    follow_prompt_message:
      initialValues?.follow_prompt_message ?? DEFAULT_FOLLOW_PROMPT_MESSAGE,
    send_public_reply: initialValues?.send_public_reply ?? false,
    public_reply_messages: initialValues?.public_reply_messages?.length
      ? initialValues.public_reply_messages
      : DEFAULT_PUBLIC_REPLY_MESSAGES,
    collect_email: initialValues?.collect_email ?? false,
    email_prompt_message:
      initialValues?.email_prompt_message ?? DEFAULT_EMAIL_PROMPT_MESSAGE,
    send_delay_value: delayFromSeconds(initialValues?.send_delay_seconds ?? 0)
      .value,
    send_delay_unit: delayFromSeconds(initialValues?.send_delay_seconds ?? 0)
      .unit,
    dm_buttons: initialValues?.dm_buttons ?? [],
    dm_button_card_title:
      initialValues?.dm_button_card_title ?? DEFAULT_CARD_TITLE,
    dm_card_subtitle: initialValues?.dm_card_subtitle ?? "",
    dm_default_action_url: initialValues?.dm_default_action_url ?? "",
    followups: initialValues?.followups ?? [],
    attachment_url: initialValues?.attachment_url ?? "",
    attachment_type: initialValues?.attachment_type ?? "image",
  }));

  function update<K extends keyof RuleWizardValues>(
    key: K,
    value: RuleWizardValues[K]
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const media = useInstagramMedia(
    values.instagram_account_id,
    values.trigger_type === "story_reply"
      ? "story"
      : values.trigger_type === "live_comment"
        ? "none"
        : "post"
  );
  const account = accounts.find(
    (option) => option.id === values.instagram_account_id
  );

  // A post picked on one account is meaningless on another, so switching
  // accounts clears the selection along with it.
  function selectAccount(id: string) {
    setValues((current) => ({
      ...current,
      instagram_account_id: id,
      instagram_media_id: "",
      instagram_media_shortcode: "",
    }));
  }

  // A post id and a story id are different spaces, and public comment
  // replies don't apply to a story-reply or post-share DM thread. A Live's
  // media id doesn't exist until the broadcast starts, so it can't be picked
  // ahead of time — live_comment rules are always account-wide. A shared
  // post carries no text, so there's no keyword to match either.
  function selectTriggerType(triggerType: TriggerType) {
    setValues((current) => ({
      ...current,
      trigger_type: triggerType,
      instagram_media_id: "",
      instagram_media_shortcode: "",
      media_scope: triggerType === "live_comment" ? "any" : current.media_scope,
      keyword_match: triggerType === "post_share" ? "any" : current.keyword_match,
      send_public_reply:
        triggerType === "story_reply" || triggerType === "post_share"
          ? false
          : current.send_public_reply,
    }));
  }

  function selectScope(scope: MediaScope) {
    setValues((current) => ({
      ...current,
      media_scope: scope,
      instagram_media_id:
        scope === "specific" ? current.instagram_media_id : "",
      instagram_media_shortcode:
        scope === "specific" ? current.instagram_media_shortcode : "",
    }));
  }

  const publicReplies = values.public_reply_messages
    .map((message) => message.trim())
    .filter(Boolean);

  const buttonsValid = values.dm_buttons.every(
    (button) =>
      button.label.trim().length > 0 && /^https:\/\/\S+$/.test(button.url.trim())
  ) &&
    (values.dm_buttons.length === 0 ||
      values.dm_button_card_title.trim().length > 0);

  const followupsValid = values.followups.every(
    (followup) =>
      followup.message.trim().length > 0 && followupToMinutes(followup) > 0
  );

  const delaySeconds = delayToSeconds(
    values.send_delay_value,
    values.send_delay_unit
  );

  const messageStepValid =
    // With buttons, the card can carry the whole message — the separate DM
    // text becomes optional extra copy. An attachment is sent on its own.
    (values.dm_message.trim().length > 0 ||
      values.dm_buttons.length > 0 ||
      values.attachment_url.trim().length > 0) &&
    (!values.require_follow || values.follow_prompt_message.trim().length > 0) &&
    (!values.collect_email || values.email_prompt_message.trim().length > 0) &&
    delaySeconds > 0 &&
    buttonsValid &&
    followupsValid;

  const stepValidByKind: Record<StepKind, boolean> = {
    trigger: true,
    account: Boolean(values.instagram_account_id) && values.name.trim().length > 0,
    post:
      values.media_scope !== "specific" ||
      (values.trigger_type === "post_share"
        ? values.instagram_media_shortcode.trim().length > 0
        : values.instagram_media_id.trim().length > 0),
    keyword:
      (values.keyword_match === "any" || values.keywords.length > 0) &&
      (!values.send_public_reply || publicReplies.length > 0),
    message: messageStepValid,
  };

  const steps = getSteps(values.trigger_type);
  const stepValid = steps.map((meta) => stepValidByKind[meta.kind]);
  const isLastStep = step === steps.length - 1;

  return (
    <form
      action={formAction}
      // Enter inside a text field would otherwise submit a half-filled rule
      // from any step; the footer button is the only way to save.
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          !(event.target instanceof HTMLTextAreaElement)
        ) {
          event.preventDefault();
        }
      }}
    >
      <input
        type="hidden"
        name="instagram_account_id"
        value={values.instagram_account_id}
      />
      <input type="hidden" name="name" value={values.name} />
      <input type="hidden" name="trigger_type" value={values.trigger_type} />
      <input
        type="hidden"
        name="instagram_media_id"
        value={values.media_scope === "specific" ? values.instagram_media_id : ""}
      />
      <input
        type="hidden"
        name="instagram_media_shortcode"
        value={
          values.media_scope === "specific"
            ? values.instagram_media_shortcode
            : ""
        }
      />
      <input type="hidden" name="keyword_match" value={values.keyword_match} />
      {values.keyword_match === "specific" &&
        values.keywords.map((keyword) => (
          <input key={keyword} type="hidden" name="keywords" value={keyword} />
        ))}
      {values.keyword_match === "specific" &&
        values.excluded_keywords.map((keyword) => (
          <input
            key={keyword}
            type="hidden"
            name="excluded_keywords"
            value={keyword}
          />
        ))}
      <input type="hidden" name="dm_message" value={values.dm_message} />
      {values.require_follow && (
        <>
          <input type="hidden" name="require_follow" value="on" />
          <input
            type="hidden"
            name="follow_prompt_message"
            value={values.follow_prompt_message}
          />
        </>
      )}
      {values.send_public_reply && (
        <>
          <input type="hidden" name="send_public_reply" value="on" />
          {publicReplies.map((message, index) => (
            <input
              key={index}
              type="hidden"
              name="public_reply_messages"
              value={message}
            />
          ))}
        </>
      )}
      {values.collect_email && (
        <>
          <input type="hidden" name="collect_email" value="on" />
          <input
            type="hidden"
            name="email_prompt_message"
            value={values.email_prompt_message}
          />
        </>
      )}
      <input
        type="hidden"
        name="send_delay_value"
        value={values.send_delay_value || "0"}
      />
      <input
        type="hidden"
        name="send_delay_unit"
        value={values.send_delay_unit}
      />
      <input
        type="hidden"
        name="dm_buttons"
        value={JSON.stringify(
          values.dm_buttons.map((button) => ({
            label: button.label.trim(),
            url: button.url.trim(),
          }))
        )}
      />
      {values.dm_buttons.length > 0 && (
        <>
          <input
            type="hidden"
            name="dm_button_card_title"
            value={values.dm_button_card_title}
          />
          <input
            type="hidden"
            name="dm_card_subtitle"
            value={values.dm_card_subtitle}
          />
          <input
            type="hidden"
            name="dm_default_action_url"
            value={values.dm_default_action_url}
          />
        </>
      )}
      {values.followups.map((followup, index) => (
        <span key={index}>
          <input
            type="hidden"
            name="followup_delay_minutes"
            value={followupToMinutes(followup)}
          />
          <input
            type="hidden"
            name="followup_message"
            value={followup.message}
          />
        </span>
      ))}
      <input
        type="hidden"
        name="attachment_url"
        value={values.attachment_url}
      />
      <input
        type="hidden"
        name="attachment_type"
        value={values.attachment_type}
      />

      <WizardShell
        steps={steps}
        current={step}
        onBack={step > 0 ? () => setStep((value) => value - 1) : undefined}
        onNext={isLastStep ? undefined : () => setStep((value) => value + 1)}
        canContinue={stepValid[step]}
        stepValid={stepValid}
        onStepSelect={setStep}
        pending={pending}
        nextLabel={isLastStep ? submitLabel : "Next"}
        cancelHref={onCancel ? undefined : "/dashboard/rules"}
        onCancel={onCancel}
        error={state && "error" in state ? state.error : undefined}
      >
        {steps[step]?.kind === "trigger" && (
          <TriggerStep
            value={values.trigger_type}
            onChange={selectTriggerType}
            locked={Boolean(initialValues)}
          />
        )}

        {steps[step]?.kind === "account" && (
          <AccountStep
            accounts={accounts}
            selectedAccountId={values.instagram_account_id}
            onSelectAccount={selectAccount}
            name={values.name}
            onNameChange={(value) => update("name", value)}
            locked={Boolean(initialValues)}
          />
        )}

        {steps[step]?.kind === "post" && (
          <PostStep
            account={account}
            triggerType={values.trigger_type}
            scope={values.media_scope}
            onScopeChange={selectScope}
            mediaId={values.instagram_media_id}
            onMediaIdChange={(id) => update("instagram_media_id", id)}
            shortcode={values.instagram_media_shortcode}
            onShortcodeChange={(shortcode) =>
              update("instagram_media_shortcode", shortcode)
            }
            items={media.items}
            loading={media.loading}
            error={media.error}
            manualEntry={manualEntry}
            onManualEntryChange={setManualEntry}
          />
        )}

        {steps[step]?.kind === "keyword" && (
          <KeywordStep values={values} update={update} />
        )}

        {steps[step]?.kind === "message" && (
          <MessageStep values={values} update={update} />
        )}
      </WizardShell>
    </form>
  );
}
