import type { CSSProperties } from "react";
import { round, seededRandom } from "./seeded-random";

// Shelfie's pastel family: rose, pink, orchid, violet, periwinkle, sky, aqua, cream.
const hues = [340, 326, 300, 282, 268, 248, 210, 198, 44];
const SPINE_COUNT = 64;
const STACK_POSITIONS = new Set([20, 43]);

type ShelfItem =
  | { kind: "spine"; style: CSSProperties; mark: boolean }
  | { kind: "stack"; style: CSSProperties; books: { style: CSSProperties; mark: boolean }[] }
  | { kind: "gap" };

function buildShelf(): ShelfItem[] {
  const random = seededRandom(2024);
  const center = SPINE_COUNT / 2;
  const items: ShelfItem[] = [];

  for (let index = 0; index < SPINE_COUNT; index += 1) {
    // Books rise from the middle of the shelf outwards.
    const delay = `${Math.round(650 + Math.abs(index - center) * 38)}ms`;

    if (STACK_POSITIONS.has(index)) {
      items.push({
        kind: "stack",
        style: { "--delay": delay } as CSSProperties,
        books: Array.from({ length: 3 }, (_, bookIndex) => ({
          mark: random() < 0.4,
          style: {
            "--h": hues[Math.floor(random() * hues.length)],
            "--w": `${round(5.6 + random() * 1.8 - bookIndex * 0.4)}em`,
            "--t": `${round(1.25 + random() * 0.55)}em`,
            "--shift": `${round((random() - 0.5) * 0.7)}em`,
          } as CSSProperties,
        })),
      });
      continue;
    }

    if (random() < 0.06) {
      items.push({ kind: "gap" });
    }

    const tilt = random() < 0.08 ? round((random() < 0.5 ? -1 : 1) * (5 + random() * 5)) : 0;
    items.push({
      kind: "spine",
      mark: random() < 0.28,
      style: {
        "--h": hues[Math.floor(random() * hues.length)],
        "--w": `${round(1.15 + random() * 1.15)}em`,
        "--sh": `${round(5.6 + random() * 4.2)}em`,
        "--tilt": `${tilt}deg`,
        // Pivot on the corner the book leans towards so it never sinks into the board.
        "--origin": tilt < 0 ? "bottom left" : "bottom right",
        "--delay": delay,
      } as CSSProperties,
    });
  }

  return items;
}

const shelf = buildShelf();

/** The row of glowing books that the hero sky rests on. Purely decorative. */
export function LandingBookshelf() {
  return (
    <div className="landing-shelf" aria-hidden="true">
      <div className="landing-shelf-row">
        {shelf.map((item, index) => {
          if (item.kind === "gap") return <span key={index} className="landing-shelf-gap" />;
          if (item.kind === "stack") {
            return (
              <span key={index} className="landing-stack" style={item.style}>
                {item.books.map(({ style, mark }, bookIndex) => (
                  <span key={bookIndex} className="landing-lying-book" style={style}>
                    {mark && <span className="landing-spine-mark">✦</span>}
                  </span>
                ))}
              </span>
            );
          }
          return (
            <span key={index} className="landing-spine" style={item.style}>
              {item.mark && <span className="landing-spine-mark">✦</span>}
            </span>
          );
        })}
      </div>
      <div className="landing-shelf-board" />
    </div>
  );
}
