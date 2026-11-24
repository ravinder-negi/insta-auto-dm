import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { LegalPage, LegalSection } from "../../_components/LegalPage";

export const metadata: Metadata = {
  title: "Data Deletion Status — DMLink",
  description: "Check the status of a data deletion request sent from Facebook.",
  robots: { index: false, follow: false },
};

/** Codes are 12 random bytes as hex (see /api/meta/data-deletion). */
const CODE_PATTERN = /^[a-f0-9]{24}$/;

type DeletionRequest = {
  status: "completed" | "no_data";
  deleted_accounts: number;
  created_at: string;
};

export default async function DataDeletionStatusPage(
  props: PageProps<"/data-deletion/status">,
) {
  const codeParam = (await props.searchParams).code;
  const code = (Array.isArray(codeParam) ? codeParam[0] : codeParam)?.trim().toLowerCase();

  const deletionRequest = code && CODE_PATTERN.test(code) ? await findRequest(code) : null;

  return (
    <LegalPage title="Data Deletion Status" updated="November 19, 2026">
      {deletionRequest ? (
        <LegalSection heading={headingFor(deletionRequest)}>
          <p>
            Confirmation code: <strong className="font-mono">{code}</strong>
          </p>
          <p>Received: {formatDate(deletionRequest.created_at)}</p>
          {deletionRequest.status === "completed" ? (
            <p>
              We deleted {deletionRequest.deleted_accounts === 1
                ? "the Instagram account"
                : `${deletionRequest.deleted_accounts} Instagram accounts`}{" "}
              you connected through Facebook, along with the access tokens,
              automations, and stored comment, DM and lead data.
            </p>
          ) : (
            <p>
              We found no Instagram accounts connected to DMLink through your
              Facebook login, so there was no data from Facebook to delete.
            </p>
          )}
          <p>
            Your DMLink sign-in and profile are separate from Facebook. To
            delete those too, follow the{" "}
            <DeletionLink />.
          </p>
        </LegalSection>
      ) : (
        <LegalSection heading="Request not found">
          <p>
            We couldn&apos;t find a data deletion request with that
            confirmation code. Check the link Facebook gave you, or see our{" "}
            <DeletionLink />.
          </p>
        </LegalSection>
      )}
    </LegalPage>
  );
}

async function findRequest(code: string): Promise<DeletionRequest | null> {
  const { data, error } = await createAdminClient()
    .from("data_deletion_requests")
    .select("status, deleted_accounts, created_at")
    .eq("confirmation_code", code)
    .maybeSingle();

  if (error) {
    console.error("[data-deletion/status] lookup failed:", error.message);
    return null;
  }
  return data as DeletionRequest | null;
}

function headingFor(request: DeletionRequest) {
  return request.status === "completed" ? "Your data has been deleted" : "Request complete";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function DeletionLink() {
  return (
    <Link
      href="/data-deletion"
      className="font-medium text-[var(--accent)] underline hover:no-underline"
    >
      data deletion instructions
    </Link>
  );
}
