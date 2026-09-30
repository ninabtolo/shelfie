"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="login-card-shell group">
        <Card className="login-card relative z-10 border-border/70 bg-card/85 shadow-[0_24px_80px_hsl(270_30%_30%/0.12)] backdrop-blur-xl dark:shadow-[0_24px_80px_hsl(245_50%_3%/0.38)]">
          <CardHeader className="space-y-2 pb-5">
            <CardTitle className="font-display text-3xl font-semibold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="leading-6">
              Continue your quiet little reading ritual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl bg-background/60 pl-10 shadow-none transition-shadow focus-visible:shadow-[0_0_0_2px_hsl(var(--ring)/0.08)]" />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password" className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="shrink-0 whitespace-nowrap text-xs font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl bg-background/60 pl-10 shadow-none transition-shadow focus-visible:shadow-[0_0_0_2px_hsl(var(--ring)/0.08)]" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="h-11 w-full rounded-xl bg-primary font-semibold shadow-[0_8px_20px_hsl(var(--primary)/0.22)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_12px_25px_hsl(var(--primary)/0.3)]" disabled={isLoading}>
                {isLoading ? "Logging in..." : <>Open my shelf <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
              >
                Sign up
              </Link>
            </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
