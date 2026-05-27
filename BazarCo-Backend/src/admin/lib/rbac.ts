import type { AdminRole } from "../constants/roles";
import { permissionsForRole, roleHasPermission } from "../constants/roles";
import type { Permission } from "../constants/permissions";

import { ALL_PERMISSIONS } from "../constants/permissions";

export function resolvePermissions(role: AdminRole, extraPermissions: string[] = []): Permission[] {
  const base = permissionsForRole(role);
  const extras = extraPermissions.filter((p): p is Permission =>
    ALL_PERMISSIONS.includes(p as Permission)
  );
  return [...new Set([...base, ...extras])];
}

export function adminCan(
  role: AdminRole,
  permission: Permission,
  extraPermissions: string[] = []
): boolean {
  if (roleHasPermission(role, permission)) return true;
  return extraPermissions.includes(permission);
}
