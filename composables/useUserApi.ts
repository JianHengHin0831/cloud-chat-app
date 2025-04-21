import { apiFetch, type ApiResponse } from "~/utils/api";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: number;
  advancedSettings: {
    bio: string | null;
    status: "online" | "offline" | "away" | "busy";
    isOnline: boolean;
    isLight: boolean;
    showExactTime: boolean;
    fontSize: "small" | "medium" | "large";
    activityVisibility: "public" | "friends" | "hidden";
    showEmail: boolean;
  };
}

interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  updates: {
    [key: string]: any;
  };
}

export const useUserApi = () => {
  const register = async (
    payload: RegisterPayload
  ): Promise<ApiResponse<{ userId: string }>> => {
    return apiFetch("/users/register", {
      method: "POST",
      body: payload,
    });
  };

  const updateProfile = async (
    userId: string,
    payload: {
      username: string;
      advancedSettings: {
        bio: string;
        status: string;
        isOnline: boolean;
        isLight: boolean;
        showExactTime: boolean;
        fontSize: string;
        activityVisibility: string;
        showEmail: boolean;
      };
    }
  ): Promise<ApiResponse<UserProfile>> => {
    console.log("updateProfile", userId, payload);
    return apiFetch(`/users/${userId}/profile`, {
      method: "PUT",
      body: payload,
    });
  };

  const getPrivateKey = async (
    userId: string
  ): Promise<ApiResponse<{ key: string }>> => {
    return apiFetch(`/users/${userId}/private-key`, {
      method: "GET",
    });
  };

  return { register, updateProfile, getPrivateKey };
};
