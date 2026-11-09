export type Role = 'admin' | 'manager' | 'staff' | 'viewer';

export type UserStatus = 'active' | 'suspended' | 'deactivated' | 'pending_approval';

export type LoginMethod = 'google' | 'phone_otp' | 'email_password';

/**
 * 9 Core StockVista Modules for Admin-Controlled Staff Permissions
 */
export type AppPermissionModule =
  | 'module_dashboard'
  | 'module_items'
  | 'module_stock'
  | 'module_warehouses'
  | 'module_transfers'
  | 'module_orders'
  | 'module_invoices'
  | 'module_reports'
  | 'module_settings';

export interface ModuleDefinition {
  id: AppPermissionModule;
  label: string;
  description: string;
  path: string;
  adminOnlyByDefault?: boolean;
}

export const APP_MODULES: ModuleDefinition[] = [
  {
    id: 'module_dashboard',
    label: 'Dashboard',
    description: 'Real-time KPIs, operations calendar, quick stock adjustment actions',
    path: '/dashboard',
  },
  {
    id: 'module_items',
    label: 'Items & Products',
    description: 'Product catalogue, pricing, barcode printing & image management',
    path: '/items',
  },
  {
    id: 'module_stock',
    label: 'Stock Management',
    description: 'Stock movements, adjustments, inventory calibration, and stock records',
    path: '/stock-movements',
  },
  {
    id: 'module_warehouses',
    label: 'Warehouse Management',
    description: 'Multi-hub facilities, warehouse breakdowns, and storage configurations',
    path: '/warehouses',
  },
  {
    id: 'module_transfers',
    label: 'Stock Transfers',
    description: 'Inter-warehouse transfer authorizations, dispatches, and inward receipts',
    path: '/transfers',
  },
  {
    id: 'module_orders',
    label: 'Orders',
    description: 'Sales orders, purchase orders, quotations, and returns management',
    path: '/sales/orders',
  },
  {
    id: 'module_invoices',
    label: 'Invoices',
    description: 'Tax invoices, e-Way bills, statutory GST billing, and supplier bills',
    path: '/sales/invoices',
  },
  {
    id: 'module_reports',
    label: 'Reports',
    description: 'Financial intelligence, inventory valuation, GST reports, and audits',
    path: '/reports',
  },
  {
    id: 'module_settings',
    label: 'Settings',
    description: 'Company profile, statutory configuration, and system preferences (Admin-only unless delegated)',
    path: '/settings',
    adminOnlyByDefault: true,
  },
];

export const DEFAULT_ROLE_MODULES: Record<Role, AppPermissionModule[]> = {
  admin: [
    'module_dashboard',
    'module_items',
    'module_stock',
    'module_warehouses',
    'module_transfers',
    'module_orders',
    'module_invoices',
    'module_reports',
    'module_settings',
  ],
  manager: [
    'module_dashboard',
    'module_items',
    'module_stock',
    'module_warehouses',
    'module_transfers',
    'module_orders',
    'module_invoices',
    'module_reports',
  ],
  staff: [
    'module_dashboard',
    'module_items',
    'module_stock',
    'module_orders',
    'module_invoices',
  ],
  viewer: [
    'module_dashboard',
    'module_items',
    'module_reports',
  ],
};

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
  status: UserStatus;
  isDemo?: boolean;
  loginMethod?: LoginMethod;
  preferredLoginMethod?: LoginMethod;
  permissions?: AppPermissionModule[];
  createdAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
  isDemo?: boolean;
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

/**
 * Checks whether a user has permission to access a specific module.
 * Admin has access to all modules.
 * Deactivated/suspended users have no access.
 * If user has custom permissions array, that is evaluated; otherwise defaults to their role modules.
 */
export function hasModuleAccess(user: User | null | undefined, module: AppPermissionModule): boolean {
  if (!user) return false;
  if (user.status === 'deactivated' || user.status === 'suspended') return false;
  if (user.role === 'admin') return true;

  if (Array.isArray(user.permissions)) {
    return user.permissions.includes(module);
  }

  const defaultModules = DEFAULT_ROLE_MODULES[user.role] || [];
  return defaultModules.includes(module);
}
