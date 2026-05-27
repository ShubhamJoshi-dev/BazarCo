/** Granular admin permissions for RBAC. */
export const PERMISSIONS = {
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  USERS_DELETE: "users:delete",
  USERS_EXPORT: "users:export",
  PRODUCTS_READ: "products:read",
  PRODUCTS_WRITE: "products:write",
  PRODUCTS_DELETE: "products:delete",
  PRODUCTS_MODERATE: "products:moderate",
  CATEGORIES_MANAGE: "categories:manage",
  CHAT_READ: "chat:read",
  CHAT_MODERATE: "chat:moderate",
  KYC_READ: "kyc:read",
  KYC_REVIEW: "kyc:review",
  VIDEOS_READ: "videos:read",
  VIDEOS_WRITE: "videos:write",
  VIDEOS_DELETE: "videos:delete",
  SYSTEM_READ: "system:read",
  SYSTEM_MAINTENANCE: "system:maintenance",
  AUDIT_READ: "audit:read",
  ADMINS_MANAGE: "admins:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);
