export type DeskStatus = "free" | "occupied" | "away";
export type Zone = "quiet_study" | "collaboration" | "pc_lab" | "window_view";
export type SessionStatus = "active" | "away";
export type ActionType = "checkin" | "away" | "checkout";

export interface Session {
  id: number;
  deskId: number;
  studentName: string;
  studentId: string;
  checkedInAt: string;
  status: SessionStatus;
  updatedAt: string;
}

export interface Desk {
  id: number;
  number: number;
  zone: Zone;
  status: DeskStatus;
  createdAt: string;
  session: Session | null;
}

export interface Stats {
  total: number;
  occupied: number;
  free: number;
  away: number;
  occupancyRate: number;
}

export interface ActivityLog {
  id: number;
  deskId: number;
  deskNumber: number;
  studentName: string;
  studentId: string;
  action: ActionType;
  occurredAt: string;
}

export interface CheckinInput {
  studentName: string;
  studentId: string;
}

const BASE = "/api";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("deskguard_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: unknown, useAuth = false): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(useAuth ? authHeaders() : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getDesks: () => get<Desk[]>("/desks"),
  getDesk: (id: number) => get<Desk>(`/desks/${id}`),
  searchDesks: (q: string) => get<Desk[]>(`/desks/search?q=${encodeURIComponent(q)}`),
  checkin: (id: number, data: CheckinInput) => post<{ success: boolean; message: string }>(`/desks/${id}/checkin`, data),
  markAway: (id: number) => post<{ success: boolean; message: string }>(`/desks/${id}/away`),
  checkout: (id: number) => post<{ success: boolean; message: string }>(`/desks/${id}/checkout`),
  getMyDesk: (studentId: string) => get<Desk>(`/desks/my-desk?studentId=${encodeURIComponent(studentId)}`),
  getStats: () => get<Stats>("/stats"),
  getActivity: (limit = 20) => get<ActivityLog[]>(`/activity?limit=${limit}`),
  login: (username: string, password: string) =>
    post<{ token: string; user: { id: number; username: string; role: string } }>("/auth/login", { username, password }),
  adminGetDesks: () => get<Desk[]>("/admin/desks"),
  adminResetDesk: (id: number) => post<{ success: boolean; message: string }>(`/admin/desks/${id}/reset`, undefined, true),
  adminGetActivity: (limit = 50) => {
    const token = localStorage.getItem("deskguard_token");
    return fetch(`${BASE}/admin/activity?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json() as Promise<ActivityLog[]>);
  },
};

export function formatDuration(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const totalMins = Math.floor(diff / 60000);
  if (totalMins < 1) return "< 1m";
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs === 0) return `${mins}m`;
  return mins === 0 ? `${hrs}h` : `${hrs}h ${mins}m`;
}

export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const ZONE_LABELS: Record<Zone, string> = {
  quiet_study: "Quiet Study",
  collaboration: "Collaboration Area",
  pc_lab: "PC Lab",
  window_view: "Window View",
};
