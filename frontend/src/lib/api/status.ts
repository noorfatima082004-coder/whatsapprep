import { api, getErrorMessage } from "@/lib/api/client";
import type { WhatsAppStatus } from "@/types";

/** Live backend: GET /status — Meta phone metadata */
export async function fetchWhatsAppStatus(): Promise<WhatsAppStatus> {
  try {
    const { data } = await api.get("/status");
    return {
      display_phone_number: data.display_phone_number,
      verified_name: data.verified_name,
      quality_rating: data.quality_rating,
      connected: Boolean(data.display_phone_number || data.verified_name),
    };
  } catch (error) {
    return {
      connected: false,
      error: getErrorMessage(error, "Unable to reach WhatsApp status"),
    };
  }
}
