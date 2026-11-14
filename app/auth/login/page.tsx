import { LoginForm } from "@/components/login-form";
import { AuthShell } from "@/components/auth-shell";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ account_deleted?: string }>;
}) {
  const { account_deleted } = await searchParams;
  return (
    <AuthShell>
      {account_deleted === "1" && (
        <p role="status" className="mb-4 rounded-lg border border-border/70 bg-background/70 px-4 py-3 text-center text-sm text-foreground">
          Your account and all of its data have been deleted. Thanks for reading with Shelfie.
        </p>
      )}
      <LoginForm />
    </AuthShell>
  );
}
