"use client";

import { Badge } from "@/components/ui/Badge";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { formatRelativeTime, initials } from "@/lib/utils";
import {
  Bell,
  ChevronRight,
  Menu,
  Search,
  Wifi,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const TITLES: Record<string, string> = {
  "/overview": "Overview",
  "/inbox": "WhatsApp Inbox",
  "/orders": "Orders",
  "/catalog": "Product Catalog",
  "/analytics": "Analytics",
  "/recovery": "Cart Recovery",
  "/team": "Team Members",
  "/billing": "Plans & Billing",
  "/settings": "Settings",
  "/onboarding": "Onboarding",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    setMobileNavOpen,
    waStatus,
    notifications,
    markNotificationsRead,
  } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const title = useMemo(() => {
    const match = Object.keys(TITLES).find(
      (key) => pathname === key || pathname.startsWith(`${key}/`)
    );
    return match ? TITLES[match] : "Dashboard";
  }, [pathname]);

  const unread = notifications.filter((n) => !n.read).length;

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <button
          type="button"
          className="rounded-xl border border-line p-2 text-ink-muted hover:bg-brand-app lg:hidden"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-xs text-ink-muted">
            <span>WhatsRep</span>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate">{title}</span>
          </div>
          <h1 className="page-title truncate">{title}</h1>
        </div>

        <div className="hidden max-w-xs flex-1 md:block lg:max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim()) {
                  router.push(`/inbox?q=${encodeURIComponent(search.trim())}`);
                }
              }}
              placeholder="Search customers…"
              className="input-field h-10 pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl border border-line px-3 py-2 sm:flex">
            {waStatus?.connected ? (
              <>
                <Wifi className="h-4 w-4 text-success" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-ink">WhatsApp</div>
                  <div className="max-w-[120px] truncate text-[11px] text-ink-muted">
                    {waStatus.display_phone_number || waStatus.verified_name || "Connected"}
                  </div>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-danger" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-ink">WhatsApp</div>
                  <div className="text-[11px] text-ink-muted">Disconnected</div>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              className="relative rounded-xl border border-line p-2 text-ink-muted hover:bg-brand-app"
              onClick={() => {
                setNotifOpen((v) => !v);
                setProfileOpen(false);
                markNotificationsRead();
              }}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-green px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-card border border-line bg-white shadow-soft">
                <div className="border-b border-line px-4 py-3 text-sm font-semibold">Notifications</div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-ink-muted">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="border-b border-line px-4 py-3 last:border-0">
                        <div className="text-sm font-medium text-ink">{n.title}</div>
                        <div className="mt-0.5 text-xs text-ink-muted">{n.body}</div>
                        <div className="mt-1 text-[11px] text-ink-muted">
                          {formatRelativeTime(n.at)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-line px-2 py-1.5 hover:bg-brand-app"
              onClick={() => {
                setProfileOpen((v) => !v);
                setNotifOpen(false);
              }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
                {initials(user.ownerName)}
              </div>
              <div className="hidden text-left md:block">
                <div className="text-xs font-semibold text-ink">{user.ownerName}</div>
                <div className="text-[11px] text-ink-muted">{user.role}</div>
              </div>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-card border border-line bg-white shadow-soft">
                <div className="border-b border-line px-4 py-3">
                  <div className="text-sm font-semibold">{user.businessName}</div>
                  <div className="mt-1">
                    <Badge tone="green">{user.plan}</Badge>
                  </div>
                </div>
                <Link
                  href="/settings"
                  className="block px-4 py-2.5 text-sm hover:bg-brand-app"
                  onClick={() => setProfileOpen(false)}
                >
                  Settings
                </Link>
                <Link
                  href="/billing"
                  className="block px-4 py-2.5 text-sm hover:bg-brand-app"
                  onClick={() => setProfileOpen(false)}
                >
                  Plans & Billing
                </Link>
                <button
                  type="button"
                  className="block w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-red-50"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
