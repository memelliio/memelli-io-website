'use client';

import { useAuth } from '../contexts/auth';
import type { AuthUser } from '@memelli/types';

/**
 * Default permissions per role.
 * SUPER_ADMIN and ADMIN get all permissions.
 * MEMBER gets standard CRUD on business objects.
 * VIEWER gets read-only access.
 */
const ROLE_DEFAULTS: Record<string, string[]> = {
  VIEWER: [
    'contacts.read',
    'deals.read',
    'disputes.read',
    'documents.read',
    'reports.read',
  ],
  MEMBER: [
    'contacts.read',
    'contacts.create',
    'contacts.update',
    'deals.read',
    'deals.create',
    'deals.update',
    'disputes.read',
    'disputes.create',
    'disputes.update',
    'documents.read',
    'documents.create',
    'documents.update',
    'reports.read',
  ],
};

function checkPermission(user: AuthUser, permission: string): boolean {
  const defaults = ROLE_DEFAULTS[user.role] ?? [];
  return defaults.includes(permission);
}

export function usePermissions() {
  const { user } = useAuth();

  /** Check a single permission string like 'contacts.create' */
  const can = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;
    return checkPermission(user, permission);
  };

  /** True if the user has at least one of the listed permissions */
  const canAny = (permissions: string[]): boolean => permissions.some(can);

  /** True only if the user has every listed permission */
  const canAll = (permissions: string[]): boolean => permissions.every(can);

  /** True if the user has the given role */
  const hasRole = (role: string): boolean => user?.role === role;

  /** True for SUPER_ADMIN or ADMIN roles */
  const isAdmin = (): boolean =>
    user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  /** True only for the SUPER_ADMIN role (tenant owner) */
  const isOwner = (): boolean => user?.role === 'SUPER_ADMIN';

  return { can, canAny, canAll, hasRole, isAdmin, isOwner };
}
