import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthShell } from "@/components/auth-shell";

export default function Page() {
  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
          <Card className="login-card border-border/70 bg-card/85 shadow-[0_24px_80px_hsl(270_30%_30%/0.12)] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl">
                Thank you for signing up!
              </CardTitle>
              <CardDescription>Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You&apos;ve successfully signed up. Please check your email to
                confirm your account before signing in.
              </p>
            </CardContent>
          </Card>
      </div>
    </AuthShell>
  );
}
