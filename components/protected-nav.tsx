"use client";

import {
  Bell,
  BookHeart,
  LayoutDashboard,
  Library,
  Menu,
  Share2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

const links = [
  { href: "/protected", label: "Dashboard", icon: LayoutDashboard },
  { href: "/protected/library", label: "My Library", icon: Library },
  { href: "/protected/wishlist", label: "Wishlist", icon: BookHeart },
  { href: "/protected/shared-books", label: "Shared books", icon: Share2 },
  { href: "/protected/notifications", label: "Notifications", icon: Bell },
  { href: "/protected/account", label: "Account", icon: UserRound },
  { href: "/protected/profiles", label: "Profiles", icon: UsersRound },
] as const;

export function ProtectedNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();
  const navLinksRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeHref = links.find(({ href }) => {
    return href === "/protected"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  })?.href ?? links[0].href;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const activeLink = linkRefs.current[activeHref];
    if (!activeLink) return;

    const updateIndicator = () => {
      setIndicator({ left: activeLink.offsetLeft, width: activeLink.offsetWidth });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeHref]);

  return (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
      <div
        ref={navLinksRef}
        id="main-navigation"
        className={`shelfie-nav-links ${menuOpen ? "is-open" : ""}`}
        aria-label="Main navigation"
      >
        {indicator && (
          <span
            className="shelfie-nav-active-indicator"
            aria-hidden="true"
            style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}
          />
        )}
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === activeHref;

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              ref={(node) => {
                linkRefs.current[href] = node;
              }}
              className={`shelfie-nav-link ${active ? "is-active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              {label === "Notifications" && unreadCount > 0 && (
                <span aria-label={`${unreadCount} unread notifications`} className="shelfie-notification-count">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ThemeSwitcher />
        <LogoutButton />
        <button
          type="button"
          className="shelfie-mobile-menu-toggle"
          aria-controls="main-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
