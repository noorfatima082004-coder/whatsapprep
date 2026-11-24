"use client";

import { Badge } from "@/components/ui/Badge";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { APP_NAME, NAV_ITEMS, PLAN_RANK, PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  RefreshCcw,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ICONS = {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  Package,
  BarChart3,
  RefreshCcw,
  Users,
  CreditCard,
  Settings,
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { sidebarCollapsed, setSidebarCollapsed, mobileNavOpen, setMobileNavOpen } =
    useApp();

  if (!user) return null;

  const content = (
    <div className="flex h-full flex-col bg-brand-navy text-white">
      <div className="flex items-center justify-between px-4 py-5">
        <Link href="/overview" className="flex items-center gap-2.5" onClick={() => setMobileNavOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-green text-sm font-bold text-white">
            WR
          </div>
          {!sidebarCollapsed && (
            <div>
              <div className="text-base font-semibold tracking-tight">{APP_NAME}</div>
              <div className="text-[11px] text-white/55">Merchant Console</div>
            </div>
          )}
        </Link>
        <button
          type="button"
          className="hidden rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:inline-flex"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon as keyof typeof ICONS];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const locked =
            "planMin" in item &&
            item.planMin &&
            PLAN_RANK[user.plan] < PLAN_RANK[item.planMin];

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-brand-green text-white"
                  : "text-white/70 hover:bg-white/8 hover:text-white",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={item.label}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {!sidebarCollapsed && (
                <span className="flex flex-1 items-center justify-between gap-2">
                  {item.label}
                  {locked && <Badge tone="yellow">Pro</Badge>}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        {!sidebarCollapsed ? (
          <div className="rounded-xl bg-white/5 p-3">
            <div className="truncate text-sm font-semibold">{user.ownerName}</div>
            <div className="truncate text-xs text-white/55">{user.businessName}</div>
            <div className="mt-2">
              <Badge tone="green">{PLANS[user.plan].name}</Badge>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-white/70 hover:bg-white/10"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden h-screen shrink-0 border-r border-brand-navy/20 lg:block",
          sidebarCollapsed ? "w-[76px]" : "w-[260px]"
        )}
      >
        {content}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-brand-navy/40"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[280px] animate-slide-in shadow-soft">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
