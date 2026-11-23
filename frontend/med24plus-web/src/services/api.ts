function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    if (window.location.hostname.endsWith("serwex.in") || window.location.protocol === "https:") {
      return "https://med24plus-api.serwex.in/api/v1";
    }
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes("localhost:8024")) {
    return envUrl;
  }
  if (process.env.NODE_ENV === "production") {
    return "https://med24plus-api.serwex.in/api/v1";
  }
  return envUrl || "http://localhost:8024/api/v1";
}

interface RequestOptions extends RequestInit {
  data?: any;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

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

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: any) {
    console.error(`Network fetch error connecting to ${url}:`, err);
    throw new Error(
      `Unable to connect to API server (${url}). Please ensure the backend is running.`
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.message || "An unexpected error occurred. Please try again.";
    const errorCode = data?.error?.code || "REQUEST_FAILED";
    const error: any = new Error(errorMsg);
    error.code = errorCode;
    error.status = response.status;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
}
