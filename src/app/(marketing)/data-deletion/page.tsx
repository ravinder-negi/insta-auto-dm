import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "../_components/LegalPage";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Data Deletion Instructions — DMLink",
  description:
    "How to disconnect your Instagram account and request deletion of your DMLink data.",
};

export default function DataDeletionPage() {
  return (
    <LegalPage title="Data Deletion Instructions" updated="November 25, 2026">
      <p>
        You can remove your data from DMLink at any time, either by
        disconnecting your Instagram account or by deleting your DMLink
        account.
      </p>

      <LegalSection heading="1. Disconnect your Instagram account">
        <p>
          From your DMLink dashboard, go to{" "}
          <strong>Settings → Manage accounts</strong> and select{" "}
          <strong>Disconnect</strong> next to your Instagram account. We
          remove the account from DMLink right away and delete everything that
          came from it: automations, leads, and comment and DM history. Your
          DMLink login stays, so you can connect another account later.
        </p>
      </LegalSection>

      <LegalSection heading="2. Delete your account and all data">
        <p>
          From your DMLink dashboard, go to <strong>Settings → Delete account</strong>,
          type <strong>DELETE</strong> to confirm, and select{" "}
          <strong>Delete account</strong>. This immediately and permanently
          deletes your profile, connected Instagram accounts, automations,
          stored conversations, comments, lead data, and uploaded files.
        </p>
        <p>
          If you can&apos;t sign in, email us at{" "}
          <a
            href={`mailto:${COMPANY.email}`}
            className="font-medium text-[var(--accent)] underline hover:no-underline"
          >
            {COMPANY.email}
          </a>{" "}
          or send us a message from our{" "}
          <Link
            href="/contact"
            className="font-medium text-[var(--accent)] underline hover:no-underline"
          >
            contact page
          </Link>{" "}
          with the subject &quot;Data Deletion Request&quot; and the email
          address associated with your account. We verify the request against
          the account on file, delete your data within 30 days, and confirm by
          email once deletion is complete.
        </p>
      </LegalSection>

      <LegalSection heading="3. Remove DMLink from Facebook">
        <p>
          You can also remove DMLink from your Facebook settings, under{" "}
          <strong>Settings &amp; privacy → Settings → Business integrations</strong>.
          This stops DMLink from using your Instagram account, so your
          automations stop working. But it doesn&apos;t delete anything we
          already have. To delete your data, follow Section 1 or Section 2
          above.
        </p>
      </LegalSection>

      <LegalSection heading="4. What gets deleted and when">
        <p>
          Disconnecting an Instagram account deletes that account&apos;s data
          right away, including its comment and DM history. Deleting your
          DMLink account deletes your profile and everything else right away.
          Some information may be retained for a limited time where
          required to comply with legal obligations, resolve disputes, or
          enforce our agreements, as described in our{" "}
          <Link
            href="/privacy"
            className="font-medium text-[var(--accent)] underline hover:no-underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
