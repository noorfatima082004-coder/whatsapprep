"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#25D366", "#128C5E", "#142D2B", "#F59E0B", "#718078"];

export function MessagesAreaChart({
  data,
}: {
  data: { date: string; count?: number; messages?: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="msgFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#25D366" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#25D366" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5EBE8" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#718078" />
          <YAxis tick={{ fontSize: 11 }} stroke="#718078" />
          <Tooltip />
          <Area
            type="monotone"
            dataKey={data[0]?.messages != null ? "messages" : "count"}
            stroke="#128C5E"
            fill="url(#msgFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrdersBarChart({ data }: { data: { date: string; orders: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5EBE8" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#718078" />
          <YAxis tick={{ fontSize: 11 }} stroke="#718078" />
          <Tooltip />
          <Bar dataKey="orders" fill="#25D366" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueLineChart({
  data,
}: {
  data: { date: string; revenue: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5EBE8" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#718078" />
          <YAxis tick={{ fontSize: 11 }} stroke="#718078" />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" stroke="#142D2B" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AiHumanPie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IntentBars({ data }: { data: { intent: string; count: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5EBE8" />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#718078" />
          <YAxis type="category" dataKey="intent" width={110} tick={{ fontSize: 11 }} stroke="#718078" />
          <Tooltip />
          <Bar dataKey="count" fill="#128C5E" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FunnelBars({ data }: { data: { stage: string; value: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5EBE8" />
          <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="#718078" />
          <YAxis tick={{ fontSize: 11 }} stroke="#718078" />
          <Tooltip />
          <Bar dataKey="value" fill="#25D366" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DualLineChart({
  data,
}: {
  data: { date: string; ai: number; human: number; messages?: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5EBE8" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#718078" />
          <YAxis tick={{ fontSize: 11 }} stroke="#718078" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="ai" stroke="#25D366" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="human" stroke="#142D2B" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
