import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: "Data Deletion Instructions — Auto DM",
  description:
    "How to disconnect your Instagram account and request deletion of your Auto DM data.",
};

export default function DataDeletionPage() {
  return (
    <LegalPage title="Data Deletion Instructions" updated="November 18, 2026">
      <p>
        You can remove your data from Auto DM at any time, either by
        disconnecting your Instagram account or by deleting your Auto DM
        account.
      </p>

      <LegalSection heading="1. Disconnect your Instagram account">
        <p>
          From your Auto DM dashboard, go to{" "}
          <strong>Settings → Manage accounts</strong> and select{" "}
          <strong>Disconnect</strong> next to your Instagram account. This
          immediately and permanently removes that Instagram account from
          Auto DM and stops all automations for it.
        </p>
      </LegalSection>

      <LegalSection heading="2. Delete your account and all data">
        <p>
          From your Auto DM dashboard, go to <strong>Settings → Delete account</strong>,
          type <strong>DELETE</strong> to confirm, and select{" "}
          <strong>Delete account</strong>. This immediately and permanently
          deletes your profile, connected Instagram accounts, automations,
          stored conversations, comments, lead data, and uploaded files.
        </p>
        <p>
          If you can&apos;t sign in, send us a message from our{" "}
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

      <LegalSection heading="3. What gets deleted and when">
        <p>
          Disconnecting an Instagram account removes that connection and its
          automations immediately. Historical comment and DM records already
          processed through those automations are retained, tied to your
          Auto DM account, until you delete your account — at which point we
          permanently delete your profile and all associated data. Some information may be retained for a limited time where
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
