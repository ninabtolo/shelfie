"use client";

import { BarChart3, BookHeart, Library, Sparkles, Star, UsersRound } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Sparkle } from "./sparkle";
import {
  ForYouMock,
  LibraryMock,
  ReadersMock,
  ReviewMock,
  StatsMock,
  WishlistMock,
} from "./landing-mockups";

const chapters = [
  {
    numeral: "I",
    icon: Library,
    title: "Build your library",
    body: "Keep every book you've read, are reading, or bravely abandoned. Your shelf grows with you — and each book can be public or just yours.",
    points: ["Read, reading & abandoned", "Public or private, book by book", "Search millions of titles"],
    Mock: LibraryMock,
  },
  {
    numeral: "II",
    icon: Star,
    title: "Rate, review, remember",
    body: "Give each book its stars and a few words while the feeling is still fresh. Mark the ones that changed you as favorites.",
    points: ["1–5 star ratings", "Written reviews", "Favorites that stand out"],
    Mock: ReviewMock,
  },
  {
    numeral: "III",
    icon: BookHeart,
    title: "Wish upon a wishlist",
    body: "Save the books you're curious about in a private wishlist, kept apart from your library. No pressure, no audience.",
    points: ["Private by design", "Kept apart from your shelf"],
    Mock: WishlistMock,
  },
  {
    numeral: "IV",
    icon: Sparkles,
    title: "Recommendations that know you",
    body: "Shelfie reads the shape of your shelf — favorites, ratings, genres, even your reviews — and suggests what to read next. Not interested? It remembers.",
    points: ["Built from your real reading", "Checked against Google Books", "“Not interested” is respected"],
    Mock: ForYouMock,
  },
  {
    numeral: "V",
    icon: UsersRound,
    title: "Readers, together",
    body: "Follow other readers, wander through their public shelves, and send a book straight to a friend with a little note.",
    points: ["Follow & explore profiles", "Share books with a message", "Notifications for follows & shares"],
    Mock: ReadersMock,
  },
  {
    numeral: "VI",
    icon: BarChart3,
    title: "Your reading, in stars",
    body: "See your reading life at a glance: activity over time, statuses, ratings, top genres and the authors you keep coming back to.",
    points: ["Reading activity", "Top genres & authors", "Rating patterns"],
    Mock: StatsMock,
  },
] as const;

/**
 * Scroll-driven feature tour. On large screens the app preview stays pinned while
 * the chapters scroll past; on small screens each chapter shows its own preview.
 */
export function FeatureChapters() {
  const [active, setActive] = useState(0);
  const chapterRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      // A thin band across the middle of the viewport decides the active chapter.
      { rootMargin: "-45% 0px -45% 0px" },
    );
    chapterRefs.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-chapters-grid">
      <div className="landing-stage" aria-hidden="true">
        <div className="landing-stage-frame">
          <Sparkle className="landing-stage-glint is-one" />
          <Sparkle className="landing-stage-glint is-two" />
          <span className="landing-stage-orbit" />
        </div>
        {chapters.map(({ numeral, Mock }, index) => (
          <div key={numeral} className="landing-mock-host landing-stage-slide" data-active={index === active}>
            <span className="landing-stage-numeral">{numeral}</span>
            <Mock />
          </div>
        ))}
      </div>

      <div className="landing-chapter-track" style={{ "--fill": `${((active + 1) / chapters.length) * 100}%` } as CSSProperties}>
        <span className="landing-rail" aria-hidden="true"><span className="landing-rail-fill" /></span>
        <ol className="landing-chapter-list">
          {chapters.map(({ numeral, icon: Icon, title, body, points, Mock }, index) => (
            <li
              key={numeral}
              ref={(element) => { chapterRefs.current[index] = element; }}
              data-index={index}
              data-active={index === active}
              data-passed={index <= active}
              className="landing-chapter"
            >
              <div className="landing-chapter-head">
                <span className="landing-chapter-dot" aria-hidden="true"><Sparkle /></span>
                <span className="landing-chapter-numeral">Chapter {numeral}</span>
                <span className="landing-chapter-icon" aria-hidden="true"><Icon /></span>
              </div>
              <h3 className="landing-chapter-title">{title}</h3>
              <p className="landing-chapter-body">{body}</p>
              <ul className="landing-chapter-points">
                {points.map((point) => (
                  <li key={point}><Sparkle className="landing-point-star" />{point}</li>
                ))}
              </ul>
              <div className="landing-mock-host landing-chapter-mock" data-reveal aria-hidden="true">
                <Mock />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
