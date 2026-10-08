export type AuditActionType =
  | 'login'
  | 'logout'
  | 'price_update'
  | 'stock_adjustment'
  | 'invoice_created'
  | 'po_created'
  | 'grn_received'
  | 'transfer_dispatched'
  | 'approval_granted'
  | 'approval_rejected'
  | 'settings_updated';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO
  userId: string;
  userName: string;
  userRole: string;
  action: AuditActionType;
  module: 'Inventory' | 'Sales' | 'Purchases' | 'Logistics' | 'Security' | 'Settings';
  targetId?: string;
  targetDescription: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  device: string;
}
