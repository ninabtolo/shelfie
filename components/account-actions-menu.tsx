"use client";

import { Bell, LogOut, MoreVertical, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccountActionsMenu({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const logout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);

    const { error } = await createClient().auth.signOut();
    if (error) {
      setLogoutError(error.message);
      setIsLoggingOut(false);
      return;
    }

    router.replace("/auth/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
          aria-label="Open account menu"
        >
          <MoreVertical aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} unread notifications`}
              className="shelfie-notification-count absolute -right-1 -top-1"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/protected/notifications">
            <Bell aria-hidden="true" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">{unreadCount}</span>
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/protected/account">
            <UserRound aria-hidden="true" />
            <span>Account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isLoggingOut} onSelect={() => void logout()}>
          <LogOut aria-hidden="true" />
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </DropdownMenuItem>
        {logoutError && (
          <p className="max-w-44 px-2 py-1 text-xs text-destructive" role="alert">
            {logoutError}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
