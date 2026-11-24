import { api } from "@/lib/api/client";
import type { InboxMessage } from "@/types";

export interface MessagesResponse {
  count: number;
  messages: InboxMessage[];
}

/** Live backend: GET /messages */
export async function fetchMessages(): Promise<MessagesResponse> {
  const { data } = await api.get<MessagesResponse>("/messages");
  return data;
}

/** Live backend: POST /send-message */
export async function sendMessage(phone: string, message: string) {
  const { data } = await api.post("/send-message", { phone, message });
  return data;
}
