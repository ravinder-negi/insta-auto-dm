"use client";

import { useActionState, useEffect, useState } from "react";
import { WizardShell, type WizardStepMeta } from "@/components/ui/WizardShell";
import { useInstagramMedia } from "@/lib/hooks/useInstagramMedia";
import type { FlowFormState, FlowStepInput } from "@/features/flows/actions";
import { AccountStep } from "./AccountStep";
import { SettingsStep } from "./SettingsStep";
import { StepsStep } from "./StepsStep";
import { TriggerStep } from "./TriggerStep";
import {
  DEFAULT_PUBLIC_REPLY_MESSAGES,
  emptyStep,
  type FlowWizardAccountOption,
  type KeywordMatch,
  type MediaScope,
} from "./shared";

const STEPS: WizardStepMeta[] = [
  {
    title: "Account & name",
    description: "Pick the Instagram account this flow runs on and give it a name you'll recognize.",
  },
  {
    title: "Trigger",
    description: "Choose which post or reel the comment has to be on, and the keyword that starts the flow.",
  },
  {
    title: "Flow steps",
    description: "Define the sequence of DMs this flow sends, one at a time.",
  },
  {
    title: "Additional settings",
    description: "Customize how this flow works.",
  },
];

export interface FlowWizardInitialValues {
  instagram_account_id: string;
  name: string;
  keyword_match: KeywordMatch;
  keywords: string[];
  excluded_keywords: string[];
  /** Legacy single-keyword column, used when a flow predates keyword sets. */
  trigger_keyword: string | null;
  instagram_media_id: string | null;
  send_public_reply: boolean;
  public_reply_messages: string[];
  /** Legacy single-reply column, used when a flow predates reply slots. */
  public_reply_message: string | null;
  steps: FlowStepInput[];
}

