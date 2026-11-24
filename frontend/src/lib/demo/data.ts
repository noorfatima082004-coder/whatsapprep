import type {
  AnalyticsSnapshot,
  DashboardOverview,
  Invoice,
  Order,
  Product,
  RecoveryCart,
  TeamMember,
} from "@/types";

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const DEMO_ORDERS: Order[] = [
  {
    id: "ORD-1042",
    customerName: "Ayesha Khan",
    customerPhone: "923001112233",
    items: [
      { productName: "Cotton Kurti Set", quantity: 1, price: 3200 },
      { productName: "Dupatta", quantity: 1, price: 900 },
    ],
    totalAmount: 4100,
    paymentStatus: "verified",
    orderStatus: "verified",
    createdAt: daysAgo(0),
    ocrTransactionId: "TXN998812",
    ocrAmount: 4100,
    receiverAccount: "03XX-XXXXXXX",
    ocrConfidence: 0.94,
    verificationReasons: ["Amount match", "Account match"],
    demo: true,
  },
  {
    id: "ORD-1041",
    customerName: "Bilal Ahmed",
    customerPhone: "923334445566",
    items: [{ productName: "Leather Wallet", quantity: 2, price: 1800 }],
    totalAmount: 3600,
    paymentStatus: "manual_review",
    orderStatus: "manual_review",
    createdAt: daysAgo(1),
    ocrTransactionId: "TXN771102",
    ocrAmount: 3500,
    receiverAccount: "03XX-XXXXXXX",
    ocrConfidence: 0.61,
    verificationReasons: ["Amount mismatch"],
    demo: true,
  },
  {
    id: "ORD-1040",
    customerName: "Sara Malik",
    customerPhone: "923217778899",
    items: [{ productName: "Kids Shoes", quantity: 1, price: 2500 }],
    totalAmount: 2500,
    paymentStatus: "submitted",
    orderStatus: "awaiting_payment",
    createdAt: daysAgo(1),
    demo: true,
  },
  {
    id: "ORD-1039",
    customerName: "Usman Ali",
    customerPhone: "923451234567",
    items: [{ productName: "Wireless Earbuds", quantity: 1, price: 4500 }],
    totalAmount: 4500,
    paymentStatus: "verified",
    orderStatus: "shipped",
    createdAt: daysAgo(2),
    demo: true,
  },
  {
    id: "ORD-1038",
    customerName: "Fatima Noor",
    customerPhone: "923009998877",
    items: [{ productName: "Skincare Kit", quantity: 1, price: 5200 }],
    totalAmount: 5200,
    paymentStatus: "verified",
    orderStatus: "delivered",
    createdAt: daysAgo(4),
    demo: true,
  },
  {
    id: "ORD-1037",
    customerName: "Hamza Raza",
    customerPhone: "923112223344",
    items: [{ productName: "Sports Cap", quantity: 3, price: 800 }],
    totalAmount: 2400,
    paymentStatus: "rejected",
    orderStatus: "rejected",
    createdAt: daysAgo(3),
    verificationReasons: ["Duplicate transaction"],
    demo: true,
  },
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Cotton Kurti Set",
    price: 3200,
    stock: 42,
    description: "3-piece embroidered cotton kurti set",
    lastSyncedAt: daysAgo(0),
    demo: true,
  },
  {
    id: "p2",
    name: "Leather Wallet",
    price: 1800,
    stock: 28,
    description: "Genuine leather bifold wallet",
    lastSyncedAt: daysAgo(0),
    demo: true,
  },
  {
    id: "p3",
    name: "Wireless Earbuds",
    price: 4500,
    stock: 15,
    description: "Bluetooth 5.3 earbuds with case",
    lastSyncedAt: daysAgo(0),
    demo: true,
  },
  {
    id: "p4",
    name: "Skincare Kit",
    price: 5200,
    stock: 9,
    description: "Cleanser, toner, moisturizer set",
    lastSyncedAt: daysAgo(0),
    demo: true,
  },
  {
    id: "p5",
    name: "Kids Shoes",
    price: 2500,
    stock: 21,
    description: "Lightweight school shoes",
    lastSyncedAt: daysAgo(0),
    demo: true,
  },
];

export const DEMO_TEAM: TeamMember[] = [
  {
    id: "t1",
    name: "You (Owner)",
    email: "owner@business.pk",
    role: "owner",
    status: "active",
    assignedConversations: 0,
    lastActiveAt: new Date().toISOString(),
    demo: true,
  },
  {
    id: "t2",
    name: "Nida Agent",
    email: "nida@business.pk",
    role: "agent",
    status: "active",
    assignedConversations: 8,
    lastActiveAt: daysAgo(0),
    demo: true,
  },
  {
    id: "t3",
    name: "Ali Support",
    email: "ali@business.pk",
    role: "agent",
    status: "invited",
    assignedConversations: 0,
    demo: true,
  },
];

