"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  History,
  Settings,
  ShoppingCart,
  ScrollText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";

const NAV_ITEMS = [
  { href: "/sell", label: "Sell", icon: ShoppingCart },
  { href: "/sevas", label: "Sevas", icon: ScrollText },
  { href: "/history", label: "History", icon: History },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function NavLinks({ pathname, className }: { pathname: string | null; className?: string }) {
  return (
    <nav className={cn("flex items-center gap-0.5 overflow-x-auto sm:gap-1", className)}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Nav({ templeName }: { templeName: string }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 print:hidden">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="flex min-h-14 items-center gap-2 py-2 sm:h-14 sm:py-0">
          <Link
            href="/sell"
            className="min-w-0 flex-1 text-balance break-words font-semibold tracking-tight sm:max-w-[220px] sm:flex-none sm:truncate md:max-w-none"
          >
            {templeName}
          </Link>

          <NavLinks pathname={pathname} className="hidden flex-1 justify-center sm:flex" />

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>

        <NavLinks pathname={pathname} className="justify-center pb-2 sm:hidden" />
      </div>
    </header>
  );
}
