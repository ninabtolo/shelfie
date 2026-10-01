import { BookOpen, Sparkles } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";

const stars = [
  ["left-[7%] top-[17%]", "h-1.5 w-1.5", "animate-[star-drift-one_11s_ease-in-out_1.8s_infinite]"],
  ["left-[17%] top-[43%]", "h-1 w-1", "animate-[star-drift-two_8s_ease-in-out_4.1s_infinite]"],
  ["left-[9%] top-[72%]", "h-1 w-1", "animate-[star-drift-three_13s_ease-in-out_0.6s_infinite]"],
  ["left-[83%] top-[16%]", "h-1 w-1", "animate-[star-drift-three_9s_ease-in-out_3.5s_infinite]"],
  ["left-[94%] top-[39%]", "h-1.5 w-1.5", "animate-[star-drift-one_12s_ease-in-out_5.2s_infinite]"],
  ["left-[87%] top-[63%]", "h-1 w-1", "animate-[star-drift-two_10s_ease-in-out_1.3s_infinite]"],
  ["left-[74%] top-[87%]", "h-1 w-1", "animate-[star-drift-three_14s_ease-in-out_6.4s_infinite]"],
  ["left-[30%] top-[91%]", "h-1.5 w-1.5", "animate-[star-drift-one_9.5s_ease-in-out_2.7s_infinite]"],
  ["left-[6%] top-[89%]", "h-1 w-1", "animate-[star-drift-two_12.5s_ease-in-out_7.1s_infinite]"],
  ["left-[24%] top-[11%]", "h-1 w-1", "animate-[star-drift-three_10.5s_ease-in-out_4.8s_infinite]"],
  ["left-[91%] top-[78%]", "h-1 w-1", "animate-[star-drift-one_13.5s_ease-in-out_8.2s_infinite]"],
  ["left-[14%] top-[57%]", "h-2 w-2", "animate-[star-drift-two_15s_ease-in-out_2.4s_infinite]"],
  ["left-[78%] top-[35%]", "h-0.5 w-0.5", "animate-[star-drift-three_11.5s_ease-in-out_6.8s_infinite]"],
  ["left-[39%] top-[93%]", "h-1.5 w-1.5", "animate-[star-drift-one_14.5s_ease-in-out_9.1s_infinite]"],
] as const;

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="login-sky relative flex min-h-svh w-full items-center justify-center overflow-hidden px-5 py-12 sm:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-48 -top-20 h-[42rem] w-[42rem] rounded-full bg-pink-300/65 blur-3xl dark:bg-indigo-900/35" />
        <div className="absolute -bottom-44 -right-48 h-[48rem] w-[48rem] rounded-full bg-sky-300/65 blur-3xl dark:bg-violet-900/35" />
        <div className="absolute left-1/2 top-1/3 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-violet-300/55 blur-3xl dark:bg-blue-900/25" />
        {stars.map(([position, size, animation]) => (
          <span key={position} className={`login-star absolute rounded-full ${position} ${size} ${animation}`} />
        ))}
      </div>
      <div className="absolute right-5 top-5 sm:right-8 sm:top-8"><ThemeSwitcher /></div>
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="font-display text-5xl font-semibold tracking-tight text-foreground animate-[gentle-glow_5s_ease-in-out_infinite] sm:text-6xl">
            Shelfie
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
            Keep your stories close, discover new worlds, and let your reading flourish.
          </p>
        </div>
        {children}
        <div className="mt-8 flex flex-col items-center text-center">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-foreground/65">
            <Sparkles className="h-3.5 w-3.5" /> your personal bookshelf
          </p>
          <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/5 text-foreground/75 shadow-[0_8px_30px_hsl(270_20%_30%/0.12)]">
            <BookOpen className="h-6 w-6" strokeWidth={1.6} />
          </div>
        </div>
      </div>
    </main>
  );
}
