import { apiFetch, type ApiResponse } from "~/utils/api";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  status: "sent" | "delivered" | "read";
  type: "text" | "image" | "file";
  reactions?: Record<string, string[]>;
}

export const useChatApi = () => {
  const fetchMessages = async (
    groupId: string,
    options: {
      limit: number;
      before?: number;
    }
  ): Promise<ApiResponse<ChatMessage[]>> => {
    return apiFetch(`/chat/${groupId}/messages`, {
      method: "GET",
      params: {
        limit: options.limit,
        ...(options.before && { before: options.before }),
      },
    });
  };

  const sendMessage = async (
    groupId: string,
    content: string,
    type: "text" | "image" | "file" = "text"
  ): Promise<ApiResponse<ChatMessage>> => {
    return apiFetch(`/chat/${groupId}/send`, {
      method: "POST",
      body: { content, type },
    });
  };

  return { fetchMessages, sendMessage };
};
