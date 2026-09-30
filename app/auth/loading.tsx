import { AuthShell } from "@/components/auth-shell";

export default function Loading() {
  return (
    <AuthShell>
      <div
        className="login-card rounded-xl border border-border/70 bg-card/85 p-8 text-center text-sm text-muted-foreground shadow-[0_24px_80px_hsl(270_30%_30%/0.12)] backdrop-blur-xl"
        role="status"
        aria-live="polite"
      >
        Loading your shelf...
      </div>
    </AuthShell>
  );
}
