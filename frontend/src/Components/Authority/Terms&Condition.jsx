import SEOMetaData from "../../NewComponents/SEOMetaData";

const TermsAndConditions = () => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 text-[#333] text-base leading-7">
      <SEOMetaData
        title={"Terms and Conditions | Famlink"}
        description={`Read the Famlink Terms and Conditions to understand our policies, user responsibilities, and guidelines for using our platform.
`}
      />
      <h1 className="text-3xl font-bold mb-6">Famlink Terms and Conditions</h1>
      <p className="text-sm text-gray-500 mb-10">
        Effective Date: April 1, 2025
      </p>

      <p className="mb-6">
        Welcome to Famlink. These Terms and Conditions ("Terms") govern your
        access to and use of our website, mobile application, and services
        (collectively, the "Platform"). By accessing or using Famlink, you agree
        to be bound by these Terms. If you do not agree, please do not use the
        Platform.
      </p>

      <Section title="1. Introduction">
        Famlink, Inc. ("Famlink," "we," "our," or "us") provides a digital
        platform for families, caregivers, and childcare-related businesses to
        connect, communicate, and coordinate childcare arrangements. Famlink is
        a neutral marketplace and does not provide, employ, or supervise
        childcare providers.
      </Section>

      <Section title="2. Eligibility">
        You must be at least 18 years of age to use this Platform. By using
        Famlink, you represent and warrant that you have the right, authority,
        and capacity to enter into these Terms.
      </Section>

      <Section title="3. Account Registration">
        You must create an account to access certain features. You agree to
        provide accurate, current, and complete information during registration
        and to keep it up to date. You are responsible for maintaining the
        confidentiality of your login credentials and for all activities under
        your account.
      </Section>

      <Section title="4. Role of Famlink">
        Famlink is solely a platform to facilitate connections. We do not
        verify, endorse, or guarantee the qualifications, background, or conduct
        of users. You are solely responsible for evaluating and engaging with
        other users.
        <p className="mt-3 Livvic-SemiBold">Important Disclaimer:</p>
        <p>
          Famlink is not a party to any agreement made between users. We do not
          supervise, direct, or control the services, conduct, or communications
          of families, caregivers, or businesses. By using the platform, you
          agree that Famlink is not responsible or liable for any outcome,
          dispute, injury, or loss—whether financial, personal, or legal—that
          may arise from user interactions or arrangements.
        </p>
      </Section>

      <Section title="5. User Responsibilities">
        <ul className="list-disc ml-6">
          <li>Conducting background checks and interviews</li>
          <li>Determining the suitability of any user or service</li>
          <li>Negotiating and agreeing to service terms</li>
          <li>Complying with applicable local, state, and federal laws</li>
        </ul>
        <p className="mt-3">
          Famlink does not guarantee the outcome of any interaction. Users are
          expected to do their own due diligence before engaging with other
          users. Famlink is not responsible or obligated to conduct background
          checks, verify credentials, or oversee any interactions on the
          platform.
        </p>
      </Section>

      <Section title="6. Payments and Subscriptions">
        Certain features of the Platform require payment. All fees are
        non-refundable unless otherwise stated. You authorize Famlink to charge
        your provided payment method for applicable fees. Prices are subject to
        change with notice. Famlink uses third-party payment processors. We are
        not responsible for any issues arising from those services.
      </Section>

      <Section title="7. Content and Conduct">
        <ul className="list-disc ml-6">
          <li>Post false, misleading, or inappropriate content</li>
          <li>Harass, threaten, or abuse others</li>
          <li>Use the platform for any illegal or unauthorized purpose</li>
          <li>Impersonate another person or entity</li>
        </ul>
        <p className="mt-3">
          Famlink reserves the right to remove content or suspend accounts that
          violate these Terms.
        </p>
      </Section>

      <Section title="8. Intellectual Property">
        All content on the Platform (excluding user-generated content),
        including logos, designs, and code, is the property of Famlink, Inc. and
        protected by copyright and trademark laws. You may not copy, modify,
        distribute, or use our content without prior written consent.
      </Section>

      <Section title="9. Limitation of Liability">
        To the fullest extent permitted by law, Famlink, Inc. and its officers,
        directors, employees, or agents shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages, or any loss of
        profits, revenues, or data arising from your use of the Platform or
        interactions with other users.
      </Section>

      <Section title="10. Disclaimer of Warranties">
        The Platform is provided "as is" and "as available" without warranties
        of any kind. Famlink disclaims all warranties, express or implied,
        including but not limited to merchantability, fitness for a particular
        purpose, and non-infringement. We do not warrant that the Platform will
        be secure, uninterrupted, error-free, or free of viruses or other
        harmful components.
      </Section>

      <Section title="11. Indemnification">
        You agree to defend, indemnify, and hold harmless Famlink, Inc. and its
        affiliates, officers, directors, employees, and agents from and against
        any claims, liabilities, damages, losses, and expenses, including legal
        fees, arising out of or related to:
        <ul className="list-disc ml-6 mt-2">
          <li>Your use or misuse of the Platform</li>
          <li>Your violation of these Terms</li>
          <li>Your interaction with other users</li>
          <li>Your violation of any applicable laws or regulations</li>
        </ul>
      </Section>

      <Section title="12. Data Privacy and Cybersecurity">
        Famlink implements industry-standard security measures to protect your
        personal information and account data. However, no method of
        transmission over the internet or electronic storage is 100% secure. By
        using the Platform, you acknowledge that you provide your information at
        your own risk. You are responsible for keeping your account credentials
        confidential. We are not liable for any unauthorized access to or use of
        your account resulting from your failure to secure your login
        information.
      </Section>

      <Section title="13. Termination">
        Famlink may suspend or terminate your access to the Platform at any time
        for any reason, including violation of these Terms. You may also delete
        your account at any time. All provisions of these Terms that should
        survive termination shall do so.
      </Section>

      <Section title="14. Governing Law">
        These Terms shall be governed by the laws of the State of Delaware,
        without regard to its conflict of laws rules. You agree that any legal
        proceeding shall be brought exclusively in the state or federal courts
        located in Delaware.
      </Section>

      <Section title="15. Changes to Terms">
        We may modify these Terms at any time. We will provide notice of
        material changes by posting the new terms on the Platform and updating
        the "Effective Date" above. Your continued use of the Platform
        constitutes acceptance of the revised Terms.
      </Section>

      <Section title="16. Contact">
        For questions about these Terms, contact us at:
        <br />
        <a href="mailto:support@Famlink.us" className="text-blue-600 underline">
          support@Famlink.us
        </a>
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
