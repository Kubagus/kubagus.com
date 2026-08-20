export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
export const SITE_KEY = import.meta.env.VITE_SITE_KEY ?? "portfolio";

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const details = body.details ? Object.values(body.details).flat().join(", ") : null;
    return details ?? body.error ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
}

function redirectToLogin() {
  fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  if (!window.location.pathname.startsWith("/admin/login")) {
    window.location.href = "/admin/login";
  }
}

/** Satu proses refresh berjalan untuk semua request yang sedang menunggu. */
let refreshing: Promise<boolean> | null = null;

function tryRefresh(): Promise<boolean> {
  refreshing ??= fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "X-Site-Key": SITE_KEY },
  })
    .then((res) => res.ok)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function doFetch<T>(path: string, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = { "X-Site-Key": SITE_KEY };

  const isForm = !!options.formData;
  if (!isForm && options.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}/api${path}`, {
    method: options.method ?? (options.body !== undefined || options.formData ? "POST" : "GET"),
    headers,
    credentials: "include",
    body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
  });

  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await doFetch<T>(path, options);
  } catch (err) {
    const isUnauthorized = err instanceof ApiError && err.status === 401 && !path.startsWith("/auth/login");
    if (!isUnauthorized) throw err;

    // Access token kedaluwarsa — coba refresh sekali, lalu ulangi request.
    const refreshed = await tryRefresh();
    if (!refreshed) {
      redirectToLogin();
      throw new Error("Sesi berakhir, silakan login kembali.");
    }
    try {
      return await doFetch<T>(path, options);
    } catch (retryErr) {
      redirectToLogin();
      throw new Error("Sesi berakhir, silakan login kembali.");
    }
  }
}

export const adminApi = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", formData }),
};

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  return `${API_URL}${path}`;
}