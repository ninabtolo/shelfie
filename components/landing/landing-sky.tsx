"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { round, seededRandom } from "./seeded-random";
import { Sparkle } from "./sparkle";

const drifts = ["star-drift-one", "star-drift-two", "star-drift-three"] as const;

// Three depths: far stars barely move, near stars follow the pointer the most.
const layerSpecs = [
  { depth: 6, lift: 0.06, share: 0.45, minSize: 3, maxSize: 5 },
  { depth: 14, lift: 0.14, share: 0.35, minSize: 4, maxSize: 7 },
  { depth: 26, lift: 0.26, share: 0.2, minSize: 5, maxSize: 9 },
];

const shootingStars = [
  { left: "78%", top: "14%", duration: 13, delay: 2.5 },
  { left: "46%", top: "6%", duration: 19, delay: 8 },
  { left: "96%", top: "38%", duration: 23, delay: 14 },
];

function buildSky(seed: number, density: number) {
  const random = seededRandom(seed);
  const between = (min: number, max: number) => round(min + random() * (max - min));

  const layers = layerSpecs.map((spec, layerIndex) => {
    const stars = Array.from({ length: Math.round(density * spec.share) }, () => {
      const size = between(spec.minSize, spec.maxSize);
      return {
        style: {
          left: `${between(2, 98)}%`,
          top: `${between(4, 86)}%`,
          width: `${size}px`,
          height: `${size}px`,
          animation: `${drifts[Math.floor(random() * drifts.length)]} ${between(9, 16)}s ease-in-out ${between(0, 9)}s infinite`,
        } satisfies CSSProperties,
      };
    });

    // Constant, faint twinkling dust keeps the sky alive between star drifts.
    const dust = Array.from({ length: Math.round(density * spec.share * 1.4) }, () => ({
      style: {
        left: `${between(1, 99)}%`,
        top: `${between(2, 92)}%`,
        "--twinkle-duration": `${between(2.8, 6.5)}s`,
        "--twinkle-delay": `${between(0, 6)}s`,
      } as CSSProperties,
    }));

    const glints = layerIndex === 2
      ? Array.from({ length: 4 }, () => ({
          style: {
            left: `${between(6, 94)}%`,
            top: `${between(8, 72)}%`,
            "--glint-size": `${between(10, 18)}px`,
            "--glint-delay": `${between(0, 5)}s`,
          } as CSSProperties,
        }))
      : [];

    return { spec, stars, dust, glints };
  });

  return layers;
}

/**
 * Animated night sky for the landing page bands: drifting Shelfie stars, twinkling
 * dust, occasional shooting stars, pointer parallax and a stardust trail.
 * It fills its positioned parent and listens for the pointer on that parent.
 */
export function LandingSky({
  seed = 7,
  density = 36,
  scrollParallax = false,
}: {
  seed?: number;
  density?: number;
  scrollParallax?: boolean;
}) {
  const layers = useMemo(() => buildSky(seed, density), [seed, density]);
  const skyRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sky = skyRef.current;
    const host = sky?.parentElement;
    if (!sky || !host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let scroll = 0;
    let lastTrailAt = 0;
    let lastTrailX = -100;
    let lastTrailY = -100;

    const tick = () => {
      currentX += (targetX - currentX) * 0.07;
      currentY += (targetY - currentY) * 0.07;
      sky.style.setProperty("--px", currentX.toFixed(3));
      sky.style.setProperty("--py", currentY.toFixed(3));
      sky.style.setProperty("--sy", scroll.toFixed(1));
      const settled = Math.abs(targetX - currentX) < 0.002 && Math.abs(targetY - currentY) < 0.002;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const spawnTrail = (x: number, y: number) => {
      const layer = trailRef.current;
      const now = performance.now();
      if (!layer || layer.childElementCount > 26) return;
      if (now - lastTrailAt < 32 || Math.hypot(x - lastTrailX, y - lastTrailY) < 14) return;
      lastTrailAt = now;
      lastTrailX = x;
      lastTrailY = y;

      const dot = document.createElement("span");
      const size = 3 + Math.random() * 5;
      dot.className = "landing-trail";
      dot.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;--tx:${((Math.random() - 0.5) * 46).toFixed(1)}px;--ty:${(12 + Math.random() * 34).toFixed(1)}px`;
      dot.addEventListener("animationend", () => dot.remove(), { once: true });
      layer.appendChild(dot);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      schedule();
      if (event.pointerType === "mouse") spawnTrail(event.clientX - rect.left, event.clientY - rect.top);
    };
    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      schedule();
    };
    const onScroll = () => {
      const limit = host.offsetTop + host.offsetHeight;
      if (window.scrollY > limit) return;
      scroll = Math.max(0, window.scrollY - host.offsetTop);
      schedule();
    };

    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);
    if (scrollParallax) window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [scrollParallax]);

  return (
    <div ref={skyRef} className="landing-sky" aria-hidden="true">
      {layers.map(({ spec, stars, dust, glints }, index) => (
        <div
          key={index}
          className="landing-sky-layer"
          style={{ "--depth": spec.depth, "--lift": spec.lift } as CSSProperties}
        >
          {dust.map(({ style }, dustIndex) => (
            <span key={`d${dustIndex}`} className="landing-dust" style={style} />
          ))}
          {stars.map(({ style }, starIndex) => (
            <span key={`s${starIndex}`} className="shelfie-star landing-star" style={style} />
          ))}
          {glints.map(({ style }, glintIndex) => (
            <Sparkle key={`g${glintIndex}`} className="landing-glint" style={style} />
          ))}
        </div>
      ))}
      {shootingStars.map((star) => (
        <span
          key={star.left}
          className="landing-shooting"
          style={{
            left: star.left,
            top: star.top,
            "--shoot-duration": `${star.duration}s`,
            "--shoot-delay": `${star.delay}s`,
          } as CSSProperties}
        />
      ))}
      <div ref={trailRef} className="landing-trails" />
    </div>
  );
}
