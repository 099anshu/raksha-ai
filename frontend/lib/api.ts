// lib/api.ts — single place every page calls the FastAPI backend through.
// All module pages import `api` from here instead of hardcoding fetch URLs.

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export const api = {
  dashboardStats: () => request<{ success: boolean; data: any }>("/api/v1/dashboard/stats"),

  // SENTINEL
  sentinelAnalyseText: (text: string, channel = "call") =>
    request<{ success: boolean; data: any }>("/api/sentinel/analyse/text", {
      method: "POST",
      body: JSON.stringify({ text, channel }),
    }),
  sentinelCheckNumber: (phone: string) =>
    request<{ success: boolean; data: any }>(`/api/sentinel/number/${phone}`),

  // NETRA
  netraScan: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE_URL}/api/netra/scan`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // JAAL
  jaalGraph: () => request<{ success: boolean; data: any }>("/api/jaal/graph/demo"),
  jaalCommunities: () => request<{ success: boolean; data: any }>("/api/jaal/communities"),

  // DRISHTI
  drishtiIncidents: () => request<{ success: boolean; data: any }>("/api/drishti/incidents"),
  drishtiHotspots: () => request<{ success: boolean; data: any }>("/api/drishti/hotspots"),

  // KAVACH
  kavachChat: (message: string, history: { role: string; content: string }[]) =>
    request<{ success: boolean; data: any }>("/api/kavach/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
  kavachSafetyTips: () => request<{ success: boolean; data: any }>("/api/kavach/safety-tips"),
};
