"use client";

import { fetchWhatsAppStatus } from "@/lib/api/services";
import type { WhatsAppStatus } from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
}

interface AppContextValue {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
  waStatus: WhatsAppStatus | null;
  refreshWaStatus: () => Promise<void>;
  notifications: NotificationItem[];
  markNotificationsRead: () => void;
  pushNotification: (title: string, body: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "n1",
      title: "Welcome to WhatsRep",
      body: "Connect your WhatsApp inbox and start automating replies.",
      at: new Date().toISOString(),
      read: false,
    },
  ]);

  const refreshWaStatus = useCallback(async () => {
    const status = await fetchWhatsAppStatus();
    setWaStatus(status);
  }, []);

  useEffect(() => {
    refreshWaStatus();
    const id = window.setInterval(refreshWaStatus, 60000);
    return () => window.clearInterval(id);
  }, [refreshWaStatus]);

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const pushNotification = useCallback((title: string, body: string) => {
    setNotifications((prev) => [
      {
        id: `n_${Date.now()}`,
        title,
        body,
        at: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
    toast(title, { description: body });
  }, []);

  const value = useMemo(
    () => ({
      sidebarCollapsed,
      setSidebarCollapsed,
      mobileNavOpen,
      setMobileNavOpen,
      waStatus,
      refreshWaStatus,
      notifications,
      markNotificationsRead,
      pushNotification,
    }),
    [
      sidebarCollapsed,
      mobileNavOpen,
      waStatus,
      refreshWaStatus,
      notifications,
      markNotificationsRead,
      pushNotification,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
