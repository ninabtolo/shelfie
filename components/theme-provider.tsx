"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * next-themes injects an inline <script> that sets the theme before first paint.
 * React 19 warns about <script> tags rendered on the client, even though this one
 * already ran from the server HTML. Marking it as non-executable on the client
 * silences the warning without changing behavior (the element has
 * suppressHydrationWarning, so the attribute difference is ignored).
 */
const scriptProps =
  typeof window === "undefined" ? undefined : ({ type: "application/json" } as const);

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider scriptProps={scriptProps} {...props} />;
}
