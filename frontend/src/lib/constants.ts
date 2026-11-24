import type { PlanId } from "@/types";

export const APP_NAME = "WhatsRep";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

export const POLL_INTERVAL_MS = 2000;

export const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: "LayoutDashboard" },
  { href: "/inbox", label: "WhatsApp Inbox", icon: "MessageSquare" },
  { href: "/orders", label: "Orders", icon: "ShoppingBag" },
  { href: "/catalog", label: "Product Catalog", icon: "Package" },
  { href: "/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/recovery", label: "Cart Recovery", icon: "RefreshCcw", planMin: "professional" as PlanId },
  { href: "/team", label: "Team Members", icon: "Users", planMin: "professional" as PlanId },
  { href: "/billing", label: "Plans & Billing", icon: "CreditCard" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;

export const PLANS: Record<
  PlanId,
  {
    id: PlanId;
    name: string;
    price: number;
    description: string;
    features: string[];
  }
> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 15,
    description: "Text-based automation for growing sellers.",
    features: [
      "Text-based automated responses",
      "Basic catalog RAG",
      "Standard analytics",
      "WhatsApp inbox",
    ],
  },
  professional: {
    id: "professional",
    name: "Professional",
    price: 30,
    description: "Multi-agent ops with cart recovery.",
    features: [
      "Everything in Starter",
      "Roman-Urdu understanding",
      "Multi-agent dashboard",
      "Cart recovery",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 60,
    description: "Voice notes and payment OCR verification.",
    features: [
      "Everything in Professional",
      "Voice Note Analyzer",
      "Screenshot OCR payment verification",
      "Priority support",
    ],
  },
};

export const PLAN_RANK: Record<PlanId, number> = {
  starter: 1,
  professional: 2,
  enterprise: 3,
};

export const MISSING_BACKEND = {
  auth: "JWT signup/login/forgot-password APIs (planned Phase 3)",
  orders: "Orders CRUD + payment verification endpoints (planned Phase 6)",
  catalog: "POST /catalog/upload and product listing APIs (planned Phase 4)",
  analytics: "Analytics aggregate endpoints (planned Phase 8)",
  recovery: "Cart recovery settings and campaign APIs (planned Phase 7)",
  team: "Team invite/role management APIs (planned Phase 3/8)",
  settings: "Merchant settings persistence APIs (planned Phase 3)",
  billing: "Subscription/billing gateway APIs (planned Phase 8)",
  websocket: "WebSocket realtime channel (planned Phase 8) — polling used instead",
  takeover: "Conversation status takeover/return-to-AI APIs (planned Phase 4)",
} as const;