export const DEMO_RECOVERY: RecoveryCart[] = [
  {
    id: "r1",
    customerName: "Mariam Sheikh",
    customerPhone: "923001234000",
    productName: "Cotton Kurti Set",
    cartValue: 3200,
    lastActivityAt: daysAgo(0),
    recoveryScore: 86,
    messagesSent: 1,
    status: "messaged",
    demo: true,
  },
  {
    id: "r2",
    customerName: "Omar Farooq",
    customerPhone: "923218887766",
    productName: "Wireless Earbuds",
    cartValue: 4500,
    lastActivityAt: daysAgo(1),
    recoveryScore: 72,
    messagesSent: 0,
    status: "eligible",
    demo: true,
  },
  {
    id: "r3",
    customerName: "Hina Batool",
    customerPhone: "923334441122",
    productName: "Skincare Kit",
    cartValue: 5200,
    lastActivityAt: daysAgo(2),
    recoveryScore: 91,
    messagesSent: 2,
    status: "recovered",
    demo: true,
  },
];

export const DEMO_INVOICES: Invoice[] = [
  { id: "INV-2026-03", date: daysAgo(5), amount: 30, status: "paid", plan: "professional", demo: true },
  { id: "INV-2026-02", date: daysAgo(35), amount: 30, status: "paid", plan: "professional", demo: true },
  { id: "INV-2026-01", date: daysAgo(65), amount: 15, status: "paid", plan: "starter", demo: true },
];

function series(days: number, base: number, variance: number) {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().slice(0, 10),
      value: Math.max(0, Math.round(base + Math.sin(i / 2) * variance + (i % 3) * 8)),
    };
  });
}

export function buildDemoAnalytics(days = 30): AnalyticsSnapshot {
  const daily = series(days, 48, 18);
  return {
    totalMessages: daily.reduce((s, d) => s + d.value, 0),
    aiResponsePct: 78,
    avgResponseTimeSec: 4.2,
    totalOrders: 126,
    verifiedPayments: 98,
    recoveredCarts: 17,
    totalRevenue: 412500,
    dailyMessages: daily.map((d) => ({
      date: d.date,
      messages: d.value,
      ai: Math.round(d.value * 0.78),
      human: Math.round(d.value * 0.22),
    })),
    revenueOverTime: series(days, 12000, 4000).map((d) => ({
      date: d.date,
      revenue: d.value,
    })),
    ordersOverTime: series(days, 4, 2).map((d) => ({
      date: d.date,
      orders: d.value,
    })),
    intentDistribution: [
      { intent: "Product inquiry", count: 142 },
      { intent: "Price check", count: 98 },
      { intent: "Order status", count: 76 },
      { intent: "Payment help", count: 54 },
      { intent: "Complaint", count: 21 },
    ],
    cartRecoveryConversion: [
      { stage: "Abandoned", value: 64 },
      { stage: "Messaged", value: 41 },
      { stage: "Replied", value: 22 },
      { stage: "Recovered", value: 17 },
    ],
    demo: true,
  };
}

export function buildDemoOverview(): DashboardOverview {
  const analytics = buildDemoAnalytics(14);
  return {
    totalMessages: analytics.totalMessages,
    aiHandled: Math.round(analytics.totalMessages * 0.78),
    activeChats: 12,
    totalOrders: analytics.totalOrders,
    verifiedPayments: analytics.verifiedPayments,
    recoveredRevenue: 68400,
    messagesActivity: analytics.dailyMessages.map((d) => ({
      date: d.date,
      count: d.messages,
    })),
    ordersOverview: analytics.ordersOverTime,
    revenuePerformance: analytics.revenueOverTime,
    aiVsHuman: [
      { name: "AI", value: 78 },
      { name: "Human", value: 22 },
    ],
    recentConversations: [
      { name: "Ayesha Khan", preview: "Payment screenshot bhej di hai", at: daysAgo(0) },
      { name: "Bilal Ahmed", preview: "Size medium available?", at: daysAgo(0) },
      { name: "Sara Malik", preview: "Order kab deliver hoga?", at: daysAgo(1) },
    ],
    recentOrders: DEMO_ORDERS.slice(0, 4),
    aiPerformance: [
      { label: "AI resolution rate", value: "78%" },
      { label: "Avg first reply", value: "4.2s" },
      { label: "Handoffs today", value: "6" },
      { label: "CSAT (demo)", value: "4.6/5" },
    ],
    usage: {
      plan: "professional",
      aiCallsUsed: 1840,
      aiCallsLimit: 5000,
      billingCycleEnd: daysAgo(-12),
    },
    demo: true,
  };
}
