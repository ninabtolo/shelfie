import type { Metadata } from "next";
import Link from "next/link";
import { ShelfieHero } from "@/components/shelfie-hero";
import { LegalContact } from "@/components/legal/legal-links";
import { LEGAL_EFFECTIVE_DATE, MINIMUM_AGE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy · Shelfie",
  description: "How Shelfie collects, uses and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <ShelfieHero title="Privacy Policy" description={`Effective ${LEGAL_EFFECTIVE_DATE}`} />
      <article className="shelfie-surface legal-prose p-6 sm:p-10">
        <p className="legal-summary">
          <strong>The short version:</strong> Shelfie is a free, non-commercial personal project. We collect only what is needed to run your
          reading space, we don&apos;t show ads, we don&apos;t use tracking or analytics cookies, and we never sell your personal information.
          Your reading data is only sent to an AI provider if you turn on AI personalization yourself.
        </p>

        <h2 id="who-we-are">1. Who we are</h2>
        <p>
          Shelfie (&quot;Shelfie,&quot; &quot;we,&quot; &quot;us&quot;) is a social reading web app built and operated by an individual developer in the
          United States as a personal portfolio project. It is offered for free and is not a business. This Privacy Policy explains what
          information we collect, how we use it, and the choices you have. It applies together with our{" "}
          <Link href="/legal/terms">Terms of Use</Link>.
        </p>

        <h2 id="information-we-collect">2. Information we collect</h2>
        <h3>Information you give us</h3>
        <ul>
          <li><strong>Account information:</strong> your email address, username and password. Passwords are handled and hashed by our authentication provider; we never see them in plain text.</li>
          <li><strong>Profile information:</strong> an optional bio and profile picture.</li>
          <li><strong>Reading activity:</strong> books in your library, reading status, favorites, ratings, written reviews, your wishlist and books you mark as &quot;Not Interested.&quot;</li>
          <li><strong>Social activity:</strong> who you follow, books you share with other readers (including any message you add) and the related notifications.</li>
          <li><strong>AI chat:</strong> if you use the AI reading assistant, the messages you send and the replies you receive are saved to your account so you can come back to the conversation.</li>
          <li><strong>Consent records:</strong> the date you accepted these terms and confirmed you are at least {MINIMUM_AGE}, and the version you accepted.</li>
          <li><strong>Messages to us:</strong> anything you include if you contact us.</li>
        </ul>
        <h3>Information collected automatically</h3>
        <ul>
          <li><strong>Session cookies</strong> that keep you signed in (see <a href="#cookies">Cookies</a> below).</li>
          <li>
            <strong>Technical logs</strong> kept by our hosting and database providers, such as IP address, browser type, the pages or
            services requested and timestamps. These are used to operate the service, keep it secure and fix problems.
          </li>
        </ul>
        <p>We do not use analytics tools, advertising networks, social media pixels or any cross-site tracking.</p>

        <h2 id="how-we-use">3. How we use your information</h2>
        <ul>
          <li>To create and secure your account, sign you in and send account emails (confirmation and password reset).</li>
          <li>To provide Shelfie&apos;s features: your library, reviews, wishlist, reading stats, following, sharing and notifications.</li>
          <li>To generate book recommendations and power the AI reading assistant, <strong>only if you opt in</strong> (see section 5).</li>
          <li>To prevent abuse, enforce usage limits and our Terms, and keep the service working.</li>
          <li>To respond to your requests and comply with the law.</li>
        </ul>
        <p>We do not sell your personal information, and we do not use or share it for targeted (cross-context behavioral) advertising.</p>

        <h2 id="visible-to-others">4. What other users can see</h2>
        <p>Shelfie is a social app. Other signed-in users can see:</p>
        <ul>
          <li>Your username, profile picture, bio and follower/following counts.</li>
          <li>Books in your library that are marked as public, along with their status. You can mark any book as private when you add or edit it.</li>
          <li>Reviews and ratings you write, which may appear on that book&apos;s page.</li>
          <li>Books and messages you share, which are visible to the person you send them to.</li>
        </ul>
        <p>Your email address, wishlist, AI settings and AI conversations are never shown to other users. Please don&apos;t put personal or sensitive information in your bio, reviews or shared messages.</p>

        <h2 id="ai-personalization">5. AI personalization (opt-in)</h2>
        <p>
          AI personalization is <strong>off by default</strong>. You can turn it on or off at any time in{" "}
          <Link href="/protected/account#ai-personalization">Account → AI personalization</Link>. A single setting controls both automatic
          recommendations and the AI reading assistant.
        </p>
        <h3>When it is on, we send to Google&apos;s Gemini API:</h3>
        <ul>
          <li>Titles, authors, genres, descriptions and language of books in your library and wishlist.</li>
          <li>Your reading status, favorites, ratings and the text of your reviews.</li>
          <li>Books you marked as &quot;Not Interested,&quot; so they aren&apos;t recommended again.</li>
          <li>Messages you write in the AI chat, plus recent messages from the same conversation for context.</li>
        </ul>
        <h3>We never send:</h3>
        <ul>
          <li>Your email address, password, username, bio or profile picture.</li>
          <li>Information about other users, such as who you follow or what they share with you.</li>
        </ul>
        <p>
          Google processes this information under its own terms and privacy policy. Depending on the Gemini API service tier in use, Google
          may retain the content and use it to improve its products, and it may be reviewed by people. <strong>Please don&apos;t include
          sensitive personal information</strong> (such as health, financial or contact details) in your reviews or AI chat messages.
        </p>
        <p>
          Turning AI personalization off stops any new information from being sent. It cannot recall information that was already sent.
          Your saved AI conversations stay in your account until you delete them from the AI chat page. AI output can be inaccurate; see the{" "}
          <Link href="/legal/terms#ai-features">Terms of Use</Link>.
        </p>

        <h2 id="service-providers">6. Service providers we rely on</h2>
        <p>We share information only with the providers needed to run Shelfie, and only for that purpose:</p>
        <ul>
          <li><strong>Supabase</strong>: database, user authentication, profile picture storage and account emails.</li>
          <li><strong>Vercel</strong>: website hosting and delivery.</li>
          <li><strong>Google Books API</strong>: book search, details and cover images. Your search terms are sent to Google to find books.</li>
          <li><strong>Google Gemini API</strong>: AI recommendations and chat, only if you opt in (section 5).</li>
        </ul>
        <p>
          We may also disclose information if required by law, to protect the rights, safety or security of users or the public, or in
          connection with a transfer of the project. In that case, this policy would continue to apply to your information.
        </p>

        <h2 id="cookies">7. Cookies and local storage</h2>
        <p>Shelfie uses only what is strictly necessary for the site to work:</p>
        <ul>
          <li><strong>Authentication cookies</strong> set by Supabase to keep you signed in securely. Without them you can&apos;t log in.</li>
          <li><strong>Local storage</strong> in your browser to remember your light/dark theme preference.</li>
        </ul>
        <p>
          We don&apos;t use advertising, analytics or third-party tracking cookies, which is why Shelfie doesn&apos;t show a cookie banner. You can
          clear cookies and local storage in your browser at any time; this will sign you out.
        </p>
        <p>
          <strong>Do Not Track:</strong> because Shelfie does not track you across other websites, we don&apos;t change our behavior in
          response to browser &quot;Do Not Track&quot; signals. We also honor Global Privacy Control signals by default, since we never sell or
          share personal information.
        </p>

        <h2 id="retention">8. How long we keep information</h2>
        <p>
          We keep your information while your account is active. When you delete content (for example a review or an AI conversation) it is
          removed from the app. You can delete your whole account at any time from{" "}
          <Link href="/protected/account#delete-account-title">Account → Delete account</Link>. This immediately and permanently deletes your
          profile, profile picture, library, reviews, wishlist, follows, shares, notifications, AI settings and AI conversations. Copies may remain in provider backups or logs for a limited time before they are overwritten, and
          we may keep limited information when needed to comply with the law or resolve disputes.
        </p>
        <p>
          Because Shelfie is a personal project, it may be discontinued. If that happens, we will try to give notice in the app and will
          delete user data after shutdown.
        </p>

        <h2 id="your-choices">9. Your choices and rights</h2>
        <ul>
          <li><strong>Edit</strong> your username, bio and profile picture in Account.</li>
          <li><strong>Control visibility</strong> by marking library books as private.</li>
          <li><strong>Delete</strong> reviews, books, wishlist items and AI conversations at any time.</li>
          <li><strong>Turn AI personalization on or off</strong> in Account.</li>
          <li><strong>Delete your account</strong> and all of its data yourself, at any time, in Account → Delete account.</li>
          <li>
            <strong>Request a copy of your data or a correction</strong> by contacting us at <LegalContact />, using the email address
            linked to your account. We may need to confirm the request comes from you.
          </li>
        </ul>
        <p>
          Some U.S. states (such as California, Colorado, Connecticut, Virginia and others) give residents specific privacy rights. Shelfie
          is a small non-commercial project and may not be subject to those laws, but we will honor reasonable requests to access, correct or
          delete your information no matter where you live, and we will never treat you differently for making one.
        </p>

        <h2 id="age">10. Age requirement and children&apos;s privacy</h2>
        <p>
          Shelfie is intended only for people who are <strong>{MINIMUM_AGE} or older</strong>, and everyone must confirm their age to create
          an account. Shelfie is not directed to children, and we do not knowingly collect personal information from anyone under{" "}
          {MINIMUM_AGE}, including children under 13 as defined by the Children&apos;s Online Privacy Protection Act (COPPA). If we learn that an
          account belongs to someone under {MINIMUM_AGE}, we will delete it and its data. If you believe a minor is using Shelfie, please
          contact us at <LegalContact />.
        </p>

        <h2 id="security">11. Security</h2>
        <p>
          We use reasonable safeguards, including encrypted connections (HTTPS), hashed passwords and database access rules that limit each
          account to its own private data. No online service is perfectly secure, so please use a unique password and let us know if you
          suspect unauthorized access to your account.
        </p>

        <h2 id="location">12. Where your information is processed</h2>
        <p>
          Shelfie is operated from the United States and intended for users there. Your information may be stored and processed in the United
          States or in other countries where our service providers operate.
        </p>

        <h2 id="changes">13. Changes to this policy</h2>
        <p>
          We may update this policy as Shelfie changes. We will update the effective date above and, for meaningful changes, ask you to review
          and accept the new version the next time you sign in.
        </p>

        <h2 id="contact">14. Contact</h2>
        <p>Questions or requests about privacy can be sent to <LegalContact />.</p>
      </article>
    </>
  );
}
