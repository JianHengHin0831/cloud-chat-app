import type { NitroFetchOptions, NitroFetchRequest } from "nitropack";
import { auth } from "~/firebase/firebase.js";
type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

// 标准API响应结构
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 修改函数签名明确返回ApiResponse<T>
export const apiFetch = async <T>(
  request: NitroFetchRequest,
  options?: {
    method?: Uppercase<HttpMethod> | Lowercase<HttpMethod>;
    body?: any;
    params?: Record<string, string | number>;
  }
): Promise<ApiResponse<T>> => {
  // 关键修改：返回Promise<ApiResponse<T>>而非Promise<T>
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

    // 确保返回结构符合ApiResponse
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

// const user = auth.currentUser;
//   if (!user) {
//     throw new Error("User not authenticated");
//   }
//   const token = await user.getIdToken();
