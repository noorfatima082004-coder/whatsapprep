"use client";

import type {
  BusinessSettings,
  CatalogState,
  MerchantUser,
  Order,
  PlanId,
  Product,
  RecoveryCart,
  RecoverySettings,
  TeamMember,
} from "@/types";
import {
  DEMO_ORDERS,
  DEMO_PRODUCTS,
  DEMO_RECOVERY,
  DEMO_TEAM,
} from "@/lib/demo/data";

const USER_KEY = "whatsrep_user";
const TOKEN_KEY = "whatsrep_token";
const ORDERS_KEY = "whatsrep_orders";
const CATALOG_KEY = "whatsrep_catalog";
const TEAM_KEY = "whatsrep_team";
const RECOVERY_KEY = "whatsrep_recovery";
const RECOVERY_SETTINGS_KEY = "whatsrep_recovery_settings";
const SETTINGS_KEY = "whatsrep_settings";
const TAKEOVER_KEY = "whatsrep_takeovers";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredUser(): MerchantUser | null {
  return read<MerchantUser | null>(USER_KEY, null);
}

export function setStoredUser(user: MerchantUser | null) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  write(USER_KEY, user);
  localStorage.setItem(TOKEN_KEY, `demo.${user.id}`);
}

export function createDemoUser(input: {
  email: string;
  ownerName: string;
  businessName: string;
  plan?: PlanId;
}): MerchantUser {
  return {
    id: `m_${Date.now()}`,
    email: input.email,
    ownerName: input.ownerName,
    businessName: input.businessName,
    role: "owner",
    plan: input.plan ?? "professional",
    botEnabled: true,
    onboardingComplete: false,
    onboardingStep: 1,
    whatsappConnected: false,
    createdAt: new Date().toISOString(),
  };
}

export function getOrders(): Order[] {
  return read(ORDERS_KEY, DEMO_ORDERS);
}

export function saveOrders(orders: Order[]) {
  write(ORDERS_KEY, orders);
}

export function getCatalog(): CatalogState {
  return read(CATALOG_KEY, {
    fileName: "catalog-demo.xlsx",
    uploadedAt: new Date().toISOString(),
    status: "synced" as const,
    knowledgeBaseReady: true,
    products: DEMO_PRODUCTS,
    demo: true,
  });
}

export function saveCatalog(catalog: CatalogState) {
  write(CATALOG_KEY, catalog);
}

export function getTeam(): TeamMember[] {
  return read(TEAM_KEY, DEMO_TEAM);
}

export function saveTeam(team: TeamMember[]) {
  write(TEAM_KEY, team);
}

export function getRecoveryCarts(): RecoveryCart[] {
  return read(RECOVERY_KEY, DEMO_RECOVERY);
}

export function saveRecoveryCarts(carts: RecoveryCart[]) {
  write(RECOVERY_KEY, carts);
}

export function getRecoverySettings(): RecoverySettings {
  return read(RECOVERY_SETTINGS_KEY, {
    enabled: true,
    maxDiscountPct: 10,
    thresholdAmount: 1500,
    maxMessagesPerCustomer: 2,
    template1:
      "Assalam o Alaikum {{name}}! Aap ka {{product}} cart wait kar raha hai. Limited stock — ab order confirm karein.",
    template2:
      "Last chance {{name}}: {{product}} pe {{discount}}% off. Aaj order karein warna offer expire ho jayegi.",
  });
}

export function saveRecoverySettings(settings: RecoverySettings) {
  write(RECOVERY_SETTINGS_KEY, settings);
}

export function getBusinessSettings(user: MerchantUser): BusinessSettings {
  return read(SETTINGS_KEY, {
    businessName: user.businessName,
    ownerName: user.ownerName,
    email: user.email,
    phone: user.phone ?? "",
    logoUrl: user.logoUrl,
    botEnabled: user.botEnabled,
    responseLanguage: "roman-urdu",
    workingHoursStart: "09:00",
    workingHoursEnd: "21:00",
    humanHandoff: true,
    easypaisaWallet: "",
    jazzcashWallet: "",
    manualWalletConfirm: true,
    notifyNewMessage: true,
    notifyOrders: true,
    notifyPayments: true,
    notifyRecovery: true,
  });
}

export function saveBusinessSettings(settings: BusinessSettings) {
  write(SETTINGS_KEY, settings);
}

export type TakeoverMap = Record<string, { aiActive: boolean; assignedTo?: string | null }>;

export function getTakeovers(): TakeoverMap {
  return read(TAKEOVER_KEY, {});
}

export function saveTakeovers(map: TakeoverMap) {
  write(TAKEOVER_KEY, map);
}

export function upsertProduct(products: Product[], product: Product) {
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    const next = [...products];
    next[idx] = product;
    return next;
  }
  return [product, ...products];
}
