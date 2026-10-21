"use client";

import { usePathname } from "next/navigation";
import { UserRound, UsersRound } from "lucide-react";

const heroIcons = {
  user: UserRound,
  users: UsersRound,
} as const;

const starSets = [
  [
    ["left-[9%] top-[36%]", "h-1.5 w-1.5", "animate-[star-drift-one_12s_ease-in-out_3.2s_infinite]"],
    ["left-[62%] top-[24%]", "h-2 w-2", "animate-[star-drift-three_15s_ease-in-out_6.4s_infinite]"],
    ["right-[15%] bottom-[23%]", "h-1.5 w-1.5", "animate-[star-drift-two_10s_ease-in-out_1.7s_infinite]"],
  ],
  [
    ["left-[24%] top-[23%]", "h-2 w-2", "animate-[star-drift-two_13s_ease-in-out_5.1s_infinite]"],
    ["right-[33%] top-[37%]", "h-1.5 w-1.5", "animate-[star-drift-one_11s_ease-in-out_2.4s_infinite]"],
    ["left-[12%] bottom-[19%]", "h-1.5 w-1.5", "animate-[star-drift-three_14s_ease-in-out_7.2s_infinite]"],
  ],
  [
    ["left-[45%] top-[19%]", "h-1.5 w-1.5", "animate-[star-drift-three_12s_ease-in-out_4.6s_infinite]"],
    ["right-[10%] top-[30%]", "h-2 w-2", "animate-[star-drift-two_14s_ease-in-out_2.8s_infinite]"],
    ["left-[18%] bottom-[25%]", "h-1.5 w-1.5", "animate-[star-drift-one_10s_ease-in-out_6.1s_infinite]"],
  ],
] as const;

export function ShelfieHero({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: keyof typeof heroIcons;
}) {
  const pathname = usePathname();
  const seed = [...pathname].reduce((total, character) => total + character.charCodeAt(0), 0);
  const stars = starSets[seed % starSets.length];
  const Icon = icon ? heroIcons[icon] : null;

  return (
    <section className="shelfie-hero">
      <div className="shelfie-hero-stars" aria-hidden="true">
        {stars.map(([position, size, animation]) => (
          <span
            key={`${position}-${size}`}
            className={`shelfie-star absolute rounded-full ${position} ${size} ${animation}`}
          />
        ))}
      </div>
      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        {Icon && <Icon aria-hidden="true" className="size-6 text-primary" strokeWidth={1.8} />}
        <h1 className="shelfie-heading text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
      </div>
    </section>
  );
}
