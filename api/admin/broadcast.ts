import { useApiHost } from "@/composables/useApiHost";
import { useCookie } from "#app";

export interface PersonalizedMessage {
  phone: string;
  message: string;
}

export interface BroadcastRequest {
  target: "customers" | "team";
  phones?: string[];
  message?: string;
  personalized_messages?: PersonalizedMessage[];
  template_key?: string;
}

export interface BroadcastResponse {
  status: string;
  recipients: number;
  success_count?: number;
  failed_count?: number;
  failed_phones?: string[];
}

export interface BroadcastHistoryItem {
  id: string;
  message: string;
  target_group: string;
  status: string;
  sent_at: string;
  created_by?: string;
  user_name?: string;
  recipient_count: number;
  recipient_phones?: string[];
}

export const broadcastAdminApi = () => {
  const api = useApiHost();
  return {
    sendBroadcast: async (data: BroadcastRequest): Promise<BroadcastResponse> => {
      const response = await fetch(`${api}/api/broadcast/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send broadcast");
      }

      return response.json();
    },

    getBroadcastHistory: async (): Promise<BroadcastHistoryItem[]> => {
      const response = await fetch(`${api}/api/broadcast/history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch broadcast history");
      }

      return response.json();
    },
  };
};

