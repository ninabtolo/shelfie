"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
      setIsLoggingOut(false);
      return;
    }

    router.replace("/auth/login");
    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={logout} disabled={isLoggingOut}>
        {isLoggingOut ? "Logging out..." : "Logout"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
