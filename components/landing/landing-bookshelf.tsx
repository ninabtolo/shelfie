import type { CSSProperties } from "react";
import { round, seededRandom } from "./seeded-random";

// Dusty variations of the app's pink → lilac → blue gradient: same hue family,
// but much less saturated so the books sit on the background instead of matching it.
const tones = [
  { h: 330, s: 30 }, // dusty rose
  { h: 316, s: 24 }, // mauve
  { h: 300, s: 18 }, // heather
  { h: 286, s: 26 }, // lilac
  { h: 272, s: 22 }, // muted violet
  { h: 256, s: 18 }, // lavender grey
  { h: 236, s: 20 }, // periwinkle grey
  { h: 212, s: 24 }, // misty blue
  { h: 300, s: 9 }, // warm taupe (neutral)
  { h: 250, s: 8 }, // cool grey (neutral)
];
const SPINE_COUNT = 64;

// Separate seed for the colour jitter so it never reshuffles the shelf's sizes and tilts.
const paint = seededRandom(511);

/** `pick` is the layout generator's draw for this book (keeps its sequence intact). */
function bookTone(pick: number): CSSProperties {
  const tone = tones[Math.floor(pick * tones.length)];
  return {
    "--h": Math.round(tone.h + (paint() - 0.5) * 10),
    "--s": Math.round(tone.s + (paint() - 0.5) * 8),
    // Lightness offset: some books darker, some lighter, for a layered shelf.
    "--l": Math.round(-11 + paint() * 17),
  } as CSSProperties;
}
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
            ...bookTone(random()),
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
        ...bookTone(random()),
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
