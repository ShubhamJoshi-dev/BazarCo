export type AdminRole = "super_admin" | "admin" | "moderator" | "support";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  name?: string;
  role: AdminRole;
  permissions: string[];
  twoFactorEnabled?: boolean;
  lastLoginAt?: string;
}

export interface AdminAuthSuccess {
  status: "success";
  message: string;
  token: string;
  admin: AdminUser;
}

export interface AdminOverviewStats {
  totalUsers: number;
  activeSellers: number;
  suspendedUsers: number;
  deletedUsers: number;
  totalProducts: number;
  activeProducts: number;
  flaggedProducts: number;
  pendingKyc: number;
  totalVideos: number;
  flaggedMessages: number;
  totalConversations: number;
  recentAuditCount: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminPlatformUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  kycVerified?: boolean;
  emailVerified?: boolean;
  suspendedAt?: string | null;
  suspendedReason?: string;
  deletedAt?: string | null;
  messagingBanned?: boolean;
  createdAt?: string;
}

export interface AdminProductRow {
  id: string;
  name: string;
  description?: string;
  price: number;
  status: string;
  sellerId: string;
  stock?: number;
  sku?: string;
  brand?: string;
  imageUrl?: string;
  flagged?: boolean;
  flagReason?: string;
  featured?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminKycDetail {
  id: string;
  userId: string;
  status: string;
  rejectionReason?: string;
  user?: { email?: string; name?: string; role?: string; kycVerified?: boolean };
  documents: { id: string; documentType: string; fileUrl: string; createdAt?: string }[];
}

export interface AdminKycRow {
  id: string;
  userId: string;
  status: string;
  user?: { email?: string; name?: string; role?: string };
  rejectionReason?: string;
  createdAt?: string;
}

export interface AdminVideoRow {
  id: string;
  title?: string;
  caption?: string;
  status: string;
  sellerId: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  views?: number;
  likes?: number;
  comments?: number;
  category?: string;
  visibility?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminConversationRow {
  id: string;
  buyerId: string;
  sellerId: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface AdminMessageRow {
  id: string;
  messageId: string;
  conversationId: string;
  senderId?: string;
  receiverId?: string;
  role?: string;
  content: string;
  messageType?: string;
  flagged?: boolean;
  createdAt?: string;
}

export interface AdminAuditRow {
  _id: string;
  action: string;
  adminUsername?: string;
  resource?: string;
  resourceId?: string;
  success?: boolean;
  createdAt: string;
}
