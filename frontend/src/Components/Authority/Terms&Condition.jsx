import { useEffect, useState } from "react";

import SEOMetaData from "../../NewComponents/SEOMetaData";
import { api } from "../../Config/api";

const formatLegalDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * The Terms & Conditions page.
 *
 * Reads the published document from `GET /legal/terms`, which is what the admin
 * console writes. That endpoint is THE propagation mechanism — the signup
 * checkbox, the checkout consent and every questionnaire footer read the same
 * row, so an edit lands everywhere at once with nothing to push.
 *
 * The copy below is kept as the fallback for exactly one situation: nothing has
 * been published yet, and the endpoint answers 404 / NOT_PUBLISHED. A legal page
 * that renders empty because an API call failed is worse than a legal page
 * showing slightly stale wording, so the bundled text stays until it is
 * deliberately replaced. Once an admin publishes once, the API wins forever.
 *
 * The stored HTML has no class attributes — the sanitiser strips them — so its
 * appearance comes from `.legal-document` in index.css, which reproduces the
 * styling this JSX applies inline.
 */
const TermsAndConditions = () => {
  const [published, setPublished] = useState(null);

  useEffect(() => {
    let alive = true;

    api
      .get("/legal/terms")
      .then((res) => {
        const doc = res?.data?.data;
        if (alive && doc?.content) setPublished(doc);
      })
      // A 404 means nothing is published yet; anything else means the API is
      // unreachable. Both fall through to the bundled copy below, so neither
      // needs handling beyond not throwing.
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  if (published) {
    const effective = formatLegalDate(published.effectiveDate);
    const updated = formatLegalDate(published.createdAt);

    return (
      <div className="max-w-5xl mx-auto px-6 py-10 legal-document">
        <SEOMetaData
          title={`${published.title || "Terms and Conditions"} | Famlink`}
          description={`Read the Famlink Terms and Conditions to understand our policies, user responsibilities, and guidelines for using our platform.`}
        />
        <h1 className="text-3xl Livvic-Bold mb-6">
          {published.title || "Famlink Terms and Conditions"}
        </h1>
        {(effective || updated) && (
          <p className="text-sm text-gray-500 mb-10">
            {effective && `Effective Date: ${effective}`}
            {effective && updated && <>&nbsp;•&nbsp;</>}
            {updated && `Last Updated: ${updated}`}
          </p>
        )}
        {/* Sanitised on write by Services/utils/sanitizeHtml.js — an allow-list
            that runs once at publish, so what is stored is what is safe to
            render. */}
        <div dangerouslySetInnerHTML={{ __html: published.content }} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 text-[#333] text-base leading-7">
      <SEOMetaData
        title={"Terms and Conditions | Famlink"}
        description={`Read the Famlink Terms and Conditions to understand our policies, user responsibilities, and guidelines for using our platform.
`}
      />
      <h1 className="text-3xl Livvic-Bold mb-6">Famlink Terms and Conditions</h1>
      <p className="text-sm text-gray-500 mb-10">
        Effective Date: July 13, 2026 &nbsp;•&nbsp; Last Updated: July 14, 2026
      </p>

      <p className="mb-6">
        Welcome to <span className="Livvic-Bold">Famlink</span> — a platform built to help families and caregivers connect for nanny share
        arrangements. We believe that trust, transparency, and safety are the foundation of every great
        childcare relationship. These Terms and Conditions govern your use of our platform and are
        designed to be clear, fair, and protective of your rights. <br />
        By creating an account or using Famlink in any way, you agree to these Terms. If you do not
        agree, please do not use the platform.

      </p>

      <Section title="1. About Famlink">
        Famlink is operated by <span className="Livvic-Bold">Famylink, Inc.</span>, a corporation incorporated under
        the laws of the State of Delaware ("Famlink," "Company," "we," "us," or
        "our"). Famlink operates the platform accessible at www.famlink.care and
        any associated mobile applications, subdomains, or services
        (collectively, the "Platform"). <br />
        Our mission is to make quality, affordable childcare accessible to more families by connecting
        them with compatible nanny share partners and caregivers in their local community.

      </Section>

      <Section title="2. Nature of the Platform — Connection Service Only">
        <p>
          <span className="Livvic-SemiBold">2.1 Connection Platform Only.</span>{" "}
          Famlink is a technology platform that provides tools enabling families
          and caregivers to discover one another, browse profiles, compare
          schedules and preferences, and initiate contact for the purpose of
          forming nanny share arrangements. Famlink is a <span className="Livvic-Bold">passive intermediary and
            connection service only</span>. Famlink does not employ caregivers, place
          caregivers with families, manage childcare arrangements, supervise any
          caregiver or child, or participate in any agreement between users.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">
            2.2 No Involvement in User Relationships.
          </span>{" "}
          Any nanny share arrangement, childcare
          agreement, employment relationship, service contract, financial arrangement, or any other
          agreement formed between users through the Platform is solely between those users. Famlink is
          not a party to any such arrangement.

        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">2.3 Section 230 Notice.</span>{" "}
          Famlink is an interactive computer service as defined under 47 U.S.C.
          § 230 (the Communications Decency Act). Famlink is not the publisher or speaker of any User
          Content posted by users.
        </p>
      </Section>

      <Section title="3. Eligibility">
        To create an account and use Famlink, you must:
        <ul className="list-disc ml-6 mt-2">
          <li>Be at least 18 years of age;</li>
          <li>
            Have the full legal capacity and authority to enter into a binding
            agreement;
          </li>
          <li>
            Not be prohibited from using the Platform under any applicable
            federal, state, or local law; and
          </li>
          <li>
            Provide truthful, accurate, and complete information during
            registration and at all times thereafter.
          </li>
        </ul>
        <p className="mt-3">
          By creating an account, you represent and warrant that you satisfy all
          eligibility requirements. Famlink reserves the right to refuse service
          to any person at any time for any reason.
        </p>
      </Section>

      <Section title="4. Account Registration and Security">
        <p>
          <span className="Livvic-SemiBold">4.1 Accuracy of Information.</span> You agree to provide
          accurate, complete, and current information when creating your account
          and to update such information promptly if it changes. You may not
          create more than one account per person.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">4.2 Credential Confidentiality</span> You are solely and
          entirely responsible for maintaining the confidentiality of your login
          credentials, including your password and any one-time passcodes. You
          agree to notify Famlink immediately at support@famlink.care upon
          becoming aware of any unauthorized access to or use of your account.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">4.3 Account Activity</span> You are fully responsible for all activity that occurs under your account,
          whether authorized by you or not.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">4.4  Account Termination.</span> Famlink reserves the right to suspend, restrict, or permanently
          terminate any account at any time, for any reason, with or without notice.

        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">4.5 Non-Transferability.</span> You may not transfer, sell, or assign your account to any other person
          or entity.
        </p>


        <div className="border-l-[3px] border-[#CBD5E1] pl-4 py-1 my-6 text-[#64748B]">
          <span className="Livvic-SemiBold text-[#475569]">Security Tip:</span> We recommend using a strong, unique password and enabling two-factor authentication when available. Never share your login credentials with anyone, including other Famlink users.
        </div>
      </Section>

      <Section title="5. Trust, Safety, and User Screening">

        <div className="border-l-[3px] border-[#CBD5E1] pl-4 py-1 my-6 text-[#64748B]">
          <span className="Livvic-SemiBold text-[#475569]">Important Safety Notice:</span> Famlink does not conduct background checks or identity
          verification. You are responsible for independently screening any person you meet through
          the Platform before entering a childcare arrangement.
        </div>

        <p>
          <span className="Livvic-SemiBold">5.1 No Background Checks.</span> Famlink does not conduct, facilitate, or provide background
          checks, criminal record checks, sex offender registry checks, identity verification, reference
          checks, credential verification, or any other form of screening of any us
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">5.2 No Endorsement.</span> The presence of a profile on Famlink does not constitute any
          endorsement, recommendation, verification, or approval by Famlink of that user’s identity,
          character, qualifications, or suitability for childcare
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">
            5.3 Your Responsibility and Due Diligence.
          </span>{" "}
          Famlink operates conceptually similar to a dating
          or social networking platform (such as Hinge, Bumble, or Raya) — we facilitate introductions, but
          we do not vet the people you meet. You acknowledge and agree that it is your sole responsibility
          to perform your own due diligence, just as you would when meeting anyone from the internet.
          You must independently investigate, verify, screen, and evaluate any person you encounter
          through the Platform before entering into any arrangement. This includes conducting your own
          background checks, verifying references, confirming identity, and verifying any claimed
          certifications. You must use common sense and personal judgment at all times.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">5.4 Absolute Assumption of Risk.</span> YOUR USE OF THE PLATFORM AND YOUR DECISION
          TO INTERACT WITH, MATCH WITH, OR HIRE ANY USER IS ENTIRELY AT YOUR OWN
          DISCRETION AND YOUR SOLE RISK. By using the Platform, you expressly acknowledge that
          you are assuming all risks — both known and unknown — associated with interacting with other
          users, including but not limited to any risks related to the safety, wellbeing, physical health,
          emotional welfare, or property of any child or adult. Famlink bears absolutely zero responsibility
          or liability for the actions, omissions, or conduct of anyone you hire, match with, or interact with
          through the Platform.

        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">5.5 Emergency Situations.</span> If you believe you or a child is in immediate danger, contact local
          law enforcement immediately. Famlink is not a law enforcement agency and cannot guarantee
          the safety of any user.
        </p>
      </Section>

      <Section title="6. User Conduct">
        <p className="mt-3">
          You agree to use the Platform only for its intended purpose of forming legitimate nanny share
          arrangements and in full compliance with all applicable laws. You agree that you will not:
        </p>
        <ul className="list-disc ml-6 mt-2">
          <li>
            Post, submit, or transmit any false, misleading, inaccurate,
            defamatory, obscene, hateful, or unlawful content;
          </li>
          <li>
            Impersonate any person or entity or misrepresent your identity,
            qualifications, certifications, or affiliation;
          </li>
          <li>
            Use the Platform to harass, threaten, intimidate, stalk, abuse,
            discriminate against, or harm any other user or any third party;
          </li>
          <li>
            Discriminate against any user on the basis of race, color, religion,
            sex, national origin, disability, age, familial status, or any other
            protected characteristic under applicable law;
          </li>
          <li>
            Solicit passwords, financial account information, Social Security
            numbers, or other sensitive personal information from any user;
          </li>
          <li>
            Use the Platform to advertise, promote, or solicit any third-party
            product, service, or commercial venture;
          </li>
          <li>
            Collect or harvest any personal information about other users without
            their explicit consent;
          </li>
          <li>
            Attempt to gain unauthorized access to any portion of the Platform or
            any other systems or networks connected to Famlink;
          </li>
          <li>
            Use any automated means, including bots, scrapers, or crawlers, to
            access or extract data from the Platform;
          </li>
          <li>Upload or transmit any viruses, malware, or other malicious code;</li>
          <li>
            Circumvent, disable, or interfere with any security-related features
            of the Platform; or
          </li>
        </ul>
        <p className="mt-3">
          Famlink reserves the right to monitor user activity and content on the Platform and may remove
          any content and suspend or terminate any account that violates these Terms, at its sole
          discretion, without notice.
        </p>
      </Section>

      <Section title="7. Privacy and Data Practices">

        <div className="border-l-[3px] border-[#CBD5E1] pl-4 py-1 my-6 text-[#64748B]">
          <span className="Livvic-SemiBold text-[#475569]">Our Privacy Commitment:</span> Famlink will never sell your personal information to third parties.
          We collect only what is necessary to operate the platform and connect you with compatible
          families and caregivers.
        </div>

        <p>
          <span className="Livvic-SemiBold">7.1 Privacy Policy</span> Your use of the Platform is governed by Famlink’s Privacy Policy, which is
          incorporated into these Terms by reference. By using the Platform, you consent to the collection,
          use, storage, and disclosure of your information as described in the Privacy Policy.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">7.2 Data Minimization.</span> We practice data minimization, collecting only the information necessary
          to facilitate the nanny share matching process. We do not collect data beyond what is required
          to deliver our service.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">7.3 Aggregated Data.</span>Famlink may use aggregated, anonymized data derived from user activity
          to improve the Platform and for other lawful business purposes. This data cannot be used to
          identify individual users.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">7.4 Third-Party Services. </span> The Platform may contain links to or integrations with third-party
          websites, applications, or services. Famlink does not control, endorse, or assume any
          responsibility for any third-party service, content, or privacy practices.
        </p>
      </Section>

      <Section title="8. Children’s Privacy — COPPA Compliance">
        <p>
          Famlink takes children’s privacy extremely seriously and is committed to full compliance with the <span className="Livvic-Bold">Children’s Online Privacy Protection Act (COPPA)</span> and the 2025 FTC COPPA Rule
          amendments.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">8.1 Platform for Adults Only.</span> Famlink is designed and intended for use by parents, legal
          guardians, and adult caregivers only. We do not knowingly collect personal information directly
          from children under the age of 13.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">8.2 Child-Related Information Provided by Parents.</span> Any information regarding children (such
          as age ranges, care needs, or schedules) must be provided solely by the parent or legal
          guardian. By providing such information, you represent that you are the parent or legal guardian
          of the child and consent to the collection and use of this data solely to facilitate the nanny share
          matching process.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">8.3 What Child-Related Data We Collect.</span> To enable matching, we may collect limited, non
          identifying child-related data provided by parents, including:
        </p>

        <ul className="list-disc ml-6 mt-2">
          <li>Age range of child(ren) (e.g., infant, toddler, preschool);</li>
          <li>General care schedule and availability needs;</li>
          <li>General care schedule and availability needs;</li>
        </ul>

        <p>We do not collect children’s names, photographs, contact information, or any other directly
          identifying information.</p>

        <p className="mt-3">
          <span className="Livvic-SemiBold">8.4 Deletion of Child Data.</span> If Famlink becomes aware that a child under 13 has directly
          provided personal information, Famlink will take immediate steps to delete such information. If
          you believe a child under 13 has created an account or submitted personal information, please
          contact us immediately at support@famlink.care.
        </p>

        <p className="mt-3">
          <span className="Livvic-SemiBold">8.5 No Behavioral Advertising Targeting Children.</span>Famlink does not use any child-related
          data for behavioral advertising, profiling, or any purpose other than facilitating the nanny share
          matching service.
        </p>
      </Section>

      <Section title="9. California Privacy Rights — CCPA/CPRA">

        <p>If you are a California resident, <span className="Livvic-Bold">the California Consumer Privacy Act (CCPA)</span>, as amended by
          the California Privacy Rights Act (CPRA), grants you specific rights regarding your personal
          information.</p>

        <div className="overflow-x-auto mt-4 mb-6 border border-gray-200 rounded-md">
          <table className="w-full text-left border-collapse text-sm text-gray-700">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="p-3 font-semibold border-r border-gray-200 w-1/4">Your Right</th>
                <th className="p-3 font-semibold border-r border-gray-200 w-1/2">What It Means</th>
                <th className="p-3 font-semibold w-1/4">How to Exercise</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-3 border-r border-gray-200">Right to Know</td>
                <td className="p-3 border-r border-gray-200">Request disclosure of the categories and specific pieces of personal information we have collected about you.</td>
                <td className="p-3">Email support@famlink.care</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-3 border-r border-gray-200">Right to Delete</td>
                <td className="p-3 border-r border-gray-200">Request deletion of your personal information, subject to certain exceptions.</td>
                <td className="p-3">Email or account settings</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-3 border-r border-gray-200">Right to Correct</td>
                <td className="p-3 border-r border-gray-200">Request correction of inaccurate personal information we hold about you.</td>
                <td className="p-3">Account settings or email</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-3 border-r border-gray-200">Right to Opt-Out</td>
                <td className="p-3 border-r border-gray-200">
                  Opt-out of the sale or sharing of your personal information.{" "}
                  <span className="font-bold">Note: Famlink does not sell your data.</span>
                </td>
                <td className="p-3">N/A — we do not sell data</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-3 border-r border-gray-200">Right to Non-Discrimination</td>
                <td className="p-3 border-r border-gray-200">You will not be discriminated against for exercising any of your CCPA rights.</td>
                <td className="p-3">Automatic</td>
              </tr>
              <tr>
                <td className="p-3 border-r border-gray-200">Right to Limit Sensitive Data Use</td>
                <td className="p-3 border-r border-gray-200">Limit the use of sensitive personal information to what is necessary to perform the service.</td>
                <td className="p-3">Email support@famlink.care</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          To submit a verifiable consumer request, please contact us at support@famlink.care. We will
          respond to verified requests within 45 days as required by law.
        </p>
        <p>
          <span className="Livvic-SemiBold">9.1 Multi-State Privacy Rights.</span> Users in states including Colorado, Virginia, Utah, and
          Connecticut may have similar privacy rights under their respective state laws. Famlink is
          committed to honoring applicable state privacy rights.
        </p>
      </Section>

      <Section title="10. Data Security">
        <p>
          <span className="Livvic-SemiBold">10.1 Security Measures.</span> Famlink implements industry-standard technical and organizational
          security measures to protect your personal information, including:
        </p>

        <ul className="list-disc ml-6 mt-2">
          <li>Encryption of data in transit using TLS/SSL protocols;</li>
          <li>Encryption of sensitive data at rest;</li>
          <li>Access controls and authentication requirements for our systems;</li>
          <li>Regular security assessments and monitoring;</li>
          <li>Secure, third-party payment processing — we do not store full payment card information.</li>
        </ul>

        <p className="mt-3">
          <span className="Livvic-SemiBold">10.2 No Absolute Guarantee.</span> While we take data security seriously, no method of transmission
          over the internet or method of electronic storage is completely secure.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">10.3 Data Breach Notification.</span> In the event of a security breach involving your personal
          information, Famlink will notify you without undue delay and in accordance with applicable law.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">10.4 Data Retention.</span> We retain your personal information only for as long as necessary to
          provide the service, comply with our legal obligations, resolve disputes, and enforce our
          agreements. Upon account deletion, we will delete or anonymize your personal information
          within 90 days, except where retention is required by law.
        </p>

        <div className="border-l-[3px] border-[#CBD5E1] pl-4 py-1 my-6 text-[#64748B]">
          <span className="Livvic-SemiBold text-[#475569]">Payment Security:</span> All payments on Famlink are processed by PCI-DSS compliant third-party
          payment processors. Famlink never stores your full credit card number, CVV, or other
          sensitive payment credentials on our servers.
        </div>
      </Section>

      <Section title="11. User Content and Profiles">
        <p>
          <span className="Livvic-SemiBold">11.1 Your Responsibility.</span> You are solely responsible for all content you post, submit, upload, or
          otherwise make available on the Platform, including your profile information, photographs,
          descriptions, and any communications with other users (“User Content”).
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">11.2 License to Famlink.</span> By submitting User Content, you grant Famlink a non-exclusive,
          royalty-free, worldwide license to use, display, reproduce, and distribute your User Content
          solely for the purpose of operating, maintaining, and improving the Platform.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">11.3 Your Warranties.</span> You represent and warrant that: (a) you own or have all necessary rights
          to your User Content; (b) your User Content does not infringe any third-party rights; © your User
          Content is truthful; and (d) any photographs you post of children are of your own children and
          you have the right to post them.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">11.4 Anonymous Profile Promotion on Social Media.</span> To help generate brand awareness and
          facilitate matches, Famlink may periodically share anonymized snippets of user profiles (such as
          “Nanny Share needed in Emeryville for 1 child, $40/hr”) on our social media channels, marketing
          materials, or external community boards. <span className="Livvic-Bold">Famlink will never include your name, photograph,
            or direct contact information in these promotional posts.</span> By creating an account, you
          consent to this anonymized promotion. However, if you prefer that your anonymized profile not
          be shared externally, you may opt out at any time by emailing support@famlink.care.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">11.5 Content Removal.</span> Famlink reserves the right to remove any User Content at any time, for
          any reason, without notice and without liability.
        </p>
      </Section>

      <Section title="12. Communications Between Users and Prohibited Conduct  ">
        <p>
          <span className="Livvic-SemiBold">12.1 User-to-User Communications.</span> Famlink provides messaging features to facilitate
          childcare arrangements. All communications are solely between users. Famlink is not
          responsible for the content of any communication between users.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">12.2 Zero Tolerance for Harassment and Abuse.</span> Famlink maintains a strict zero-tolerance
          policy for harassment. You agree not to use the Platform to send messages that are abusive,
          threatening, discriminatory, sexually explicit, defamatory, or intended to intimidate or harass
          another user. Any such conduct will result in immediate and permanent account termination.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">12.3 Fraud, Scams, and Financial Abuse.</span> You agree not to use the Platform for any fraudulent
          activity. This includes, but is not limited to: requesting advance payments via wire transfer, gift
          cards, or cryptocurrency; running overpayment scams; impersonating another person or family;
          creating fake profiles; or attempting to solicit sensitive financial information from other users.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">12.4 Spam and Commercial Solicitation.</span> You agree not to use Famlink’s messaging system to
          send spam, unsolicited advertising, promotional materials, or solicitations for services unrelated
          to childcare (e.g., selling products, multi-level marketing).
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">12.5 Safety Monitoring.</span>Famlink may, but is not obligated to, monitor communications on the
          Platform for safety and compliance purposes. By using any communication feature, you consent
          to such monitoring. Any monitoring is conducted to protect our users and does not constitute an
          endorsement of any communication.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">12.6 Off-Platform Risk.</span> If you choose to move communications off the Famlink Platform (e.g.,
          to text message or WhatsApp), you do so at your own risk. Famlink strongly recommends
          keeping communications on the Platform until you have verified the identity and intentions of the
          other user.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">12.7 Reporting Abuse.</span> If you receive a communication that you believe violates these Terms or
          poses a safety risk, please report it immediately to support@famlink.care. We take all safety
          reports seriously and will investigate promptly.
        </p>
      </Section>

      <Section title="13. Employment Misclassification and Tax Compliance">
        <p>
          <span className="Livvic-SemiBold">13.1 Independent Contractor vs. Employee Classification.</span> You acknowledge that nannies
          and caregivers are generally considered household employees under IRS guidelines and
          applicable state labor laws, and are rarely classified as independent contractors (1099 workers).
          Famlink does not provide tax or legal advice regarding employment classification.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">13.2 Family Responsibility and Insurance.</span> Families utilizing the Platform acknowledge that
          they may be considered employers under federal and state law. As an employer, you are solely
          responsible for complying with all applicable tax laws, employment laws, and labor regulations,
          including but not limited to:
        </p>

        <ul className="list-disc ml-6 mt-2">
          <li>Withholding and paying household employment taxes (“nanny taxes”);</li>
          <li>Providing minimum wage and overtime pay in accordance with the Fair Labor Standards Act
            (FLSA) and state laws;</li>
          <li>Verifying employment eligibility (Form I-9).</li>
        </ul>

        <p>Families are also solely responsible for researching and obtaining any required insurance,
          including workers’ compensation insurance or liability insurance. Famlink has no involvement in,
          and bears no responsibility for, your insurance obligations or employment compliance.</p>

        <p className="mt-3">
          <span className="Livvic-SemiBold">13.3 Famlink is Not an Employer or Joint Employer.</span> Famlink is not an employer, joint
          employer, or co-employer of any caregiver. Famlink exercises no control over the working
          conditions, hours, wages, or duties of any caregiver.
        </p>


      </Section>

      <Section title="14. Famlink Plus Subscription and Cancellation (FTC Compliance)">
        <p>
          <span className="Livvic-SemiBold">14.1 Famlink Plus.</span> Famlink offers an optional paid subscription tier called <span className="Livvic-Bold">Famlink Plus</span>, which
          provides access to additional platform features.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">14.2 Recurring Billing and Negative Option.</span> By subscribing to Famlink Plus, you authorize
          Famlink to charge your designated payment method on a recurring monthly basis until you
          affirmatively cancel. You will be charged the stated subscription fee automatically at the
          beginning of each billing cycle.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">14.3 Simple “Click-to-Cancel” Process.</span> In compliance with FTC regulations, you may cancel
          your Famlink Plus subscription at any time using a simple, straightforward cancellation
          mechanism located in your account settings. The cancellation process requires no more steps
          than were required to initiate the subscription.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">14.4 Effect of Cancellation</span> Cancellation takes effect at the end of the then-current billing
          period. No prorated refunds are issued for partial billing periods.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">14.5 Price Changes.</span> Famlink reserves the right to change the pricing or features of Famlink
          Plus at any time. Material changes will be communicated to active subscribers with at least <span className="Livvic-Bold">30 days’ advance notice</span> via email, requiring affirmative consent to the new pricing before the next
          billing cycle.
        </p>
      </Section>

      <Section title="15. Educational Resources, Calculators, and Guides">
        <p>
          <span className="Livvic-SemiBold">15.1 Baseline Guidance Only.</span> Famlink may provide educational resources, cost calculators,
          payroll guides, and sample agreement templates on the Platform (collectively, “Resources”). All
          Resources are provided for general informational purposes and as baseline guidance only. They
          do not constitute legal advice, financial advice, or tax advice.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">15.2 No Liability for Resources.</span> You are not required to use any Resources provided by
          Famlink. If you choose to use them, you do so entirely at your own risk. Famlink bears zero
          responsibility for any decisions you make based on these Resources, any errors or omissions
          within them, or any legal, tax, or financial consequences arising from your use of them. Laws
          regarding employment, minimum wage, and taxes vary significantly by state and local
          jurisdiction. We strongly encourage you to consult a licensed attorney or certified public
          accountant (CPA) before finalizing any childcare or payroll arrangement.
        </p>
      </Section>

      <Section title="16. Disclaimer of Warranties and Limitation of Liability">
        <p>
          <span className="Livvic-SemiBold">16.1 Disclaimer of Warranties.</span> To the fullest extent permitted by applicable law, Famylink, Inc.
          and its officers, directors, employees, agents, licensors, and affiliates (collectively, “Famlink
          Parties”) provide the Platform entirely “as is” and “as available,” without any warranty of any
          kind, whether express, implied, statutory, or otherwise.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">16.2 Limitation of Liability.</span> To the fullest extent permitted by law, in no event shall the Famlink
          Parties be liable to you or any third party for any indirect, incidental, special, consequential,
          exemplary, or punitive damages, or any loss of profits, revenue, data, business, goodwill, or
          other intangible losses.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">16.3 Total Waiver of Liability for User Conduct.</span> You EXPRESSLY AGREE THAT FAMLINK
          BEARS ZERO RESPONSIBILITY AND ZERO LIABILITY FOR THE ACTIONS, OMISSIONS,
          NEGLIGENCE, OR INTENTIONAL MISCONDUCT OF ANY CAREGIVER, FAMILY, OR OTHER
          USER YOU MEET, MATCH WITH, OR HIRE THROUGH THE PLATFORM. You explicitly waive
          any and all claims against Famlink for negligent referral, negligent hiring, negligent retention,
          breach of contract by another user, personal injury, property damage, or wrongful death, as Famlink is solely a passive connection platform and does not employ, recommend, or refer
          specific caregivers to specific families.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">16.4 Maximum Liability Cap.</span> Famlink’s total aggregate liability to you for all claims shall not
          exceed the greater of: (a) the total fees you paid to Famlink in the twelve (12) months
          immediately preceding the event giving rise to the claim; or (b) fifty dollars ($50.00).
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">16.5 Essential Basis.</span> You acknowledge that the limitations of liability set forth in this section
          reflect a reasonable and fair allocation of risk and are an essential element of the basis of the
          bargain between you and Famlink.
        </p>
      </Section>

      <Section title="17. Indemnification">
        <p>
          You agree to fully indemnify, defend, and hold harmless the Famlink Parties from and against
          any and all claims, demands, actions, proceedings, damages, losses, liabilities, costs, and
          expenses (including reasonable attorneys’ fees) arising out of or related to:
        </p>
        <ul className="list-disc ml-6 mt-2">
          <li>
            Your use of or access to the Platform;
          </li>
          <li>
            Your violation of these Terms or any applicable law or regulation;
          </li>
          <li>
            Your interactions with any other user;
          </li>
          <li>
            Any nanny share arrangement, childcare agreement, or other arrangement formed through
            the Platform;
          </li>
          <li>
            Any employment misclassification claims, unpaid wage claims, or tax liabilities arising from
            your arrangement with another user;
          </li>
          <li>
            Any harm to any child or third party arising from your use of the Platform.
          </li>
        </ul>
      </Section>

      <Section title="18. Dispute Resolution and Arbitration">
        <p className="mt-3">
          <span className="Livvic-SemiBold">18.1 Informal Resolution First.</span> Before initiating any formal dispute, you agree to contact
          Famlink at support@famlink.care and attempt to resolve the dispute informally for a period of at
          least 30 days.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">18.2 Binding Arbitration.</span> If informal resolution fails, any dispute shall be resolved by binding
          individual arbitration administered by the American Arbitration Association (AAA) under its
          Consumer Arbitration Rules, rather than in court.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">18.3 Class Action Waiver.</span> You and Famlink each expressly waive the right to a jury trial and the
          right to participate in any class action, class arbitration, consolidated proceeding, or
          representative proceeding of any kind.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">18.4 Governing Law.</span> These Terms shall be governed by and construed in accordance with the
          laws of the State of Delaware, without regard to its conflict of law provisions.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">18.5 Time Limitation on Claims.</span> Any claim arising out of or related to these Terms or the
          Platform must be brought within one (1) year after the cause of action arises, or it is permanently
          barred.
        </p>
      </Section>

      <Section title="19. Changes to These Terms">
        <p>
          Famlink reserves the right to modify these Terms at any time in its sole discretion. We will notify
          you of material changes by:
        </p>

        <ul className="list-disc ml-6 mt-2">
          <li>
            Sending an email to the address associated with your account;
          </li>
          <li>
            Posting a prominent notice on the Platform; and
          </li>
          <li>
            Updating the “Last Updated” date at the top of this document.
          </li>
        </ul>

        <p className="mt-3">
          Your continued use of the Platform after any such modification constitutes your acceptance of
          the revised Terms. If you do not agree to the revised Terms, you must immediately stop using
          the Platform and delete your account.
        </p>
      </Section>

      <Section title="20. Reporting, Termination, and Miscellaneous">
        <p>
          <span className="Livvic-SemiBold">20.1 Reporting Safety Issues.</span>{" "}
          If you encounter any user who you believe poses a safety risk,
          has engaged in fraudulent or abusive behavior, or has violated these Terms, please report them
          to Famlink at support@famlink.care.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">20.2 Account Termination.</span> You may terminate your account at any time by contacting
          support@famlink.care or through your account settings.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">20.3 Entire Agreement.</span>{" "}
          These Terms, together with the Privacy Policy, constitute the entire
          agreement between you and Famlink with respect to the Platform and supersede all prior
          agreements and understandings.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">20.4 Severability.</span> If any provision of these Terms is found to be invalid or unenforceable, that
          provision shall be modified to the minimum extent necessary to make it enforceable, and the
          remaining provisions shall continue in full force and effect.
        </p>
        <p className="mt-3">
          <span className="Livvic-SemiBold">20.5 Force Majeure.</span>{" "}
          Famlink shall not be liable for any failure or delay in performance resulting
          from causes beyond its reasonable control, including acts of God, natural disasters, pandemic,
          war, government action, or technical failures of third-party infrastructure.
        </p>
      </Section>


      <Section title="Contact Information">
        For questions, concerns, or notices regarding these Terms or our privacy practices, please
        contact us at:
        <p className="mt-3">
          <span className="Livvic-SemiBold">Email: </span>
          <a
            href="mailto:support@famlink.care"
            className="text-blue-600 underline"
          >
            support@famlink.care
          </a>
          <br />
          <span className="Livvic-SemiBold">Website:</span> www.famlink.care
          <br />
          <span className="Livvic-SemiBold">Company:</span> Famylink, Inc. — A Delaware Corporation
        </p>
        <p className="mt-6 italic">
          © Famlink 2026 — All rights reserved. Nanny share made simple.
        </p>
      </Section>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="mb-10">
    <h2 className="text-xl Livvic-SemiBold mb-2">{title}</h2>
    <div>{children}</div>
  </div>
);

export default TermsAndConditions;
