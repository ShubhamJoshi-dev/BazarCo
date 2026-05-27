import axios from "axios";
import { getBackendBaseUrl } from "@/config/env";
import type {
  AdminAuthSuccess,
  AdminAuditRow,
  AdminConversationRow,
  AdminKycRow,
  AdminMessageRow,
  AdminOverviewStats,
  AdminPlatformUser,
  AdminKycDetail,
  AdminProductRow,
  AdminUser,
  AdminVideoRow,
  PaginationMeta,
} from "@/types/admin";

const ADMIN_TOKEN_KEY = "bazarco_admin_token";

const adminApi = axios.create({
  baseURL: getBackendBaseUrl(),
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

adminApi.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type ApiOk<T> = { status: "success"; message: string } & T;
type ApiErr = { status: "error"; message: string };

function params(q?: Record<string, string | number | boolean | undefined>) {
  const p: Record<string, string> = {};
  if (!q) return p;
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== "") p[k] = String(v);
  }
  return p;
}

export async function adminLogin(username: string, password: string): Promise<AdminAuthSuccess | ApiErr> {
  try {
    const { data } = await adminApi.post<AdminAuthSuccess>("/admin/auth/login", { username, password });
    if (data.status === "success" && data.token) setAdminToken(data.token);
    return data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data) return e.response.data as ApiErr;
    return { status: "error", message: "Login failed" };
  }
}

export async function adminGetMe(): Promise<{ admin: AdminUser } | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ admin: AdminUser }>>("/admin/auth/me");
    return data.status === "success" ? { admin: data.admin } : null;
  } catch {
    return null;
  }
}

export async function adminGetOverview(): Promise<AdminOverviewStats | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ stats: AdminOverviewStats }>>("/admin/overview");
    return data.stats ?? null;
  } catch {
    return null;
  }
}

export async function adminGetUser(id: string): Promise<AdminPlatformUser | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ user: AdminPlatformUser }>>(`/admin/users/${id}`);
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function adminListUsers(query?: Record<string, string | number>): Promise<{
  users: AdminPlatformUser[];
  pagination: PaginationMeta;
} | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ users: AdminPlatformUser[]; pagination: PaginationMeta }>>(
      "/admin/users",
      { params: params(query) }
    );
    return { users: data.users, pagination: data.pagination };
  } catch {
    return null;
  }
}

export async function adminSuspendUser(id: string, reason?: string): Promise<boolean> {
  try {
    const { data } = await adminApi.post(`/admin/users/${id}/suspend`, { reason });
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function adminRestoreUser(id: string): Promise<boolean> {
  try {
    const { data } = await adminApi.post(`/admin/users/${id}/restore`);
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function adminSoftDeleteUser(id: string): Promise<boolean> {
  try {
    const { data } = await adminApi.post(`/admin/users/${id}/soft-delete`, { confirm: true });
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function adminListProducts(query?: Record<string, string | number>): Promise<{
  products: AdminProductRow[];
  pagination: PaginationMeta;
} | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ products: AdminProductRow[]; pagination: PaginationMeta }>>(
      "/admin/products",
      { params: params(query) }
    );
    return { products: data.products, pagination: data.pagination };
  } catch {
    return null;
  }
}

export async function adminGetProduct(id: string): Promise<AdminProductRow | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ product: AdminProductRow }>>(`/admin/products/${id}`);
    return data.product ?? null;
  } catch {
    return null;
  }
}

export async function adminSoftDeleteProduct(id: string): Promise<boolean> {
  try {
    const { data } = await adminApi.post(`/admin/products/${id}/soft-delete`, { confirm: true });
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function adminRestoreProduct(id: string): Promise<boolean> {
  try {
    const { data } = await adminApi.post(`/admin/products/${id}/restore`);
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function adminFlagProduct(id: string, flagged: boolean, flagReason?: string): Promise<boolean> {
  try {
    const { data } = await adminApi.post(`/admin/products/${id}/flag`, { flagged, flagReason });
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function adminListKyc(query?: Record<string, string | number>): Promise<{
  submissions: AdminKycRow[];
  pagination: PaginationMeta;
} | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ submissions: AdminKycRow[]; pagination: PaginationMeta }>>(
      "/admin/kyc",
      { params: params(query) }
    );
    return { submissions: data.submissions, pagination: data.pagination };
  } catch {
    return null;
  }
}

export async function adminGetKycDetail(id: string): Promise<AdminKycDetail | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ submission: AdminKycDetail }>>(`/admin/kyc/${id}`);
    return data.submission ?? null;
  } catch {
    return null;
  }
}

