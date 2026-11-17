"use client";

import { useEffect } from "react";

/**
 * Page-wide landing effects that don't need React state:
 * - scroll reveals for every `[data-reveal]` element (they get `data-visible`);
 * - a cursor-following glow for every `[data-spotlight]` card (`--mx` / `--my`).
 * Content stays visible if JavaScript or IntersectionObserver is unavailable,
 * because the hidden state only applies once `data-reveal-ready` is set.
 */
export function LandingEffects({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            (entry.target as HTMLElement).dataset.visible = "true";
            observer?.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
      );
      root.querySelectorAll("[data-reveal]").forEach((element) => observer?.observe(element));
      root.dataset.revealReady = "true";
    }

    const onPointerMove = (event: PointerEvent) => {
      const card = (event.target as Element | null)?.closest<HTMLElement>("[data-spotlight]");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };
    root.addEventListener("pointermove", onPointerMove);

    return () => {
      observer?.disconnect();
      root.removeEventListener("pointermove", onPointerMove);
    };
  }, [rootId]);

  return null;
}
