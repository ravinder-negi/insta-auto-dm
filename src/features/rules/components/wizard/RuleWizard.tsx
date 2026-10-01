"use client";

import { useActionState, useState } from "react";
import type { RuleFormState } from "@/features/rules/actions";
import { AccountStep } from "./AccountStep";
import { KeywordStep } from "./KeywordStep";
import { MessageStep } from "./MessageStep";
import { PostStep } from "./PostStep";
import { TriggerStep } from "./TriggerStep";
import { WizardShell, type WizardStepMeta } from "./WizardShell";
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
import { useInstagramMedia } from "./useInstagramMedia";

function getSteps(triggerType: TriggerType): WizardStepMeta[] {
  const isStory = triggerType === "story_reply";
  const isLive = triggerType === "live_comment";

  return [
    {
      title: "Trigger",
      description: "Choose what starts this AutoDM.",
    },
    {
      title: "Account & name",
      description:
        "Pick the Instagram account this AutoDM runs on and give it a name you'll recognize.",
    },
    {
      title: isStory ? "Trigger story" : isLive ? "Trigger live" : "Trigger post",
      description: isStory
        ? "Choose which story the reply has to be on."
        : isLive
          ? "Every comment on any of your Lives is checked — a Live can't be picked ahead of time."
          : "Choose which post or reel the comment has to be on.",
    },
    {
      title: isStory ? "Reply trigger" : "Comment trigger",
      description: isStory
        ? "Decide which story replies start this automation."
        : isLive
          ? "Decide which Live comments start this automation, and whether to reply publicly."
          : "Decide which comments start this automation, and whether to reply publicly.",
    },
    {
      title: "DM message",
      description: "Write the DM that gets sent, and how it should be delivered.",
    },
  ];
}

export interface RuleWizardInitialValues {
  instagram_account_id: string;
  name: string;
  trigger_type?: string | null;
  keyword_match: string | null;
  keywords: string[] | null;
  excluded_keywords: string[] | null;
  instagram_media_id: string | null;
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
  followups: RuleFollowupValue[];
  attachment_url: string | null;
  attachment_type: string | null;
}

export function RuleWizard({
  accounts,
  action,
  initialValues,
  submitLabel,
}: {
  accounts: RuleWizardAccountOption[];
  action: (state: RuleFormState, formData: FormData) => Promise<RuleFormState>;
  initialValues?: RuleWizardInitialValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<RuleFormState, FormData>(
    action,
    undefined
  );

  const [step, setStep] = useState(0);
  const [manualEntry, setManualEntry] = useState(false);
  const [values, setValues] = useState<RuleWizardValues>(() => ({
    instagram_account_id:
      initialValues?.instagram_account_id ?? accounts[0]?.id ?? "",
    name: initialValues?.name ?? "",
    trigger_type:
      (initialValues?.trigger_type as TriggerType) ?? "comment_keyword",
    // An existing rule without a media id is an account-wide one.
    media_scope: initialValues
      ? initialValues.instagram_media_id
        ? "specific"
        : "any"
      : "specific",
    instagram_media_id: initialValues?.instagram_media_id ?? "",
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
    }));
  }

  // A post id and a story id are different spaces, and public comment
  // replies don't apply to a story-reply DM thread. A Live's media id
  // doesn't exist until the broadcast starts, so it can't be picked ahead
  // of time — live_comment rules are always account-wide.
  function selectTriggerType(triggerType: TriggerType) {
    setValues((current) => ({
      ...current,
      trigger_type: triggerType,
      instagram_media_id: "",
      media_scope: triggerType === "live_comment" ? "any" : current.media_scope,
      send_public_reply: triggerType === "story_reply" ? false : current.send_public_reply,
    }));
  }

  function selectScope(scope: MediaScope) {
    setValues((current) => ({
      ...current,
      media_scope: scope,
      instagram_media_id: scope === "specific" ? current.instagram_media_id : "",
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

  const stepValid = [
    true,
    Boolean(values.instagram_account_id) && values.name.trim().length > 0,
    values.media_scope !== "specific" ||
      values.instagram_media_id.trim().length > 0,
    (values.keyword_match === "any" || values.keywords.length > 0) &&
      (!values.send_public_reply || publicReplies.length > 0),
    values.dm_message.trim().length > 0 &&
      (!values.require_follow || values.follow_prompt_message.trim().length > 0) &&
      (!values.collect_email || values.email_prompt_message.trim().length > 0) &&
      delaySeconds > 0 &&
      buttonsValid &&
      followupsValid,
  ];

  const steps = getSteps(values.trigger_type);
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
        <input
          type="hidden"
          name="dm_button_card_title"
          value={values.dm_button_card_title}
        />
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
        pending={pending}
        nextLabel={isLastStep ? submitLabel : "Next"}
        cancelHref="/dashboard/rules"
        error={state?.error}
      >
        {step === 0 && (
          <TriggerStep value={values.trigger_type} onChange={selectTriggerType} />
        )}

        {step === 1 && (
          <AccountStep
            accounts={accounts}
            selectedAccountId={values.instagram_account_id}
            onSelectAccount={selectAccount}
            name={values.name}
            onNameChange={(value) => update("name", value)}
          />
        )}

        {step === 2 && (
          <PostStep
            account={account}
            triggerType={values.trigger_type}
            scope={values.media_scope}
            onScopeChange={selectScope}
            mediaId={values.instagram_media_id}
            onMediaIdChange={(id) => update("instagram_media_id", id)}
            items={media.items}
            loading={media.loading}
            error={media.error}
            manualEntry={manualEntry}
            onManualEntryChange={setManualEntry}
          />
        )}

        {step === 3 && <KeywordStep values={values} update={update} />}

        {step === 4 && <MessageStep values={values} update={update} />}
      </WizardShell>
    </form>
  );
}
