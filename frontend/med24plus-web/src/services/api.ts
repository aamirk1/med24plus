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
  _isRetry?: boolean;
}

async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem("med24_refresh_token");
  if (!refreshToken) return null;

  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const newAccessToken = body?.data?.access_token;
    const newRefreshToken = body?.data?.refresh_token;
    if (newAccessToken) {
      localStorage.setItem("med24_access_token", newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem("med24_refresh_token", newRefreshToken);
      }
      return newAccessToken;
    }
    return null;
  } catch (e) {
    console.error("Token refresh failed:", e);
    return null;
  }
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
    const errorCode = data?.error?.code || "REQUEST_FAILED";
    const errorMsg = data?.message || "An unexpected error occurred. Please try again.";

    // If 401 Unauthorized or access token expired, transparently refresh session and retry once
    if (response.status === 401) {
      if (!options._isRetry) {
        const newToken = await tryRefreshToken();
        if (newToken) {
          const retryHeaders = new Headers(options.headers || {});
          retryHeaders.set("Authorization", `Bearer ${newToken}`);
          return apiClient<T>(endpoint, {
            ...options,
            headers: retryHeaders,
            _isRetry: true,
          });
        }
      }

      // If refresh failed or request was already a retry, perform auto-logout only if user was actually logged in
      if (typeof window !== "undefined") {
        const hadToken = Boolean(localStorage.getItem("med24_access_token"));
        localStorage.removeItem("med24_access_token");
        localStorage.removeItem("med24_refresh_token");
        if (hadToken) {
          sessionStorage.setItem("med24_session_expired", "1");
          if (window.location.pathname !== "/") {
            window.location.href = "/?session_expired=1";
          } else {
            window.dispatchEvent(new CustomEvent("med24_session_expired"));
          }
        }
      }
    }

    const error: any = new Error(errorMsg);
    error.code = errorCode;
    error.status = response.status;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
}