export function FlowWizard({
  accounts,
  action,
  initialValues,
  submitLabel,
  onCancel,
  onSuccess,
}: {
  accounts: FlowWizardAccountOption[];
  action: (state: FlowFormState, formData: FormData) => Promise<FlowFormState>;
  initialValues?: FlowWizardInitialValues;
  submitLabel: string;
  /** Renders Cancel as a button instead of a link to "/dashboard/flows" —
   *  used when the wizard runs inside a modal. */
  onCancel?: () => void;
  /** Called when `action` reports success without redirecting — used inside
   *  a modal, which closes itself instead of navigating away. */
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState<FlowFormState, FormData>(
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

  const [selectedAccountId, setSelectedAccountId] = useState(
    initialValues?.instagram_account_id ?? accounts[0]?.id ?? ""
  );
  const [name, setName] = useState(initialValues?.name ?? "");
  // An existing flow without a media id is an account-wide one.
  const [mediaScope, setMediaScope] = useState<MediaScope>(
    initialValues ? (initialValues.instagram_media_id ? "specific" : "any") : "specific"
  );
  const [instagramMediaId, setInstagramMediaId] = useState(
    initialValues?.instagram_media_id ?? ""
  );
  const [keywordMatch, setKeywordMatch] = useState<KeywordMatch>(
    initialValues?.keyword_match ?? "specific"
  );
  const [keywords, setKeywords] = useState<string[]>(
    initialValues?.keywords?.length
      ? initialValues.keywords
      : initialValues?.trigger_keyword
        ? [initialValues.trigger_keyword]
        : []
  );
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>(
    initialValues?.excluded_keywords ?? []
  );
  const [steps, setSteps] = useState<FlowStepInput[]>(
    initialValues?.steps?.length ? initialValues.steps : [emptyStep()]
  );
  const [sendPublicReply, setSendPublicReply] = useState(
    initialValues?.send_public_reply ?? false
  );
  const [publicReplyMessages, setPublicReplyMessages] = useState<string[]>(
    initialValues?.public_reply_messages?.length
      ? initialValues.public_reply_messages
      : initialValues?.public_reply_message
        ? [initialValues.public_reply_message]
        : DEFAULT_PUBLIC_REPLY_MESSAGES
  );

  const account = accounts.find((option) => option.id === selectedAccountId);
  const media = useInstagramMedia(selectedAccountId, "post");

  // A post picked on one account is meaningless on another, so switching
  // accounts clears the selection along with it.
  function selectAccount(id: string) {
    setSelectedAccountId(id);
    setInstagramMediaId("");
  }

  function selectScope(scope: MediaScope) {
    setMediaScope(scope);
    if (scope !== "specific") setInstagramMediaId("");
  }

  const stepsValid = steps.every((flowStep) => {
    if (!flowStep.message_text.trim()) return false;
    if (flowStep.attachment_url && !/^https:\/\/\S+$/.test(flowStep.attachment_url)) return false;
    if (
      flowStep.expects_reply &&
      flowStep.followup_enabled &&
      (!flowStep.followup_delay_hours ||
        flowStep.followup_delay_hours <= 0 ||
        !flowStep.followup_message?.trim())
    ) {
      return false;
    }
    if (
      flowStep.expects_reply &&
      !flowStep.collects_email &&
      flowStep.options.length > 0 &&
      flowStep.options.some((option) => !option.label.trim())
    ) {
      return false;
    }
    return true;
  });

  const stepValid = [
    Boolean(selectedAccountId) && name.trim().length > 0,
    (mediaScope !== "specific" || instagramMediaId.trim().length > 0) &&
      (keywordMatch !== "specific" || keywords.length > 0),
    steps.length > 0 && stepsValid,
    !sendPublicReply || (publicReplyMessages[0]?.trim().length ?? 0) > 0,
  ];

  const isLastStep = step === STEPS.length - 1;

  return (
    <form
      action={formAction}
      // Enter inside a text field would otherwise submit a half-filled flow
      // from any step; the footer button is the only way to save.
      onKeyDown={(event) => {
        if (event.key === "Enter" && !(event.target instanceof HTMLTextAreaElement)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="instagram_account_id" value={selectedAccountId} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="keyword_match" value={keywordMatch} />
      <input type="hidden" name="keywords" value={JSON.stringify(keywords)} />
      <input
        type="hidden"
        name="excluded_keywords"
        value={JSON.stringify(excludedKeywords)}
      />
      <input
        type="hidden"
        name="instagram_media_id"
        value={mediaScope === "specific" ? instagramMediaId : ""}
      />
      {sendPublicReply && (
        <>
          <input type="hidden" name="send_public_reply" value="on" />
          <input
            type="hidden"
            name="public_reply_messages"
            value={JSON.stringify(publicReplyMessages)}
          />
        </>
      )}
      <input type="hidden" name="steps" value={JSON.stringify(steps)} />

      <WizardShell
        steps={STEPS}
        current={step}
        onBack={step > 0 ? () => setStep((value) => value - 1) : undefined}
        onNext={isLastStep ? undefined : () => setStep((value) => value + 1)}
        canContinue={stepValid[step]}
        pending={pending}
        nextLabel={isLastStep ? submitLabel : "Next"}
        cancelHref={onCancel ? undefined : "/dashboard/flows"}
        onCancel={onCancel}
        error={state && "error" in state ? state.error : undefined}
      >
        {step === 0 && (
          <AccountStep
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelectAccount={selectAccount}
            name={name}
            onNameChange={setName}
          />
        )}

        {step === 1 && (
          <TriggerStep
            account={account}
            scope={mediaScope}
            onScopeChange={selectScope}
            mediaId={instagramMediaId}
            onMediaIdChange={setInstagramMediaId}
            items={media.items}
            loading={media.loading}
            error={media.error}
            manualEntry={manualEntry}
            onManualEntryChange={setManualEntry}
            keywordMatch={keywordMatch}
            onKeywordMatchChange={setKeywordMatch}
            keywords={keywords}
            onKeywordsChange={setKeywords}
            excludedKeywords={excludedKeywords}
            onExcludedKeywordsChange={setExcludedKeywords}
          />
        )}

        {step === 2 && <StepsStep steps={steps} onChange={setSteps} />}

        {step === 3 && (
          <SettingsStep
            sendPublicReply={sendPublicReply}
            onSendPublicReplyChange={setSendPublicReply}
            publicReplyMessages={publicReplyMessages}
            onPublicReplyMessagesChange={setPublicReplyMessages}
          />
        )}
      </WizardShell>
    </form>
  );
}
