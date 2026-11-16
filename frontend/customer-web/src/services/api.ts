const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  data?: any;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("med24_access_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Include credentials for HttpOnly cookies
  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  if (options.data) {
    config.body = JSON.stringify(options.data);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.message || "An unexpected error occurred. Please try again.";
    const errorCode = data?.error?.code || "REQUEST_FAILED";
    const error: any = new Error(errorMsg);
    error.code = errorCode;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
}

