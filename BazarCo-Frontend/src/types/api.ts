export interface HealthResponse {
  status: "ok";
  timestamp: string;
  uptime: number;
  environment: string;
  db: "connected" | "disconnected";
}

export interface NotifySuccessResponse {
  status: "success";
  message: string;
}

export interface NotifyErrorResponse {
  status: "error";
  message: string;
}

export type NotifyResponse = NotifySuccessResponse | NotifyErrorResponse;

export type UserRole = "buyer" | "seller";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

export interface AuthSuccessResponse {
  status: "success";
  message: string;
  token: string;
  user: AuthUser;
}

export interface AuthErrorResponse {
  status: "error";
  message: string;
}

export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

export type ProductStatus = "active" | "archived";

export interface Category {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId?: string;
  category?: string;
  tagIds?: string[];
  tags?: string[];
  status: ProductStatus;
  shopifyProductId?: string;
  sellerId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrowseResponse {
  status: string;
  message: string;
  products: Product[];
  categories: Category[];
  tags: Tag[];
  total: number;
  page: number;
  nbPages: number;
}

export interface ProductListResponse {
  status: string;
  message: string;
  products: Product[];
}

export interface ProductSingleResponse {
  status: string;
  message: string;
  product: Product;
}
