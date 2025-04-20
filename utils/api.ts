import type { NitroFetchOptions, NitroFetchRequest } from "nitropack";
import { auth } from "~/firebase/firebase.js";
type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

// standard api response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// fetch api with authentication
export const apiFetch = async <T>(
  request: NitroFetchRequest,
  options?: {
    method?: Uppercase<HttpMethod> | Lowercase<HttpMethod>;
    body?: any;
    params?: Record<string, string | number>;
  }
): Promise<ApiResponse<T>> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  const token = await user.getIdToken();

  try {
    const response = await $fetch<ApiResponse<T>>(request, {
      baseURL: "/api",
      method: options?.method || "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: options?.body,
      query: options?.params,
    });

    return {
      success: response.success ?? true,
      data: response.data,
      error: response.error,
    };
  } catch (error: any) {
    console.error(`API Error [${request}]:`, error);
    return {
      success: false,
      error: error.data?.message || error.message,
    };
  }
};
