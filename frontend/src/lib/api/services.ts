/**
 * Central service layer.
 *
 * LIVE backend (current FastAPI):
 *  - GET /messages
 *  - POST /send-message
 *  - GET /status
 *
 * Everything else is isolated demo/local persistence until the matching
 * backend endpoints from the implementation plan are available.
 */
import { fetchMessages, sendMessage } from "@/lib/api/messages";
import { fetchWhatsAppStatus } from "@/lib/api/status";
import { MISSING_BACKEND } from "@/lib/constants";
import { buildDemoAnalytics, buildDemoOverview, DEMO_INVOICES } from "@/lib/demo/data";
import {
  createDemoUser,
  getBusinessSettings,
  getCatalog,
  getOrders,
  getRecoveryCarts,
  getRecoverySettings,
  getStoredUser,
  getTeam,
  saveBusinessSettings,
  saveCatalog,
  saveOrders,
  saveRecoveryCarts,
  saveRecoverySettings,
  saveTeam,
  setStoredUser,
} from "@/lib/demo/store";
import type {
  AnalyticsSnapshot,
  BusinessSettings,
  CatalogState,
  DashboardOverview,
  Invoice,
  MerchantUser,
  Order,
  PlanId,
  RecoveryCart,
  RecoverySettings,
  TeamMember,
} from "@/types";
import { phoneFromChatId } from "@/lib/utils";

export const backendSupport = {
  messages: true,
  sendMessage: true,
  whatsappStatus: true,
  auth: false,
  orders: false,
  catalog: false,
  analytics: false,
  recovery: false,
  team: false,
  settings: false,
  billing: false,
  websocket: false,
  takeover: false,
} as const;

export const missingBackendNotes = MISSING_BACKEND;

/* ---------- Auth (demo / local until JWT APIs exist) ---------- */

export async function login(email: string, _password: string): Promise<MerchantUser> {
  void _password;
  const existing = getStoredUser();
  if (existing && existing.email.toLowerCase() === email.toLowerCase()) {
    return existing;
  }
  const user = createDemoUser({
    email,
    ownerName: email.split("@")[0] || "Merchant",
    businessName: "My Business",
    plan: "professional",
  });
  user.onboardingComplete = true;
  user.onboardingStep = 7;
  user.whatsappConnected = true;
  setStoredUser(user);
  return user;
}

export async function signup(input: {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
}): Promise<MerchantUser> {
  void input.password;
  const user = createDemoUser({
    email: input.email,
    ownerName: input.ownerName,
    businessName: input.businessName,
  });
  setStoredUser(user);
  return user;
}

export async function requestPasswordReset(email: string) {
  // Missing backend: forgot-password endpoint
  return {
    ok: true,
    message: `Demo mode: reset link would be emailed to ${email}. Backend required: ${MISSING_BACKEND.auth}`,
  };
}

export async function resetPassword(_token: string, _password: string) {
  void _token;
  void _password;
  return {
    ok: true,
    message: `Demo mode: password updated locally. Backend required: ${MISSING_BACKEND.auth}`,
  };
}

export function logout() {
  setStoredUser(null);
}

export function getCurrentUser() {
  return getStoredUser();
}

export function updateCurrentUser(patch: Partial<MerchantUser>) {
  const user = getStoredUser();
  if (!user) return null;
  const next = { ...user, ...patch };
  setStoredUser(next);
  return next;
}

/* ---------- Live WhatsApp ---------- */

export { fetchMessages, sendMessage, fetchWhatsAppStatus };

export async function sendInboxReply(chatId: string, message: string) {
  return sendMessage(phoneFromChatId(chatId), message);
}

/* ---------- Dashboard / analytics (demo until APIs exist) ---------- */

export async function getDashboardOverview(
  liveMessageCount?: number,
  liveActiveChats?: number
): Promise<DashboardOverview> {
  const overview = buildDemoOverview();
  if (typeof liveMessageCount === "number") {
    overview.totalMessages = liveMessageCount;
    overview.liveInbox = true;
  }
  if (typeof liveActiveChats === "number") {
    overview.activeChats = liveActiveChats;
    overview.liveInbox = true;
  }
  return overview;
}

