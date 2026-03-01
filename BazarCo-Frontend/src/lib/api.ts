import axios from "axios";
import type {
  AuthErrorResponse,
  AuthResponse,
  AuthSuccessResponse,
  AuthUser,
  BrowseResponse,
  Category,
  HealthResponse,
  NotifyResponse,
  Product,
  ProductListResponse,
  ProductSingleResponse,
  Tag,
} from "@/types/api";
import { getBackendBaseUrl } from "@/config/env";

const api = axios.create({
  baseURL: getBackendBaseUrl(),
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

const AUTH_TOKEN_KEY = "bazarco_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Let the browser set Content-Type (with boundary) for FormData so file uploads work
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>("/health");
  return data;
}

export async function notifySignUp(email: string): Promise<NotifyResponse> {
  try {
    const { data } = await api.post<NotifyResponse>("/notify", {
      email: email.trim(),
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const body = err.response.data as NotifyResponse;
      return {
        status: "error",
        message: body.status === "error" ? body.message : "Something went wrong",
      };
    }
    return {
      status: "error",
      message: "Could not reach the server. Try again later.",
    };
  }
}

function isAuthSuccess(data: AuthResponse): data is AuthSuccessResponse {
  return data.status === "success" && "token" in data;
}

export async function authSignup(email: string, password: string, name?: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>("/auth/signup", {
      email: email.trim(),
      password,
      ...(name?.trim() ? { name: name.trim() } : {}),
    });
    if (isAuthSuccess(data)) setStoredToken(data.token);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const body = err.response.data as AuthErrorResponse;
      return { status: "error", message: body.message || "Signup failed" };
    }
    return { status: "error", message: "Could not reach the server. Try again later." };
  }
}

export async function authLogin(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email: email.trim(),
      password,
    });
    if (isAuthSuccess(data)) setStoredToken(data.token);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const body = err.response.data as AuthErrorResponse;
      return { status: "error", message: body.message || "Login failed" };
    }
    return { status: "error", message: "Could not reach the server. Try again later." };
  }
}

export async function authForgotPassword(email: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>("/auth/forgot-password", {
      email: email.trim(),
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const body = err.response.data as AuthErrorResponse;
      return { status: "error", message: body.message || "Request failed" };
    }
    return { status: "error", message: "Could not reach the server. Try again later." };
  }
}

export async function authResetPassword(token: string, password: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>("/auth/reset-password", {
      token,
      password,
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const body = err.response.data as AuthErrorResponse;
      return { status: "error", message: body.message || "Reset failed" };
    }
    return { status: "error", message: "Could not reach the server. Try again later." };
  }
}

export async function authDevLogin(secret: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>("/auth/dev-login", { secret });
    if (isAuthSuccess(data)) setStoredToken(data.token);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const body = err.response.data as AuthErrorResponse;
      return { status: "error", message: body.message || "Dev login failed" };
    }
    return { status: "error", message: "Could not reach the server. Try again later." };
  }
}

export async function authGetMe(): Promise<AuthUser | null> {
  try {
    const { data } = await api.get<{ status: string; user: AuthUser }>("/auth/me");
    if (data.status === "success" && data.user) return data.user;
    return null;
  } catch {
    return null;
  }
}

export async function authUpdateProfile(name: string): Promise<AuthUser | null> {
  try {
    const { data } = await api.patch<{ status: string; user: AuthUser }>("/auth/profile", { name: name.trim() });
    if (data.status === "success" && data.user) return data.user;
    return null;
  } catch {
    return null;
  }
}

// Categories (list public; create/delete require auth)
export async function categoriesList(): Promise<Category[]> {
  try {
    const { data } = await api.get<{ status: string; categories?: Category[] }>("/categories");
    return data.categories ?? [];
  } catch {
    return [];
  }
}

export async function categoryCreate(name: string): Promise<Category | null> {
  try {
    const { data } = await api.post<{ status: string; category?: Category }>("/categories", { name: name.trim() });
    return data.category ?? null;
  } catch {
    return null;
  }
}

export async function categoryDelete(id: string): Promise<boolean> {
  try {
    const { data } = await api.delete<{ status: string }>(`/categories/${id}`);
    return data.status === "success";
  } catch {
    return false;
  }
}

// Tags (list public; create/delete require auth)
export async function tagsList(): Promise<Tag[]> {
  try {
    const { data } = await api.get<{ status: string; tags?: Tag[] }>("/tags");
    return data.tags ?? [];
  } catch {
    return [];
  }
}

export async function tagCreate(name: string): Promise<Tag | null> {
  try {
    const { data } = await api.post<{ status: string; tag?: Tag }>("/tags", { name: name.trim() });
    return data.tag ?? null;
  } catch {
    return null;
  }
}