export async function adminApproveKyc(id: string): Promise<boolean> {
  try {
    const { data } = await adminApi.post(`/admin/kyc/${id}/approve`);
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function adminRejectKyc(id: string, rejectionReason: string): Promise<boolean> {
  try {
    const { data } = await adminApi.post(`/admin/kyc/${id}/reject`, { rejectionReason });
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function adminListVideos(query?: Record<string, string | number>): Promise<{
  videos: AdminVideoRow[];
  pagination: PaginationMeta;
} | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ videos: AdminVideoRow[]; pagination: PaginationMeta }>>(
      "/admin/videos",
      { params: params(query) }
    );
    return { videos: data.videos, pagination: data.pagination };
  } catch {
    return null;
  }
}

export async function adminGetVideo(id: string): Promise<AdminVideoRow | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ video: AdminVideoRow }>>(`/admin/videos/${id}`);
    return data.video ?? null;
  } catch {
    return null;
  }
}

export async function adminUpdateVideoStatus(id: string, status: string): Promise<boolean> {
  try {
    const { data } = await adminApi.patch(`/admin/videos/${id}`, { status });
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function adminDeleteVideo(id: string): Promise<boolean> {
  try {
    const { data } = await adminApi.delete(`/admin/videos/${id}`, { data: { confirm: true } });
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function adminListConversations(query?: Record<string, string | number>): Promise<{
  conversations: AdminConversationRow[];
  pagination: PaginationMeta;
} | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ conversations: AdminConversationRow[]; pagination: PaginationMeta }>>(
      "/admin/chat/conversations",
      { params: params(query) }
    );
    return { conversations: data.conversations, pagination: data.pagination };
  } catch {
    return null;
  }
}

export async function adminGetConversationMessages(
  conversationId: string,
  query?: Record<string, string | number>
): Promise<{ messages: AdminMessageRow[]; pagination: PaginationMeta } | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ messages: AdminMessageRow[]; pagination: PaginationMeta }>>(
      `/admin/chat/conversations/${conversationId}/messages`,
      { params: params(query) }
    );
    return { messages: data.messages, pagination: data.pagination };
  } catch {
    return null;
  }
}

export async function adminFlagMessage(messageId: string, flagged: boolean): Promise<boolean> {
  try {
    const { data } = await adminApi.post(`/admin/chat/messages/${messageId}/flag`, { flagged });
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function adminSearchMessages(query?: Record<string, string | number>): Promise<{
  messages: AdminMessageRow[];
  pagination: PaginationMeta;
} | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ messages: AdminMessageRow[]; pagination: PaginationMeta }>>(
      "/admin/chat/messages",
      { params: params(query) }
    );
    return { messages: data.messages, pagination: data.pagination };
  } catch {
    return null;
  }
}

export async function adminDeleteMessage(messageId: string): Promise<boolean> {
  try {
    const { data } = await adminApi.post(`/admin/chat/messages/${messageId}/delete`);
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function adminListAuditLogs(query?: Record<string, string | number>): Promise<{
  items: AdminAuditRow[];
  pagination: PaginationMeta;
} | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ items: AdminAuditRow[]; pagination: PaginationMeta }>>(
      "/admin/audit-logs",
      { params: params(query) }
    );
    return { items: data.items, pagination: data.pagination };
  } catch {
    return null;
  }
}

export async function adminGetDiagnostics(): Promise<Record<string, unknown> | null> {
  try {
    const { data } = await adminApi.get<ApiOk<{ diagnostics: Record<string, unknown> }>>("/admin/system/diagnostics");
    return data.diagnostics ?? null;
  } catch {
    return null;
  }
}

export async function adminRunMaintenance(
  endpoint: "refresh-collections" | "rebuild-indexes" | "clear-cache" | "jobs",
  body: Record<string, unknown>
): Promise<{ ok: boolean; message?: string }> {
  try {
    const { data } = await adminApi.post(`/admin/system/${endpoint}`, body);
    return { ok: data.status === "success", message: data.message };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data?.message) {
      return { ok: false, message: String(e.response.data.message) };
    }
    return { ok: false, message: "Request failed" };
  }
}
