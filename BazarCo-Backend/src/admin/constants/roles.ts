import { ALL_PERMISSIONS, PERMISSIONS, type Permission } from "./permissions";

export const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MODERATOR: "moderator",
  SUPPORT: "support",
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  [ADMIN_ROLES.SUPER_ADMIN]: [...ALL_PERMISSIONS],
  [ADMIN_ROLES.ADMIN]: ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.ADMINS_MANAGE),
  [ADMIN_ROLES.MODERATOR]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_MODERATE,
    PERMISSIONS.PRODUCTS_WRITE,
    PERMISSIONS.CHAT_READ,
    PERMISSIONS.CHAT_MODERATE,
    PERMISSIONS.KYC_READ,
    PERMISSIONS.KYC_REVIEW,
    PERMISSIONS.VIDEOS_READ,
    PERMISSIONS.VIDEOS_WRITE,
    PERMISSIONS.VIDEOS_DELETE,
    PERMISSIONS.AUDIT_READ,
  ],
  [ADMIN_ROLES.SUPPORT]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.CHAT_READ,
    PERMISSIONS.KYC_READ,
    PERMISSIONS.VIDEOS_READ,
  ],
};

export function permissionsForRole(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(role: AdminRole, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}
