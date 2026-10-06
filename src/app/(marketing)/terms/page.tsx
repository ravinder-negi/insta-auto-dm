import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — Auto DM",
  description:
    "The terms that govern your use of Auto DM's Instagram automation platform.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" updated="October 5, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of Auto DM&apos;s website, dashboard, and related services
        (collectively, the &quot;Service&quot;). By creating an account or using
        the Service, you agree to these Terms.
      </p>

      <LegalSection heading="1. The service">
        <p>
          Auto DM lets you connect an Instagram professional account and
          configure automations that reply to comments, respond to story
          replies and mentions, send direct messages, and capture leads
          through links and lead magnets. The Service relies on Meta&apos;s
          Instagram Graph API and Messenger Platform and is subject to
          Meta&apos;s availability, rate limits, and policies.
        </p>
      </LegalSection>

      <LegalSection heading="2. Eligibility and your account">
        <ul className="list-disc space-y-1 pl-5">
          <li>You must be at least 18 years old and able to form a binding contract to use the Service.</li>
          <li>You must provide accurate account information and keep your login credentials confidential.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
          <li>
            You must connect an Instagram account that you own or are
            authorized to manage, and you are responsible for complying with
            Instagram&apos;s and Meta&apos;s own terms and policies for that
            account.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Acceptable use">
        <p>You agree not to use Auto DM to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Send spam, unsolicited bulk messages, or content unrelated to a user&apos;s own comment, reply, or request.</li>
          <li>Harass, deceive, or mislead recipients, or impersonate another person or business.</li>
          <li>Collect or process data from Instagram users in a way that violates applicable law or Meta&apos;s Platform Terms and Developer Policies.</li>
          <li>Distribute malware, conduct phishing, or attempt to circumvent Instagram or Auto DM rate limits and security controls.</li>
          <li>Resell or sublicense access to the Service without our written consent.</li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate this section,
          with or without notice, to protect the Service and other users.
        </p>
      </LegalSection>

      <LegalSection heading="4. Your content and data">
        <p>
          You retain ownership of the content, flows, and lead data you create
          or collect using Auto DM. You grant us a limited license to host,
          process, and transmit that content solely to operate the Service on
          your behalf. You are responsible for having the rights and consents
          needed to collect and use any data your automations gather from
          your audience, including compliance with applicable privacy laws.
        </p>
      </LegalSection>

      <LegalSection heading="5. Subscriptions and billing">
        <p>
          Paid plans, where offered, are billed in advance on a recurring
          basis. Fees are non-refundable except where required by law. You
          may cancel at any time, and cancellation takes effect at the end of
          the current billing period. We may change pricing with at least 30
          days&apos; notice before it applies to your account.
        </p>
      </LegalSection>

      <LegalSection heading="6. Third-party platforms">
        <p>
          The Service depends on Instagram and Facebook APIs operated by Meta
          Platforms, Inc., which Auto DM does not control. Meta may change,
          restrict, or discontinue API access at any time, which may limit or
          interrupt features of the Service. We are not responsible for
          outages, policy changes, or data made unavailable by Meta.
        </p>
      </LegalSection>

      <LegalSection heading="7. Disclaimers">
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;
          without warranties of any kind, express or implied, including
          warranties of merchantability, fitness for a particular purpose, or
          non-infringement. We do not guarantee uninterrupted or error-free
          operation.
        </p>
      </LegalSection>

      <LegalSection heading="8. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Auto DM and its affiliates
          will not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of profits,
          revenue, data, or goodwill, arising from your use of the Service.
          Our total liability for any claim relating to the Service will not
          exceed the amount you paid us in the 12 months preceding the claim.
        </p>
      </LegalSection>

      <LegalSection heading="9. Termination">
        <p>
          You may stop using the Service and delete your account at any time.
          We may suspend or terminate your access if you breach these Terms
          or if required to comply with Meta&apos;s policies. Upon
          termination, your right to use the Service ends, and we will handle
          your data as described in our Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection heading="10. Changes to these terms">
        <p>
          We may update these Terms from time to time. If we make material
          changes, we will notify you by email or an in-app notice before
          they take effect. Continued use of the Service after changes take
          effect constitutes acceptance of the new Terms.
        </p>
      </LegalSection>

      <LegalSection heading="11. Governing law">
        <p>
          These Terms are governed by the laws of India, without regard to
          conflict-of-law principles, unless otherwise required by applicable
          local law.
        </p>
      </LegalSection>

      <LegalSection heading="12. Contact us">
        <p>
          Questions about these Terms can be sent to us through our{" "}
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
