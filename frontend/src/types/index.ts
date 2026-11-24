export type PlanId = "starter" | "professional" | "enterprise";

export type Role = "owner" | "agent";

export interface MerchantUser {
  id: string;
  email: string;
  ownerName: string;
  businessName: string;
  role: Role;
  plan: PlanId;
  botEnabled: boolean;
  onboardingComplete: boolean;
  onboardingStep: number;
  whatsappConnected: boolean;
  phone?: string;
  logoUrl?: string;
  createdAt: string;
}

export interface WhatsAppStatus {
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  connected: boolean;
  error?: string;
}

export type MessageType =
  | "textMessage"
  | "imageMessage"
  | "videoMessage"
  | "audioMessage"
  | "documentMessage"
  | "stickerMessage"
  | "locationMessage"
  | "contactMessage"
  | string;

export interface InboxMessage {
  id: string | null;
  sender_name: string;
  chat_id: string;
  message_type: MessageType;
  message: string;
  direction?: "in" | "out";
  received_at: string;
}

export interface Conversation {
  chatId: string;
  name: string;
  phone: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  aiActive: boolean;
  assignedTo?: string | null;
  status: "open" | "closed";
  messages: InboxMessage[];
}

export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "payment_submitted"
  | "verified"
  | "manual_review"
  | "rejected"
  | "failed"
  | "shipped"
  | "delivered";

export type PaymentStatus =
  | "unpaid"
  | "submitted"
  | "verified"
  | "manual_review"
  | "rejected"
  | "failed";

export interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  paymentScreenshotUrl?: string;
  ocrTransactionId?: string;
  ocrAmount?: number;
  receiverAccount?: string;
  ocrConfidence?: number;
  verificationReasons?: string[];
  demo?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  lastSyncedAt: string;
  demo?: boolean;
}

export interface CatalogState {
  fileName?: string;
  uploadedAt?: string;
  status: "idle" | "processing" | "synced" | "failed";
  knowledgeBaseReady: boolean;
  products: Product[];
  demo?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "inactive" | "invited";
  assignedConversations: number;
  lastActiveAt?: string;
  demo?: boolean;
}

export interface RecoveryCart {
  id: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  cartValue: number;
  lastActivityAt: string;
  recoveryScore: number;
  messagesSent: number;
  status: "eligible" | "messaged" | "recovered" | "opted_out" | "expired";
  demo?: boolean;
}

export interface RecoverySettings {
  enabled: boolean;
  maxDiscountPct: number;
  thresholdAmount: number;
  maxMessagesPerCustomer: number;
  template1: string;
  template2: string;
}

export interface BusinessSettings {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  logoUrl?: string;
  botEnabled: boolean;
  responseLanguage: "en" | "ur" | "roman-urdu";
  workingHoursStart: string;
  workingHoursEnd: string;
  humanHandoff: boolean;
  easypaisaWallet: string;
  jazzcashWallet: string;
  manualWalletConfirm: boolean;
  notifyNewMessage: boolean;
  notifyOrders: boolean;
  notifyPayments: boolean;
  notifyRecovery: boolean;
}

export interface UsageInfo {
  plan: PlanId;
  aiCallsUsed: number;
  aiCallsLimit: number;
  billingCycleEnd: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  plan: PlanId;
  demo?: boolean;
}

export interface AnalyticsSnapshot {
  totalMessages: number;
  aiResponsePct: number;
  avgResponseTimeSec: number;
  totalOrders: number;
  verifiedPayments: number;
  recoveredCarts: number;
  totalRevenue: number;
  dailyMessages: { date: string; messages: number; ai: number; human: number }[];
  revenueOverTime: { date: string; revenue: number }[];
  ordersOverTime: { date: string; orders: number }[];
  intentDistribution: { intent: string; count: number }[];
  cartRecoveryConversion: { stage: string; value: number }[];
  demo?: boolean;
}

export interface DashboardOverview {
  totalMessages: number;
  aiHandled: number;
  activeChats: number;
  totalOrders: number;
  verifiedPayments: number;
  recoveredRevenue: number;
  messagesActivity: { date: string; count: number }[];
  ordersOverview: { date: string; orders: number }[];
  revenuePerformance: { date: string; revenue: number }[];
  aiVsHuman: { name: string; value: number }[];
  recentConversations: { name: string; preview: string; at: string }[];
  recentOrders: Order[];
  aiPerformance: { label: string; value: string }[];
  usage: UsageInfo;
  demo?: boolean;
  liveInbox?: boolean;
}

export type BackendCapability =
  | "messages.list"
  | "messages.send"
  | "whatsapp.status"
  | "auth"
  | "orders"
  | "catalog"
  | "analytics"
  | "recovery"
  | "team"
  | "settings"
  | "billing"
  | "websocket";
