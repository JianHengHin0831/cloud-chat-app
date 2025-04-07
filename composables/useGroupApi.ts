import { apiFetch, type ApiResponse } from "~/utils/api";
import { db } from "~/firebase/firebase.js";
import { ref as dbRef, update, push, get, remove } from "firebase/database";

interface GroupMember {
  id: string;
  username: string;
  avatarUrl: string | null;
  role: "admin" | "moderator" | "user";
  joinedAt: number;
  lastActive?: number;
}

interface GroupInfo {
  id: string;
  name: string;
  description: string;
  chatType: "public" | "private";
  createdAt: number;
  createdBy: string;
  memberCount: number;
  isDisband?: boolean;
}

export const useGroupApi = () => {
  const createGroup = async (payload: {
    name: string;
    description: string;
    isPublic: boolean;
  }): Promise<ApiResponse<GroupInfo>> => {
    return apiFetch("/groups", {
      method: "POST",
      body: payload,
    });
  };

  const updateGroup = async (
    groupId: string,
    payload: {
      name: string;
      description: string;
      chatType: "public" | "private";
    }
  ): Promise<ApiResponse<GroupInfo>> => {
    return apiFetch(`/groups/${groupId}/update`, {
      method: "PUT",
      body: payload,
    });
  };

  const muteMember = async (
    groupId: string,
    memberId: string,
    isMuted: boolean
  ) => {
    try {
      const chatroomUserPath = `${groupId}/${memberId}`;
      await update(dbRef(db, `chatroom_users/${chatroomUserPath}`), {
        isBanned: isMuted,
      });
    } catch (error) {
      console.error("Error updating mute status:", error);
      throw error;
    }
  };

  const disbandGroup = async (groupId: string): Promise<ApiResponse> => {
    return apiFetch(`/groups/${groupId}/disband`, {
      method: "PUT",
    });
  };

  const approveMember = async (
    groupId: string,
    userId: string
  ): Promise<ApiResponse<GroupMember>> => {
    return apiFetch(`/groups/${groupId}/members/approve`, {
      method: "POST",
      body: { userId },
    });
  };

  const rejectMember = async (
    groupId: string,
    userId: string
  ): Promise<ApiResponse> => {
    return apiFetch(`/groups/${groupId}/members/reject`, {
      method: "DELETE",
      body: { userId },
    });
  };

  const removeMember = async (
    groupId: string,
    memberId: string
  ): Promise<ApiResponse> => {
    return apiFetch(`/groups/${groupId}/members/remove`, {
      method: "DELETE",
      body: { memberId },
    });
  };

  const promoteModerator = async (
    groupId: string,
    memberId: string
  ): Promise<ApiResponse<GroupMember>> => {
    return apiFetch(`/groups/${groupId}/members/moderators/promote`, {
      method: "POST",
      body: { memberId },
    });
  };

  const demoteModerator = async (
    groupId: string,
    memberId: string
  ): Promise<ApiResponse<GroupMember>> => {
    return apiFetch(`/groups/${groupId}/members/moderators/demote`, {
      method: "POST",
      body: { memberId },
    });
  };

  const leaveGroup = async (groupId: string): Promise<ApiResponse> => {
    return apiFetch(`/groups/leave/${groupId}`, {
      method: "DELETE",
    });
  };

  const muteAllMembers = async (groupId: string, muted: boolean) => {
    try {
      await update(dbRef(db, `chatrooms/${groupId}`), {
        isGlobalMuted: muted,
      });
    } catch (error) {
      console.error("Error updating global mute status:", error);
      throw error;
    }
  };

  const pinMessage = async (
    groupId: string,
    pinData: {
      messageId: string;
      pinnedBy: string;
      pinnedAt: number;
    }
  ) => {
    try {
      const messageRef = dbRef(
        db,
        `chatrooms/${groupId}/messages/${pinData.messageId}`
      );
      await update(messageRef, {
        isPinned: pinData.pinnedBy,
      });
    } catch (error) {
      console.error("Error pinning message:", error);
      throw error;
    }
  };

  const unpinMessage = async (groupId: string, messageId: string) => {
    try {
      const messageRef = dbRef(
        db,
        `chatrooms/${groupId}/messages/${messageId}`
      );
      await update(messageRef, {
        isPinned: null,
      });
    } catch (error) {
      console.error("Error unpinning message:", error);
      throw error;
    }
  };

  const deleteMessage = async (
    groupId: string,
    messageId: string,
    deletedBy: string
  ) => {
    try {
      const messageRef = dbRef(
        db,
        `chatrooms/${groupId}/messages/${messageId}`
      );
      await update(messageRef, {
        isDeleted: deletedBy,
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  };

  const transferGroupOwnership = async (
    groupId: string,
    newOwnerId: string
  ): Promise<ApiResponse> => {
    return apiFetch(`/groups/${groupId}/transfer-ownership`, {
      method: "POST",
      body: { newOwnerId },
    });
  };

  return {
    createGroup,
    updateGroup,
    disbandGroup,
    approveMember,
    rejectMember,
    removeMember,
    promoteModerator,
    demoteModerator,
    leaveGroup,
    muteMember,
    muteAllMembers,
    pinMessage,
    unpinMessage,
    deleteMessage,
    transferGroupOwnership,
  };
};
