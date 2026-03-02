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

// Product detail (buyer): get by id with reviews, like count, etc.
export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ProductDetailResponse {
  product: Product;
  reviewCount: number;
  likeCount: number;
  averageRating: number;
  userLiked: boolean;
  reviews: ProductReview[];
}

export async function getProductById(id: string): Promise<ProductDetailResponse | null> {
  try {
    const { data } = await api.get<{
      status: string;
      product: Product;
      reviewCount: number;
      likeCount: number;
      averageRating: number;
      userLiked: boolean;
      reviews: ProductReview[];
    }>(`/products/${id}`);
    if (data.status === "success") {
      return {
        product: data.product,
        reviewCount: data.reviewCount ?? 0,
        likeCount: data.likeCount ?? 0,
        averageRating: data.averageRating ?? 0,
        userLiked: data.userLiked ?? false,
        reviews: data.reviews ?? [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function addProductReview(productId: string, rating: number, comment?: string): Promise<{ success: boolean }> {
  try {
    const { data } = await api.post<{ status: string }>(`/products/${productId}/reviews`, { rating, comment });
    return { success: data.status === "success" };
  } catch {
    return { success: false };
  }
}

export async function toggleProductLike(productId: string): Promise<{ liked: boolean; likeCount: number } | null> {
  try {
    const { data } = await api.post<{ status: string; liked: boolean; likeCount: number }>(`/products/${productId}/like`);
    if (data.status === "success") return { liked: data.liked, likeCount: data.likeCount ?? 0 };
    return null;
  } catch {
    return null;
  }
}

// Cart
export interface CartItem {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  imageUrl?: string;
  subtotal: number;
}

export async function getCart(): Promise<{ items: CartItem[]; total: number }> {
  try {
    const { data } = await api.get<{ status: string; items: CartItem[]; total: number }>("/cart");
    if (data.status === "success") return { items: data.items ?? [], total: data.total ?? 0 };
    return { items: [], total: 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function addToCart(productId: string, quantity = 1): Promise<{ success: boolean; productName?: string }> {
  try {
    const { data } = await api.post<{ status: string; productName?: string }>("/cart", { productId, quantity });
    if (data.status === "success") return { success: true, productName: data.productName };
    return { success: false };
  } catch {
    return { success: false };
  }
}

export async function updateCartItemQuantity(productId: string, quantity: number): Promise<boolean> {
  try {
    const { data } = await api.patch<{ status: string }>(`/cart/${productId}`, { quantity });
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function removeFromCart(productId: string): Promise<boolean> {
  try {
    const { data } = await api.delete<{ status: string }>(`/cart/${productId}`);
    return data.status === "success";
  } catch {
    return false;
  }
}

export interface ShippingAddressInput {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
  phone?: string;
}

export async function createCheckoutSession(shippingAddress?: ShippingAddressInput, urgent?: boolean): Promise<{ url: string | null; error?: string }> {
  try {
    const { data } = await api.post<{ status: string; url?: string }>("/checkout/create-session", {
      shippingAddress: shippingAddress ?? undefined,
      urgent: !!urgent,
    });
    if (data.status === "success" && data.url) return { url: data.url };
    return { url: null, error: "Could not start checkout" };
  } catch (err) {
    const data = axios.isAxiosError(err) ? err.response?.data : null;
    const msg = data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string"
      ? (data as { message: string }).message
      : null;
    return { url: null, error: msg ?? "Checkout failed" };
  }
}

export interface OrderItem {
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface OrderShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
  phone?: string;
}

export interface OrderRider {
  id: string;
  name: string;
  phone?: string;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  shippingAddress?: OrderShippingAddress;
  rider?: OrderRider | null;
  urgent?: boolean;
}

export async function confirmCheckoutSuccess(sessionId: string): Promise<{ orders: Order[]; error?: string }> {
  try {
    const { data } = await api.post<{ status: string; orders?: Order[] }>("/checkout/success", { session_id: sessionId });
    if (data.status === "success") return { orders: data.orders ?? [] };
    return { orders: [], error: "Could not confirm order" };
  } catch (err) {
    const message = axios.isAxiosError(err) && err.response?.data && typeof (err.response.data as { message?: string }).message === "string"
      ? (err.response.data as { message: string }).message
      : "Confirmation failed";
    return { orders: [], error: message };
  }
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export async function listAddresses(): Promise<Address[]> {
  try {
    const { data } = await api.get<{ status: string; addresses?: Address[] }>("/addresses");
    if (data.status === "success") return data.addresses ?? [];
    return [];
  } catch {
    return [];
  }
}

export async function createAddress(input: ShippingAddressInput & { label?: string; isDefault?: boolean }): Promise<Address | null> {
  try {
    const { data } = await api.post<{ status: string; address?: Address }>("/addresses", input);
    if (data.status === "success" && data.address) return data.address;
    return null;
  } catch {
    return null;
  }
}

export async function updateAddress(id: string, input: Partial<ShippingAddressInput> & { label?: string; isDefault?: boolean }): Promise<Address | null> {
  try {
    const { data } = await api.patch<{ status: string; address?: Address }>(`/addresses/${id}`, input);
    if (data.status === "success" && data.address) return data.address;
    return null;
  } catch {
    return null;
  }
}

export async function deleteAddress(id: string): Promise<boolean> {
  try {
    const { data } = await api.delete<{ status: string }>(`/addresses/${id}`);
    return data.status === "success";
  } catch {
    return false;
  }
}

export async function listOrders(options?: { asSeller?: boolean; status?: string }): Promise<Order[]> {
  try {
    const params: Record<string, string> = {};
    if (options?.asSeller) params.as = "seller";
    if (options?.status) params.status = options.status;
    const { data } = await api.get<{ status: string; orders?: Order[] }>("/orders", { params });
    if (data.status === "success") return data.orders ?? [];
    return [];
  } catch {
    return [];
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const { data } = await api.get<{ status: string; order?: Order }>(`/orders/${id}`);
    if (data.status === "success" && data.order) return data.order;
    return null;
  } catch {
    return null;
  }
}

export async function updateOrderStatus(orderId: string, status: string): Promise<boolean> {
  try {
    const { data } = await api.patch<{ status: string }>(`/orders/${orderId}/status`, { status });
    return data.status === "success";
  } catch {
    return false;
  }
}

// Offers (negotiation)
export interface OfferProduct {
  id: string;
  name?: string;
  price?: number;
  imageUrl?: string;
}

export interface OfferParty {
  id: string;
  name?: string;
  email?: string;
}

export interface Offer {
  id: string;
  productId: string;
  product: OfferProduct | null;
  buyerId: string;
  buyer: OfferParty | null;
  sellerId: string;
  seller: OfferParty | null;
  proposedPrice: number;
  status: "pending" | "accepted" | "rejected" | "countered";
  buyerMessage: string | null;
  sellerMessage: string | null;
  counterPrice: number | null;
  counterMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createOffer(productId: string, proposedPrice: number, message?: string): Promise<{ success: true; offer: Offer } | { success: false; error: string }> {
  try {
    const { data } = await api.post<{ status: string; message?: string; offer?: Offer }>("/offers", {
      productId,
      proposedPrice,
      message: message ?? undefined,
    });
    if (data.status === "success" && data.offer) return { success: true, offer: data.offer };
    return { success: false, error: (data as { message?: string }).message ?? "Offer failed" };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data && typeof (err.response.data as { message?: string }).message === "string") {
      return { success: false, error: (err.response.data as { message: string }).message };
    }
    return { success: false, error: "Could not submit offer. Try again." };
  }
}

export async function listOffers(options?: { asSeller?: boolean; status?: string }): Promise<Offer[]> {
  try {
    const params: Record<string, string> = {};
    if (options?.asSeller) params.as = "seller";
    if (options?.status) params.status = options.status;
    const { data } = await api.get<{ status: string; offers?: Offer[] }>("/offers", { params });
    if (data.status === "success") return data.offers ?? [];
    return [];
  } catch {
    return [];
  }
}

export async function getOfferById(id: string): Promise<Offer | null> {
  try {
    const { data } = await api.get<{ status: string; offer?: Offer }>(`/offers/${id}`);
    if (data.status === "success" && data.offer) return data.offer;
    return null;
  } catch {
    return null;
  }
}

export async function acceptOffer(id: string): Promise<Offer | null> {
  try {
    const { data } = await api.patch<{ status: string; offer?: Offer }>(`/offers/${id}/accept`);
    if (data.status === "success" && data.offer) return data.offer;
    return null;
  } catch {
    return null;
  }
}

export async function rejectOffer(id: string, message?: string): Promise<Offer | null> {
  try {
    const { data } = await api.patch<{ status: string; offer?: Offer }>(`/offers/${id}/reject`, { message });
    if (data.status === "success" && data.offer) return data.offer;
    return null;
  } catch {
    return null;
  }
}

export async function counterOffer(id: string, counterPrice: number, message?: string): Promise<Offer | null> {
  try {
    const { data } = await api.patch<{ status: string; offer?: Offer }>(`/offers/${id}/counter`, {
      counterPrice,
      message: message ?? undefined,
    });
    if (data.status === "success" && data.offer) return data.offer;
    return null;
  } catch {
    return null;
  }
}

export async function acceptCounter(id: string): Promise<Offer | null> {
  try {
    const { data } = await api.patch<{ status: string; offer?: Offer }>(`/offers/${id}/accept-counter`);
    if (data.status === "success" && data.offer) return data.offer;
    return null;
  } catch {
    return null;
  }
}

export async function respondToCounter(id: string, proposedPrice: number, message?: string): Promise<Offer | null> {
  try {
    const { data } = await api.patch<{ status: string; offer?: Offer }>(`/offers/${id}/respond`, {
      proposedPrice,
      message: message ?? undefined,
    });
    if (data.status === "success" && data.offer) return data.offer;
    return null;
  } catch {
    return null;
  }
}

// Seller report (analytics)
export interface SellerReportProduct {
  id: string;
  name: string;
  status: string;
}

export interface SellerReportSoldItem {
  productName: string;
  quantity: number;
  orderId: string;
}

export interface SellerReportOrder {
  id: string;
  buyerId: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{ productName: string; quantity: number; price: number }>;
}

export interface SellerReport {
  rating: number;
  ratingCount: number;
  productsTotal: number;
  productsActive: number;
  productsArchived: number;
  salesTotal: number;
  productsByCategory: { categoryId: string | null; categoryName: string; count: number }[];
  productList: SellerReportProduct[];
  productsSold: SellerReportSoldItem[];
  soldCount: number;
  ordersCompleted: SellerReportOrder[];
  ordersInProgress: SellerReportOrder[];
}

export async function sellerReport(): Promise<SellerReport | null> {
  try {
    const { data } = await api.get<{
      status: string;
      rating: number;
      ratingCount: number;
      productsTotal: number;
      productsActive: number;
      productsArchived: number;
      salesTotal: number;
      productsByCategory: SellerReport["productsByCategory"];
      productList: SellerReport["productList"];
      productsSold: SellerReport["productsSold"];
      soldCount: number;
      ordersCompleted: SellerReport["ordersCompleted"];
      ordersInProgress: SellerReport["ordersInProgress"];
    }>("/seller/report");
    if (data.status === "success") {
      return {
        rating: data.rating ?? 0,
        ratingCount: data.ratingCount ?? 0,
        productsTotal: data.productsTotal ?? 0,
        productsActive: data.productsActive ?? 0,
        productsArchived: data.productsArchived ?? 0,
        salesTotal: data.salesTotal ?? 0,
        productsByCategory: data.productsByCategory ?? [],
        productList: data.productList ?? [],
        productsSold: data.productsSold ?? [],
        soldCount: data.soldCount ?? 0,
        ordersCompleted: data.ordersCompleted ?? [],
        ordersInProgress: data.ordersInProgress ?? [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Chat
export interface ChatConversationParty {
  id: string;
  name?: string;
  email?: string;
}

export interface ChatConversationOrder {
  id: string;
  total?: number;
  status?: string;
}

export interface ChatConversationProduct {
  id: string;
  name?: string;
  price?: number;
  imageUrl?: string;
}

export interface ChatConversation {
  id: string;
  buyerId: string;
  sellerId: string;
  buyer: ChatConversationParty | null;
  seller: ChatConversationParty | null;
  orderId?: string | null;
  order: ChatConversationOrder | null;
  productId?: string | null;
  product: ChatConversationProduct | null;
  updatedAt?: string;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  role: "buyer" | "seller";
  content: string;
  messageType: "text" | "image" | "file";
  status: "sent" | "delivered" | "seen";
  isUnsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listConversations(): Promise<ChatConversation[]> {
  try {
    const { data } = await api.get<{ status: string; conversations?: ChatConversation[] }>("/chat/conversations");
    if (data.status === "success") return data.conversations ?? [];
    return [];
  } catch {
    return [];
  }
}

export async function getConversation(id: string): Promise<ChatConversation | null> {
  try {
    const { data } = await api.get<{ status: string; conversation?: ChatConversation }>(`/chat/conversations/${id}`);
    if (data.status === "success" && data.conversation) return data.conversation;
    return null;
  } catch {
    return null;
  }
}

export async function createConversationByOrder(orderId: string): Promise<ChatConversation | null> {
  try {
    const { data } = await api.post<{ status: string; conversation?: ChatConversation }>("/chat/conversations", { orderId });
    if (data.status === "success" && data.conversation) return data.conversation;
    return null;
  } catch {
    return null;
  }
}

export async function createConversationByProduct(productId: string): Promise<{ success: true; conversation: ChatConversation } | { success: false; error: string }> {
  try {
    const { data } = await api.post<{ status: string; message?: string; conversation?: ChatConversation }>("/chat/conversations", { productId });
    if (data.status === "success" && data.conversation) return { success: true, conversation: data.conversation };
    return { success: false, error: (data as { message?: string }).message ?? "Could not start chat" };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data && typeof (err.response.data as { message?: string }).message === "string") {
      return { success: false, error: (err.response.data as { message: string }).message };
    }
    return { success: false, error: "Could not start chat. Try again." };
  }
}

export async function getConversationMessages(
  conversationId: string,
  options?: { limit?: number; before?: string; beforeMessageId?: string }
): Promise<ChatMessage[]> {
  try {
    const params: Record<string, string> = {};
    if (options?.limit != null) params.limit = String(options.limit);
    if (options?.before) params.before = options.before;
    if (options?.beforeMessageId) params.beforeMessageId = options.beforeMessageId;
    const { data } = await api.get<{ status: string; messages?: ChatMessage[] }>(`/chat/conversations/${conversationId}/messages`, { params });
    if (data.status === "success") return data.messages ?? [];
    return [];
  } catch {
    return [];
  }
}

export async function unsendMessage(messageId: string): Promise<boolean> {
  try {
    const { data } = await api.patch<{ status: string }>(`/chat/messages/${messageId}/unsend`);
    return data.status === "success";
  } catch {
    return false;
  }
}
