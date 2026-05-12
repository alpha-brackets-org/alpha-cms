import { User, UserRole } from '@/schemas/cms';

export enum CmsPermission {
  CAN_EDIT_USERS = 'CAN_EDIT_USERS',
  CAN_DELETE_USERS = 'CAN_DELETE_USERS',
  CAN_PUBLISH = 'CAN_PUBLISH',
  CAN_EDIT_CONTENT = 'CAN_EDIT_CONTENT',
  CAN_VIEW_ONLY = 'CAN_VIEW_ONLY',
}

export const PERMISSIONS: Record<CmsPermission, UserRole[]> = {
  [CmsPermission.CAN_EDIT_USERS]: [UserRole.ADMIN],
  [CmsPermission.CAN_DELETE_USERS]: [UserRole.ADMIN],
  [CmsPermission.CAN_PUBLISH]: [UserRole.ADMIN, UserRole.EDITOR],
  [CmsPermission.CAN_EDIT_CONTENT]: [UserRole.ADMIN, UserRole.EDITOR],
  [CmsPermission.CAN_VIEW_ONLY]: [UserRole.VIEWER],
};

export function hasPermission(
  user: User | null,
  permission: CmsPermission
): boolean {
  if (!user) return false;
  const allowedRoles = PERMISSIONS[permission] as readonly UserRole[];
  return allowedRoles.includes(user.role);
}

export function isAdmin(user: User | null): boolean {
  return user?.role === UserRole.ADMIN;
}

export function isEditor(user: User | null): boolean {
  return user?.role === UserRole.EDITOR || user?.role === UserRole.ADMIN;
}

export function isViewer(user: User | null): boolean {
  return user?.role === UserRole.VIEWER;
}
