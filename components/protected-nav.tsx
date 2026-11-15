"use client";

import {
  BookHeart,
  BarChart3,
  LayoutDashboard,
  Library,
  Menu,
  MessageCircle,
  Share2,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AccountActionsMenu } from "@/components/account-actions-menu";

const links = [
  { href: "/protected", label: "Dashboard", icon: LayoutDashboard },
  { href: "/protected/recommendations", label: "For you", icon: Sparkles },
  { href: "/protected/chat", label: "AI chat", icon: MessageCircle },
  { href: "/protected/library", label: "My Library", icon: Library },
  { href: "/protected/wishlist", label: "Wishlist", icon: BookHeart },
  { href: "/protected/shared-books", label: "Shared books", icon: Share2 },
  { href: "/protected/stats", label: "Stats", icon: BarChart3 },
  { href: "/protected/profiles", label: "Profiles", icon: UsersRound },
] as const;

export function ProtectedNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();
  const navLinksRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeHref = links.find(({ href }) => {
    return href === "/protected"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  })?.href ?? links[0].href;

  useEffect(() => {
    // The chosen link is about to be hidden with the menu; hand focus to the new page
    // so keyboard users don't get dropped back at the top of the document.
    if (navLinksRef.current?.contains(document.activeElement) && toggleRef.current?.offsetParent) {
      document.getElementById("main-content")?.focus({ preventScroll: true });
    }
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const items = getMenuLinks();
    (items.find((link) => link.getAttribute("aria-current") === "page") ?? items[0])?.focus();
  }, [menuOpen]);

  function getMenuLinks() {
    return Array.from(navLinksRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []);
  }

  function closeMenu({ returnFocus }: { returnFocus: boolean }) {
    setMenuOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!menuOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu({ returnFocus: true });
      return;
    }

    const items = getMenuLinks();
    const index = items.indexOf(document.activeElement as HTMLAnchorElement);
    const next =
      event.key === "ArrowDown" ? items[(index + 1) % items.length]
      : event.key === "ArrowUp" ? items[(index - 1 + items.length) % items.length]
      : event.key === "Home" ? items[0]
      : event.key === "End" ? items[items.length - 1]
      : null;
    if (next) {
      event.preventDefault();
      next.focus();
    }
  }

  function handleMenuBlur(event: React.FocusEvent<HTMLDivElement>) {
    // Close when keyboard focus moves elsewhere. A null relatedTarget (e.g. a mouse click
    // in Safari, which doesn't focus links) must not close it before the click lands.
    const next = event.relatedTarget;
    if (menuOpen && next && !navLinksRef.current?.contains(next) && next !== toggleRef.current) {
      setMenuOpen(false);
    }
  }

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
        onKeyDown={handleMenuKeyDown}
        onBlur={handleMenuBlur}
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
            </Link>
          );
        })}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <AccountActionsMenu unreadCount={unreadCount} />
        <ThemeSwitcher />
        <button
          ref={toggleRef}
          type="button"
          className="shelfie-mobile-menu-toggle"
          onKeyDown={(event) => {
            if (event.key === "Escape" && menuOpen) closeMenu({ returnFocus: true });
          }}
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