export async function tagDelete(id: string): Promise<boolean> {
  try {
    const { data } = await api.delete<{ status: string }>(`/tags/${id}`);
    return data.status === "success";
  } catch {
    return false;
  }
}

// Favourites (auth required)
export async function favouritesList(): Promise<Product[]> {
  try {
    const { data } = await api.get<{ status: string; products?: Product[] }>("/favourites");
    return data.products ?? [];
  } catch {
    return [];
  }
}

export async function favouriteAdd(productId: string): Promise<boolean> {
  try {
    const { data } = await api.post<{ status: string }>(`/favourites/${productId}`);
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function favouriteRemove(productId: string): Promise<boolean> {
  try {
    const { data } = await api.delete<{ status: string }>(`/favourites/${productId}`);
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function favouriteCheck(productId: string): Promise<boolean> {
  try {
    const { data } = await api.get<{ status: string; favourited?: boolean }>(`/favourites/check/${productId}`);
    return data.favourited === true;
  } catch {
    return false;
  }
}

// Browse (any authenticated user) — MongoDB by default; Algolia when searching
export async function browseProducts(params: {
  q?: string;
  category?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}): Promise<{
  products: Product[];
  categories: Category[];
  tags: Tag[];
  total: number;
  page: number;
  nbPages: number;
  error?: string;
}> {
  try {
    const { category, tags, ...rest } = params;
    const requestParams: Record<string, unknown> = {
      ...rest,
      tags: tags?.length ? tags.join(",") : undefined,
      ...(category ? { category } : {}),
    };
    const { data } = await api.get<BrowseResponse>("/products/browse", { params: requestParams });
    if (data.status === "success") {
      return {
        products: data.products ?? [],
        categories: data.categories ?? [],
        tags: data.tags ?? [],
        total: data.total ?? 0,
        page: data.page ?? 0,
        nbPages: data.nbPages ?? 0,
      };
    }
    return { products: [], categories: [], tags: [], total: 0, page: 0, nbPages: 0 };
  } catch (err) {
    const message = axios.isAxiosError(err) && err.response?.status === 401
      ? "Please sign in to browse products."
      : "Could not load products. Try again or sign in.";
    return {
      products: [],
      categories: [],
      tags: [],
      total: 0,
      page: 0,
      nbPages: 0,
      error: message,
    };
  }
}

// Products (seller only)
export async function productsList(status?: "active" | "archived"): Promise<Product[]> {
  try {
    const params = status ? { status } : {};
    const { data } = await api.get<ProductListResponse>("/products", { params });
    if (data.status === "success" && data.products) return data.products;
    return [];
  } catch {
    return [];
  }
}

export async function productCreate(payload: {
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
  tagIds?: string[];
  image?: File;
}): Promise<Product | null> {
  try {
    const form = new FormData();
    form.append("name", payload.name.trim());
    form.append("description", (payload.description ?? "").trim());
    form.append("price", String(payload.price));
    if (payload.categoryId) form.append("categoryId", payload.categoryId);
    (payload.tagIds ?? []).forEach((id) => form.append("tagIds", id));
    if (payload.image) form.append("image", payload.image);
    const { data } = await api.post<ProductSingleResponse>("/products", form);
    if (data.status === "success" && data.product) return data.product;
    return null;
  } catch {
    return null;
  }
}

export async function productUpdate(
  id: string,
  payload: { name?: string; description?: string; price?: number; categoryId?: string | null; tagIds?: string[]; image?: File }
): Promise<Product | null> {
  try {
    const form = new FormData();
    if (payload.name !== undefined) form.append("name", payload.name.trim());
    if (payload.description !== undefined) form.append("description", (payload.description ?? "").trim());
    if (payload.price !== undefined) form.append("price", String(payload.price));
    if (payload.categoryId !== undefined) form.append("categoryId", payload.categoryId ?? "");
    if (payload.tagIds !== undefined) payload.tagIds.forEach((id) => form.append("tagIds", id));
    if (payload.image) form.append("image", payload.image);
    const { data } = await api.patch<ProductSingleResponse>(`/products/${id}`, form);
    if (data.status === "success" && data.product) return data.product;
    return null;
  } catch {
    return null;
  }
}

export async function productDelete(id: string): Promise<boolean> {
  try {
    const { data } = await api.delete<{ status: string }>(`/products/${id}`);
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function productArchive(id: string): Promise<Product | null> {
  try {
    const { data } = await api.patch<ProductSingleResponse>(`/products/${id}/archive`);
    if (data.status === "success" && data.product) return data.product;
    return null;
  } catch {
    return null;
  }
}

export async function productUnarchive(id: string): Promise<Product | null> {
  try {
    const { data } = await api.patch<ProductSingleResponse>(`/products/${id}/unarchive`);
    if (data.status === "success" && data.product) return data.product;
    return null;
  } catch {
    return null;
  }
}
