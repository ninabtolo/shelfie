"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const normalize = (word: string) => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** A paragraph whose words light up one after another as it scrolls through the viewport. */
export function ScrollLitText({ text, highlights = [] }: { text: string; highlights?: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");
  const highlighted = new Set(highlights.map(normalize));

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.style.setProperty("--p", "1");
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const viewport = window.innerHeight;
      // 0 when the paragraph's top reaches 82% of the viewport, 1 when its bottom passes 45%.
      const progress = (viewport * 0.82 - rect.top) / (rect.height + viewport * 0.37);
      element.style.setProperty("--p", Math.min(1, Math.max(0, progress)).toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <p ref={ref} className="landing-lit" style={{ "--n": words.length } as CSSProperties}>
      {words.map((word, index) => (
        <span
          key={index}
          className={highlighted.has(normalize(word)) ? "landing-lit-word landing-ink" : "landing-lit-word"}
          style={{ "--i": index } as CSSProperties}
        >
          {word}{index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
