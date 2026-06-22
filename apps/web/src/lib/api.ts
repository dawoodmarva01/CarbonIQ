const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

function getToken(): string | null {
  return localStorage.getItem("carboniq_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  signup: (data: { name: string; email: string; password: string; region?: string }) =>
    request<{ token: string; user: any }>("/api/v1/auth/signup", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any }>("/api/v1/auth/login", { method: "POST", body: JSON.stringify(data) }),

  getDashboardSummary: () => request<any>("/api/v1/dashboard/summary"),

  getForecast: () => request<any>("/api/v1/dashboard/forecast"),

  listActivities: (params?: { category?: string; from?: string; to?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<any[]>(`/api/v1/activities${qs}`);
  },

  createActivity: (data: { category: string; subcategory: string; quantity: number; unit?: string; region?: string }) =>
    request<any>("/api/v1/activities", { method: "POST", body: JSON.stringify(data) }),

  receiptScan: (ocrText: string, region?: string) =>
    request<{ activities: any[]; totalCo2eKg: number }>("/api/v1/activities/receipt-scan", {
      method: "POST",
      body: JSON.stringify({ ocrText, region }),
    }),

  getScenarios: () => request<{ key: string; label: string; category: string }[]>("/api/v1/simulator/scenarios"),

  simulateWhatIf: (changes: { scenario: string; intensity: number }[]) =>
    request<any>("/api/v1/simulator/what-if", { method: "POST", body: JSON.stringify({ changes }) }),

  chatWithCoach: (message: string) =>
    request<{ reply: string }>("/api/v1/coach/chat", { method: "POST", body: JSON.stringify({ message }) }),

  getChatHistory: () => request<any[]>("/api/v1/coach/history"),

  getLeaderboard: (scope: string = "global") => request<any>(`/api/v1/leaderboard?scope=${scope}`),
};

export { getToken };
