import { ArrowRight, BookOpen, EyeOff, Lock, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { LegalLinks } from "@/components/legal/legal-links";
import { ChatDemo } from "./chat-demo";
import { FeatureChapters } from "./feature-chapters";
import { LandingBookshelf } from "./landing-bookshelf";
import { LandingEffects } from "./landing-effects";
import { LandingNav } from "./landing-nav";
import { LandingSky } from "./landing-sky";
import { ScrollLitText } from "./scroll-lit-text";
import { Sparkle } from "./sparkle";
import "./landing.css";

const ROOT_ID = "shelfie-landing";
const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

const moods = [
  ["a cozy mystery for a rainy Sunday", "something that feels like autumn", "fantasy with found family", "a book to cry over, gently", "short, strange and beautiful", "like Circe, but darker"],
  ["a romance that isn't cheesy", "classics that don't feel like homework", "magical libraries, please", "a page-turner for the plane", "slow, lyrical, a little sad", "dark academia without the despair"],
];

const promises = [
  {
    icon: ShieldCheck,
    title: "AI is opt-in",
    body: "Personalization stays off until you switch it on. While it's off, nothing about your reading is sent to the AI.",
  },
  {
    icon: Lock,
    title: "A wishlist for your eyes only",
    body: "Your wishlist is private — a quiet place for the books you're still deciding on.",
  },
  {
    icon: EyeOff,
    title: "You choose who sees",
    body: "Every book on your shelf can be public for other readers or kept just for you.",
  },
  {
    icon: Trash2,
    title: "Leave whenever you like",
    body: "Delete your account and every bit of its data from settings, in a couple of clicks.",
  },
];

function SignUpLink({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Link href="/auth/sign-up" className={`landing-cta landing-cta-primary ${className}`}>
      <span>{children}</span>
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}

function LoginLink({ children }: { children: React.ReactNode }) {
  return (
    <Link href="/auth/login" className="landing-cta landing-cta-ghost">
      {children}
    </Link>
  );
}

function Hero() {
  const letters = [..."Shelfie"];
  return (
    <section className="landing-band landing-hero" aria-labelledby="landing-title">
      <div className="landing-aurora" aria-hidden="true"><span /><span /><span /></div>
      <LandingSky seed={11} density={46} scrollParallax />

      <div className="landing-hero-content">
        <p className="landing-eyebrow landing-rise" style={delay(100)}>
          <Sparkles aria-hidden="true" /> a magical reading space
        </p>
        <h1 id="landing-title" className="landing-hero-title" aria-label="Shelfie">
          {letters.map((letter, index) => (
            <span key={index} aria-hidden="true" className="landing-letter" style={{ "--i": index } as CSSProperties}>
              {letter}
            </span>
          ))}
          <Sparkle className="landing-hero-sparkle" />
        </h1>
        <p className="landing-hero-tagline landing-rise" style={delay(900)}>
          Where your stories live — and the next ones find you.
        </p>
        <p className="landing-hero-copy landing-rise" style={delay(1050)}>
          Build your library, remember what you loved, share books with other readers and get
          recommendations shaped by the way you actually read.
        </p>
        <div className="landing-hero-actions landing-rise" style={delay(1200)}>
          <SignUpLink>Start your shelf</SignUpLink>
          <LoginLink>I already have an account</LoginLink>
        </div>
      </div>

      <LandingBookshelf />
    </section>
  );
}

function Statement() {
  return (
    <section className="landing-statement" aria-label="About Shelfie">
      <p className="landing-eyebrow justify-center" data-reveal>
        <Sparkle className="h-3 w-3" /> once upon a shelf
      </p>
      <ScrollLitText
        text="Shelfie is a cozy, magical corner made for readers — a place to keep every story you've loved, remember why it mattered, and find the next one that will stay with you."
        highlights={["magical", "loved", "next"]}
      />
    </section>
  );
}

function Chapters() {
  return (
    <section className="landing-chapters" aria-labelledby="landing-chapters-title">
      <div className="landing-glow is-left" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <header className="landing-section-head" data-reveal>
          <p className="landing-eyebrow"><Sparkle className="h-3 w-3" /> what lives on your shelf</p>
          <h2 id="landing-chapters-title" className="landing-title">
            Six little <span className="landing-ink">spells</span> for your reading life
          </h2>
          <p className="landing-lead">
            Tracking, remembering, wishing, sharing, discovering — everything a reader does, gathered
            into one calm and beautiful place.
          </p>
        </header>
        <FeatureChapters />
      </div>
    </section>
  );
}

function Assistant() {
  return (
    <section className="landing-assistant" aria-labelledby="landing-assistant-title">
      <div className="landing-glow is-right" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <header className="landing-section-head is-centered" data-reveal>
          <p className="landing-eyebrow"><Sparkle className="h-3 w-3" /> your reading assistant</p>
          <h2 id="landing-assistant-title" className="landing-title">
            Ask the <span className="landing-ink">stars</span> what to read next
          </h2>
          <p className="landing-lead">
            Describe a mood, a feeling, a book you can&apos;t stop thinking about. Shelfie&apos;s assistant
            answers with real books — checked against Google Books — that fit you.
          </p>
        </header>
      </div>

      <div className="landing-marquee" data-reveal>
        {moods.map((row, rowIndex) => (
          <div key={rowIndex} className="landing-marquee-track" data-reverse={rowIndex === 1}>
            {[...row, ...row].map((mood, index) => (
              <span key={index} className="landing-mood" aria-hidden={index >= row.length}>
                {mood}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div data-reveal style={delay(120)}>
          <ChatDemo />
        </div>
        <p className="landing-ai-note" data-reveal>
          <span className="landing-switch" aria-hidden="true"><span /></span>
          <span>
            AI personalization is <strong>off by default</strong>. Turn it on in your account only if you
            want it.
          </span>
        </p>
      </div>
    </section>
  );
}

function Promises() {
  return (
    <section className="landing-promises-section" aria-labelledby="landing-promises-title">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <header className="landing-section-head" data-reveal>
          <p className="landing-eyebrow"><Sparkle className="h-3 w-3" /> magic, with manners</p>
          <h2 id="landing-promises-title" className="landing-title">
            Your shelf, <span className="landing-ink">your rules</span>
          </h2>
        </header>
        <ul className="landing-promises">
          {promises.map(({ icon: Icon, title, body }, index) => (
            <li key={title} data-reveal style={delay(index * 110)}>
              <div className="landing-promise" data-spotlight>
                <span className="landing-promise-icon" aria-hidden="true"><Icon /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Finale() {
  return (
    <section className="landing-band landing-finale" aria-labelledby="landing-finale-title">
      <LandingSky seed={29} density={30} />
      <div className="landing-finale-content" data-reveal>
        <span className="landing-finale-icon" aria-hidden="true"><BookOpen /></span>
        <h2 id="landing-finale-title" className="landing-title">Your shelf is waiting.</h2>
        <p className="landing-lead">
          Pull up a chair, bring your favorite books. We saved you a spot under the stars.
        </p>
        <div className="landing-hero-actions">
          <SignUpLink>Create your account</SignUpLink>
          <LoginLink>Log in</LoginLink>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div id={ROOT_ID} className="shelfie-app landing">
      <a href="#main-content" className="shelfie-skip-link">Skip to main content</a>
      <LandingEffects rootId={ROOT_ID} />
      <LandingNav />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Hero />
        <Statement />
        <Chapters />
        <Assistant />
        <Promises />
        <Finale />
      </main>
      <footer className="landing-footer">
        <span className="shelfie-brand"><BookOpen aria-hidden="true" /><span>Shelfie</span></span>
        <LegalLinks />
      </footer>
    </div>
  );
}
