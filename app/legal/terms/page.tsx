import type { Metadata } from "next";
import Link from "next/link";
import { ShelfieHero } from "@/components/shelfie-hero";
import { LegalContact } from "@/components/legal/legal-links";
import { GOVERNING_STATE, LEGAL_EFFECTIVE_DATE, MINIMUM_AGE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Use · Shelfie",
  description: "The rules for using Shelfie.",
};

export default function TermsOfUsePage() {
  const governingLaw = GOVERNING_STATE
    ? `the laws of the State of ${GOVERNING_STATE} and applicable U.S. federal law`
    : "the laws of the U.S. state in which Shelfie's operator resides and applicable U.S. federal law";

  return (
    <>
      <ShelfieHero title="Terms of Use" description={`Effective ${LEGAL_EFFECTIVE_DATE}`} />
      <article className="shelfie-surface legal-prose p-6 sm:p-10">
        <p className="legal-summary">
          <strong>The short version:</strong> you must be {MINIMUM_AGE} or older, be kind, only post content you have the right to share,
          and understand that Shelfie is a free personal project provided as-is. AI recommendations can be wrong.
        </p>

        <h2 id="acceptance">1. Accepting these terms</h2>
        <p>
          These Terms of Use (&quot;Terms&quot;) are an agreement between you and the individual developer who operates Shelfie
          (&quot;Shelfie,&quot; &quot;we,&quot; &quot;us&quot;). By creating an account or using Shelfie, you agree to these Terms and to our{" "}
          <Link href="/legal/privacy">Privacy Policy</Link>. If you don&apos;t agree, please don&apos;t use Shelfie.
        </p>

        <h2 id="eligibility">2. Eligibility</h2>
        <p>
          You must be <strong>at least {MINIMUM_AGE} years old</strong> to create an account or use Shelfie. By using Shelfie you confirm that
          you meet this requirement and that you are legally able to agree to these Terms. We may delete any account we reasonably believe
          belongs to someone under {MINIMUM_AGE}.
        </p>

        <h2 id="the-service">3. About the service</h2>
        <p>
          Shelfie is a free, non-commercial personal portfolio project. Features may change, be limited (for example, daily AI usage limits) or
          be removed at any time, and the service may be unavailable or discontinued without notice. We will try to give notice in the app
          before shutting down. Please keep your own copy of anything important to you, such as long reviews.
        </p>

        <h2 id="your-account">4. Your account</h2>
        <ul>
          <li>Give accurate information and keep your email address up to date.</li>
          <li>Keep your password secure. You are responsible for activity on your account.</li>
          <li>Each account is for one person. Don&apos;t share it, sell it or create accounts to evade a suspension.</li>
          <li>Usernames must not impersonate other people or be offensive or misleading.</li>
        </ul>

        <h2 id="your-content">5. Your content</h2>
        <p>
          You keep ownership of the reviews, bios, messages, profile pictures and other content you post (&quot;Your Content&quot;). You give
          Shelfie a non-exclusive, royalty-free, worldwide license to store, display, reproduce and process Your Content only as needed to
          operate and provide Shelfie, including showing it to other users according to your visibility settings and, if you enable AI
          personalization, sending it to our AI provider to generate recommendations for you. This license ends when you delete the content
          or your account, except for copies in temporary backups.
        </p>
        <p>
          You are responsible for Your Content and confirm you have the right to post it. Short quotes from books for the purpose of a review
          are fine; copying large portions of copyrighted works is not.
        </p>

        <h2 id="acceptable-use">6. Acceptable use</h2>
        <p>When using Shelfie, you agree not to:</p>
        <ul>
          <li>Harass, threaten, bully or impersonate anyone, or post hateful, discriminatory or sexually explicit content.</li>
          <li>Post content that is illegal, defamatory, or that infringes someone else&apos;s intellectual property or privacy.</li>
          <li>Share other people&apos;s personal information without their permission.</li>
          <li>Send spam, unsolicited promotions or malicious links.</li>
          <li>Scrape, crawl or collect data from Shelfie or its users through automated means.</li>
          <li>Probe, attack or bypass Shelfie&apos;s security, access rules or usage limits, or interfere with the service.</li>
          <li>Use the AI features to generate harmful content, attempt to manipulate the AI into ignoring its instructions, or use them in violation of Google&apos;s usage policies.</li>
          <li>Use Shelfie for any commercial purpose or in violation of any law.</li>
        </ul>

        <h2 id="moderation">7. Moderation, suspension and termination</h2>
        <p>
          We may remove content, limit features, or suspend or delete accounts that violate these Terms or put Shelfie or its users at risk,
          with or without notice. You can stop using Shelfie at any time and permanently delete your account yourself from Account → Delete
          account.
        </p>

        <h2 id="ai-features">8. AI features</h2>
        <p>
          AI personalization is optional and off by default. When you turn it on, Shelfie sends your reading data and chat messages to
          Google&apos;s Gemini API, as described in the <Link href="/legal/privacy#ai-personalization">Privacy Policy</Link>.
        </p>
        <p>
          AI-generated recommendations and replies are produced automatically and <strong>may be inaccurate, incomplete or unsuitable</strong>,
          including book details, summaries and content warnings. They are suggestions for entertainment only, not professional advice of any
          kind. Please check a book&apos;s details yourself before relying on them.
        </p>

        <h2 id="third-party">9. Third-party content and services</h2>
        <p>
          Book information and cover images come from the Google Books API and belong to their respective owners. Shelfie is not affiliated
          with or endorsed by Google, any publisher or any author, and we don&apos;t guarantee that book information is accurate. Links or
          content from third parties are governed by their own terms.
        </p>

        <h2 id="copyright">10. Copyright complaints</h2>
        <p>
          We respect intellectual property rights. If you believe content on Shelfie infringes your copyright, contact us at <LegalContact />{" "}
          with: (a) your contact information; (b) a description of the copyrighted work; (c) where the content appears on Shelfie; (d) a
          statement that you have a good-faith belief the use is not authorized; (e) a statement, under penalty of perjury, that your notice
          is accurate and that you are the owner or authorized to act for the owner; and (f) your physical or electronic signature. We will
          review the notice and remove infringing content where appropriate, and may suspend repeat infringers.
        </p>

        <h2 id="disclaimers">11. Disclaimers</h2>
        <p className="legal-caps">
          Shelfie is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any kind, express or implied, including warranties
          of merchantability, fitness for a particular purpose, title, non-infringement, accuracy, availability or that the service will be
          error-free or secure. We do not guarantee that your data will be preserved, and you use Shelfie at your own risk.
        </p>

        <h2 id="liability">12. Limitation of liability</h2>
        <p className="legal-caps">
          To the fullest extent permitted by law, Shelfie and its operator will not be liable for any indirect, incidental, special,
          consequential, exemplary or punitive damages, or for any loss of data, content, profits or goodwill, arising from or related to your
          use of (or inability to use) Shelfie, even if advised of the possibility of such damages. Because Shelfie is free, our total
          liability for any claim related to Shelfie will not exceed fifty U.S. dollars (US$50).
        </p>
        <p>Some jurisdictions do not allow certain limitations, so some of the above may not apply to you.</p>

        <h2 id="indemnity">13. Indemnity</h2>
        <p>
          To the extent permitted by law, you agree to indemnify and hold harmless Shelfie&apos;s operator from claims, damages and expenses
          (including reasonable attorneys&apos; fees) arising from Your Content or your violation of these Terms or of anyone&apos;s rights.
        </p>

        <h2 id="governing-law">14. Governing law</h2>
        <p>
          These Terms are governed by {governingLaw}, without regard to conflict-of-law rules. Before filing any claim, you agree to first
          contact us and try to resolve the issue informally.
        </p>

        <h2 id="changes">15. Changes to these terms</h2>
        <p>
          We may update these Terms from time to time. We will update the effective date above and, for meaningful changes, ask you to accept
          the new version in the app. If you continue using Shelfie after accepting, the updated Terms apply.
        </p>

        <h2 id="general">16. General</h2>
        <p>
          These Terms and the Privacy Policy are the entire agreement between you and Shelfie. If any part is found unenforceable, the rest
          remains in effect. Our failure to enforce a provision is not a waiver. You may not transfer these Terms; we may transfer them in
          connection with a transfer of the project.
        </p>

        <h2 id="contact">17. Contact</h2>
        <p>Questions about these Terms can be sent to <LegalContact />.</p>
      </article>
    </>
  );
}
