export type Role = 'admin' | 'manager' | 'staff' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleTitle: string;
  avatar?: string;
  phone: string;
  warehouseId?: string;
  warehouseName?: string;
  lastLogin?: string;
  status: 'active' | 'suspended';
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

export type PermissionAction =
  | 'view_dashboard'
  | 'view_inventory'
  | 'edit_inventory'
  | 'archive_item'
  | 'create_invoice'
  | 'view_financials'
  | 'view_cost_margin'
  | 'approve_requests'
  | 'manage_users'
  | 'manage_settings'
  | 'view_audit_log'
  | 'export_data'
  | 'manage_backups';

export const ROLE_PERMISSIONS: Record<Role, PermissionAction[]> = {
  admin: [
    'view_dashboard',
    'view_inventory',
    'edit_inventory',
    'archive_item',
    'create_invoice',
    'view_financials',
    'view_cost_margin',
    'approve_requests',
    'manage_users',
    'manage_settings',
    'view_audit_log',
    'export_data',
    'manage_backups',
  ],
  manager: [
    'view_dashboard',
    'view_inventory',
    'edit_inventory',
    'create_invoice',
    'view_financials',
    'approve_requests',
    'export_data',
  ],
  staff: [
    'view_dashboard',
    'view_inventory',
    'create_invoice',
    'export_data',
  ],
  viewer: [
    'view_dashboard',
    'view_inventory',
  ],
};
