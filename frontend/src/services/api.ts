import type { ReleaseReadinessReport } from "../types/report";

const API_BASE = "/api";

export async function fetchReport(id: string): Promise<ReleaseReadinessReport> {
  const res = await fetch(`${API_BASE}/report/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<ReleaseReadinessReport>;
}

export async function triggerAnalysis(changeId: string): Promise<{ success: boolean; changeId: string }> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changeId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<{ success: boolean; changeId: string }>;
}

export async function fetchChanges(): Promise<{ changes: string[] }> {
  const res = await fetch(`${API_BASE}/changes`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<{ changes: string[] }>;
}