export async function getAnalytics(days = 30): Promise<AnalyticsSnapshot> {
  return buildDemoAnalytics(days);
}

/* ---------- Orders (local demo) ---------- */

export async function listOrders(): Promise<Order[]> {
  return getOrders();
}

export async function getOrder(id: string) {
  return getOrders().find((o) => o.id === id) ?? null;
}

export async function updateOrder(id: string, patch: Partial<Order>) {
  const orders = getOrders();
  const next = orders.map((o) => (o.id === id ? { ...o, ...patch } : o));
  saveOrders(next);
  return next.find((o) => o.id === id)!;
}

/* ---------- Catalog (local demo) ---------- */

export async function getCatalogState(): Promise<CatalogState> {
  return getCatalog();
}

export async function uploadCatalogFile(file: File): Promise<CatalogState> {
  const current = getCatalog();
  const processing: CatalogState = {
    ...current,
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
    status: "processing",
    knowledgeBaseReady: false,
    demo: true,
  };
  saveCatalog(processing);
  await new Promise((r) => setTimeout(r, 1200));
  const synced: CatalogState = {
    ...processing,
    status: "synced",
    knowledgeBaseReady: true,
  };
  saveCatalog(synced);
  return synced;
}

export async function deleteCatalog(): Promise<CatalogState> {
  const empty: CatalogState = {
    status: "idle",
    knowledgeBaseReady: false,
    products: [],
    demo: true,
  };
  saveCatalog(empty);
  return empty;
}

/* ---------- Recovery (local demo) ---------- */

export async function listRecoveryCarts(): Promise<RecoveryCart[]> {
  return getRecoveryCarts();
}

export async function getRecoveryConfig(): Promise<RecoverySettings> {
  return getRecoverySettings();
}

export async function saveRecoveryConfig(settings: RecoverySettings) {
  saveRecoverySettings(settings);
  return settings;
}

export async function updateRecoveryCart(id: string, patch: Partial<RecoveryCart>) {
  const carts = getRecoveryCarts().map((c) => (c.id === id ? { ...c, ...patch } : c));
  saveRecoveryCarts(carts);
  return carts.find((c) => c.id === id)!;
}

/* ---------- Team (local demo) ---------- */

export async function listTeam(): Promise<TeamMember[]> {
  return getTeam();
}

export async function inviteAgent(input: { name: string; email: string; role: "owner" | "agent" }) {
  const team = getTeam();
  const member: TeamMember = {
    id: `t_${Date.now()}`,
    name: input.name,
    email: input.email,
    role: input.role,
    status: "invited",
    assignedConversations: 0,
    demo: true,
  };
  saveTeam([member, ...team]);
  return member;
}

export async function removeAgent(id: string) {
  saveTeam(getTeam().filter((t) => t.id !== id));
}

export async function updateAgent(id: string, patch: Partial<TeamMember>) {
  const team = getTeam().map((t) => (t.id === id ? { ...t, ...patch } : t));
  saveTeam(team);
  return team.find((t) => t.id === id)!;
}

/* ---------- Settings (local demo) ---------- */

export async function loadSettings(user: MerchantUser) {
  return getBusinessSettings(user);
}

export async function persistSettings(settings: BusinessSettings, user: MerchantUser) {
  saveBusinessSettings(settings);
  setStoredUser({
    ...user,
    businessName: settings.businessName,
    ownerName: settings.ownerName,
    email: settings.email,
    phone: settings.phone,
    botEnabled: settings.botEnabled,
    logoUrl: settings.logoUrl,
  });
  return settings;
}

/* ---------- Billing (local demo) ---------- */

export async function listInvoices(): Promise<Invoice[]> {
  return DEMO_INVOICES;
}

export async function changePlan(plan: PlanId) {
  const user = getStoredUser();
  if (!user) throw new Error("Not authenticated");
  const next = { ...user, plan };
  setStoredUser(next);
  return next;
}
