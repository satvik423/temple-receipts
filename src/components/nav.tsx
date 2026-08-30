"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  History,
  ReceiptText,
  ScrollText,
  Settings,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";

const NAV_ITEMS = [
  { href: "/sell", label: "Sell", icon: ReceiptText },
  { href: "/sevas", label: "Sevas", icon: ScrollText },
  { href: "/history", label: "History", icon: History },
  { href: "/balance", label: "Balance", icon: Wallet },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Nav({ templeName }: { templeName: string }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
        <Link
          href="/sell"
          className="max-w-[100px] shrink-0 truncate font-semibold tracking-tight sm:max-w-[220px] md:max-w-none"
        >
          {templeName}
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-0.5 overflow-x-auto sm:gap-1">
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

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
