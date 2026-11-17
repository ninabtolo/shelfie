import {
  BarChart3,
  Bell,
  BookHeart,
  Heart,
  Library,
  Lock,
  MessageCircleHeart,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import type { CSSProperties } from "react";

/* Decorative previews of the real app, rendered with pure markup so the landing page
   needs no images. Animations inside them run when their `.landing-mock-host`
   wrapper is active (desktop stage) or revealed (mobile). */

export function MiniCover({ title, hue, width = "2.6rem" }: { title: string; hue: number; width?: string }) {
  return (
    <span className="mock-cover" style={{ "--h": hue, "--cw": width } as CSSProperties}>
      <span>{title}</span>
    </span>
  );
}

function PanelHead({ icon: Icon, title, children }: { icon: typeof Library; title: string; children?: React.ReactNode }) {
  return (
    <div className="mock-head">
      <span className="mock-head-title"><Icon aria-hidden="true" />{title}</span>
      {children}
    </div>
  );
}

const libraryBooks = [
  { title: "The Night Circus", author: "Erin Morgenstern", hue: 268, status: "Reading", tone: "pink" },
  { title: "Piranesi", author: "Susanna Clarke", hue: 198, status: "Read", tone: "blue" },
  { title: "Circe", author: "Madeline Miller", hue: 14, status: "Read", tone: "blue" },
  { title: "Moby-Dick", author: "Herman Melville", hue: 214, status: "Abandoned", tone: "muted" },
] as const;

export function LibraryMock() {
  return (
    <div className="mock-panel">
      <PanelHead icon={Library} title="My Library">
        <span className="mock-count">47 books</span>
      </PanelHead>
      <div className="mock-body">
        <div className="mock-chips">
          <span className="mock-chip">All</span>
          <span className="mock-chip is-on">Reading</span>
          <span className="mock-chip">Read</span>
          <span className="mock-chip">Abandoned</span>
        </div>
        {libraryBooks.map((book, index) => (
          <div key={book.title} className="mock-book mock-stagger" style={{ "--i": index } as CSSProperties}>
            <MiniCover title={book.title} hue={book.hue} />
            <span className="min-w-0">
              <span className="mock-book-title">{book.title}</span>
              <span className="mock-book-author">{book.author}</span>
            </span>
            <span className="mock-status" data-tone={book.tone}>{book.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewMock() {
  return (
    <div className="mock-panel">
      <div className="mock-review-top">
        <MiniCover title="Piranesi" hue={198} width="5.5rem" />
        <div className="min-w-0 space-y-1">
          <p className="mock-review-title">Piranesi</p>
          <p className="mock-book-author">Susanna Clarke</p>
          <span className="mock-favorite"><Heart aria-hidden="true" /> Favorite</span>
        </div>
      </div>
      <div className="mock-body">
        <div className="mock-rating">
          <span className="mock-rating-label">Your rating</span>
          <span className="mock-stars">
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} className="mock-star" style={{ "--i": index } as CSSProperties} aria-hidden="true" />
            ))}
          </span>
        </div>
        <div className="mock-review-text">
          <span className="mock-rating-label">Your review</span>
          <p>Quiet, strange and luminous. I didn&apos;t want to leave the House — I still think about the tides.</p>
        </div>
      </div>
    </div>
  );
}

const wishes = [
  { title: "The Starless Sea", hue: 248 },
  { title: "Howl's Moving Castle", hue: 326 },
  { title: "Babel", hue: 12 },
] as const;

export function WishlistMock() {
  return (
    <div className="mock-panel">
      <PanelHead icon={BookHeart} title="Wishlist">
        <span className="mock-private"><Lock aria-hidden="true" /> Only you</span>
      </PanelHead>
      <div className="mock-body">
        <div className="mock-wish-grid">
          {wishes.map((wish, index) => (
            <div key={wish.title} className="mock-wish mock-stagger" style={{ "--i": index } as CSSProperties}>
              <MiniCover title={wish.title} hue={wish.hue} width="100%" />
              <span className="mock-wish-title">{wish.title}</span>
            </div>
          ))}
        </div>
        <div className="mock-add-row mock-stagger" style={{ "--i": 3 } as CSSProperties}>
          <Plus aria-hidden="true" /> Saved for a rainy day
        </div>
      </div>
    </div>
  );
}

const picks = [
  {
    title: "The Starless Sea",
    author: "Erin Morgenstern",
    hue: 248,
    reason: "Because you loved The Night Circus — another dreamlike world of stories inside stories.",
  },
  {
    title: "Jonathan Strange & Mr Norrell",
    author: "Susanna Clarke",
    hue: 160,
    reason: "You gave Piranesi five stars. This is Clarke's sprawling, footnoted take on English magic.",
  },
] as const;

export function ForYouMock() {
  return (
    <div className="mock-panel">
      <PanelHead icon={Sparkles} title="For you">
        <span className="mock-refresh"><RefreshCw aria-hidden="true" /> Refresh</span>
      </PanelHead>
      <div className="mock-body">
        {picks.map((pick, index) => (
          <div key={pick.title} className="mock-ai-card mock-stagger" style={{ "--i": index } as CSSProperties}>
            <MiniCover title={pick.title} hue={pick.hue} width="3.2rem" />
            <span className="min-w-0 space-y-1">
              <span className="mock-book-title">{pick.title}</span>
              <span className="mock-book-author">{pick.author}</span>
              <span className="mock-reason">{pick.reason}</span>
              <span className="mock-ai-actions">
                <span className="mock-mini-button is-primary"><Plus aria-hidden="true" /> Wishlist</span>
                <span className="mock-mini-button"><X aria-hidden="true" /> Not interested</span>
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReadersMock() {
  return (
    <div className="mock-panel">
      <PanelHead icon={UsersRound} title="Readers">
        <span className="mock-bell"><Bell aria-hidden="true" /><span>1</span></span>
      </PanelHead>
      <div className="mock-body">
        <div className="mock-profile">
          <span className="mock-avatar">L</span>
          <span className="min-w-0">
            <span className="mock-book-title">@luna.reads</span>
            <span className="mock-book-author">128 books · 42 followers</span>
          </span>
          <span className="mock-follow">
            <span className="is-before"><UserPlus aria-hidden="true" /> Follow</span>
            <span className="is-after">Following</span>
          </span>
        </div>
        <div className="mock-share">
          <span className="mock-share-label"><MessageCircleHeart aria-hidden="true" /> @luna.reads shared a book with you</span>
          <div className="flex items-center gap-3">
            <MiniCover title="Circe" hue={14} width="2.4rem" />
            <p>&ldquo;Please read this, I need someone to talk about it with.&rdquo;</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// [books added, reviews written] per month, as % of the busiest month.
const activity = [
  [30, 14], [46, 22], [38, 30], [62, 34], [52, 26], [76, 48],
  [64, 40], [88, 56], [70, 44], [94, 62], [80, 52], [100, 70],
];

export function StatsMock() {
  return (
    <div className="mock-panel">
      <PanelHead icon={BarChart3} title="Reading stats">
        <span className="mock-count">this year</span>
      </PanelHead>
      <div className="mock-body">
        <div className="mock-stats-top">
          <div className="mock-donut">
            <div className="mock-donut-hole"><strong>47</strong><span>books</span></div>
          </div>
          <div className="mock-legend">
            <span><i data-tone="read" /> Read · 38</span>
            <span><i data-tone="reading" /> Reading · 4</span>
            <span><i data-tone="abandoned" /> Abandoned · 5</span>
            <span className="mock-average">★ 4.3 average</span>
          </div>
        </div>
        <div className="mock-bars">
          {activity.map(([added, reviews], index) => (
            <span key={index} className="mock-bar-pair">
              <span className="mock-bar" style={{ "--v": `${added}%`, "--i": index } as CSSProperties} />
              <span className="mock-bar is-reviews" style={{ "--v": `${reviews}%`, "--i": index } as CSSProperties} />
            </span>
          ))}
        </div>
        <div className="mock-bar-legend mock-legend">
          <span><i data-tone="added" /> Books added</span>
          <span><i data-tone="reviews" /> Reviews written</span>
        </div>
        <div className="mock-chips">
          <span className="mock-chip is-on">Fantasy</span>
          <span className="mock-chip">Literary fiction</span>
          <span className="mock-chip">Mystery</span>
        </div>
      </div>
    </div>
  );
}
