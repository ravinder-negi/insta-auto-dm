import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Auto DM",
  description:
    "How Auto DM collects, uses, and protects your data when you connect your Instagram account.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 5, 2026">
      <p>
        Auto DM (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) provides tools that help
        Instagram creators and businesses automate replies, direct messages, and
        lead capture. This policy explains what information we collect, how we
        use it, and the choices you have — including the data we access through
        Meta&apos;s Instagram and Facebook APIs.
      </p>

      <LegalSection heading="1. Information we collect">
        <p>
          <strong>Account information.</strong> When you sign up, we collect
          your name, email address, and password (stored as a secure hash).
        </p>
        <p>
          <strong>Instagram &amp; Facebook data.</strong> When you connect your
          Instagram professional account via Meta&apos;s Login and Graph API, we
          receive and store the access tokens, your Instagram business account
          ID, username, and profile picture needed to operate the service. To
          run the automations you configure, we also process:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Comments on your posts and reels, and the commenter&apos;s
            Instagram‑scoped user ID, so we can detect trigger keywords and
            send a reply or DM.
          </li>
          <li>
            Story replies and mentions sent to your account, for story‑reply
            automations.
          </li>
          <li>
            Direct message conversations your account sends or receives
            through Auto DM, including message content, attachments, and
            timestamps, so conversations can be delivered, logged, and shown
            back to you in your dashboard.
          </li>
          <li>
            Basic engagement metrics (likes, reach, follower counts) used to
            power the analytics shown in your dashboard.
          </li>
        </ul>
        <p>
          <strong>Leads and contacts.</strong> Information people voluntarily
          submit through your lead magnets, links, or product flows (such as a
          name, email, or phone number) is stored so you can retrieve and
          export it.
        </p>
        <p>
          <strong>Usage data.</strong> We collect log data such as IP address,
          browser type, device information, and pages visited, and use cookies
          and similar technologies to keep you signed in and remember your
          preferences (see Section 6).
        </p>
      </LegalSection>

      <LegalSection heading="2. How we use information">
        <ul className="list-disc space-y-1 pl-5">
          <li>Operate the automations, flows, and analytics you configure.</li>
          <li>Send comment replies, story replies, and DMs on your behalf, exactly as you set up.</li>
          <li>Maintain your account, provide customer support, and send service notices.</li>
          <li>Monitor, secure, and improve the reliability of the platform.</li>
          <li>Comply with legal obligations and Meta Platform Terms.</li>
        </ul>
        <p>
          We do not sell your data or the data of your followers and
          customers. We do not use Instagram or Facebook data for advertising
          purposes.
        </p>
      </LegalSection>

      <LegalSection heading="3. How we share information">
        <p>We share data only in the following cases:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Meta Platforms, Inc.</strong> — data flows to and from the
            Instagram Graph API and Messenger Platform as required to deliver
            automated replies and DMs.
          </li>
          <li>
            <strong>Infrastructure providers</strong> (hosting, database, and
            email delivery) who process data on our behalf under contract, and
            only to the extent needed to run the service.
          </li>
          <li>
            <strong>Legal reasons</strong> — if required by law, subpoena, or
            to protect the rights, property, or safety of Auto DM, our users,
            or others.
          </li>
          <li>
            <strong>Business transfers</strong> — if Auto DM is involved in a
            merger, acquisition, or asset sale, in which case we will notify
            you before data is transferred.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Data retention">
        <p>
          We retain account data for as long as your account is active.
          Conversation and comment data processed through automations is
          retained so you can review history and analytics, and is deleted
          within 90 days of account deletion or disconnecting your Instagram
          account, whichever is sooner. You can request earlier deletion at
          any time (Section 7).
        </p>
      </LegalSection>

      <LegalSection heading="5. Data security">
        <p>
          Access tokens and credentials are encrypted at rest. We use
          industry-standard transport encryption (TLS) for data in transit and
          restrict internal access to data on a need-to-know basis. No method
          of transmission or storage is 100% secure, and we cannot guarantee
          absolute security.
        </p>
      </LegalSection>

      <LegalSection heading="6. Cookies">
        <p>
          We use essential cookies to keep you signed in and remember your
          theme preference. We do not use third-party advertising cookies. You
          can control cookies through your browser settings, though disabling
          essential cookies may prevent you from logging in.
        </p>
      </LegalSection>

      <LegalSection heading="7. Your rights and choices">
        <ul className="list-disc space-y-1 pl-5">
          <li>Access, correct, or export the data we hold about you from your dashboard.</li>
          <li>Disconnect your Instagram account at any time, which revokes our API access immediately.</li>
          <li>Request deletion of your account and associated data by contacting us below.</li>
          <li>
            If you are in the EEA, UK, or similar jurisdictions, you may have
            additional rights under applicable data protection law, including
            the right to lodge a complaint with a supervisory authority.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="8. Children's privacy">
        <p>
          Auto DM is not directed to children under 13 (or the minimum age
          required in your country), and we do not knowingly collect their
          data.
        </p>
      </LegalSection>

      <LegalSection heading="9. Changes to this policy">
        <p>
          We may update this policy from time to time. Material changes will
          be communicated by email or an in-app notice before they take
          effect.
        </p>
      </LegalSection>

      <LegalSection heading="10. Contact us">
        <p>
          Questions about this policy or your data can be sent to us through
          our{" "}
          <Link
            href="/contact"
            className="font-medium text-zinc-900 underline hover:no-underline dark:text-zinc-50"
          >
            contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
