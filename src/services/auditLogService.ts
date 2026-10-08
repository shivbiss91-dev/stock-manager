import { AuditLogEntry } from '../types/audit';

let auditLogsDatabase: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-10-08T14:15:00Z',
    userId: 'usr-003',
    userName: 'Amit Verma',
    userRole: 'staff',
    action: 'invoice_created',
    module: 'Sales',
    targetId: 'inv-00039',
    targetDescription: 'Tax Invoice INV-2026-27-00039',
    newValue: 'Grand Total: ₹2,07,385.00 (Customer: Royal Interiors & Furnishings)',
    ipAddress: '103.21.58.42',
    device: 'Desktop Chrome 129 (Windows 11)',
  },
  {
    id: 'aud-002',
    timestamp: '2026-10-08T10:15:00Z',
    userId: 'usr-001',
    userName: 'Rajesh Sharma',
    userRole: 'admin',
    action: 'approval_granted',
    module: 'Security',
    targetId: 'appr-1',
    targetDescription: 'Price adjustment for Gurjan BWP Marine Veneers & Laminates (item-wd-0001)',
    oldValue: '₹2,450.00 / sheet',
    newValue: '₹2,320.00 / sheet (Approved for Apex Furnishings)',
    ipAddress: '192.168.1.10',
    device: 'MacBook Pro macOS 15.0',
  },
  {
    id: 'aud-003',
    timestamp: '2026-10-06T15:20:00Z',
    userId: 'usr-002',
    userName: 'Suresh Patil',
    userRole: 'manager',
    action: 'grn_received',
    module: 'Purchases',
    targetId: 'grn-001',
    targetDescription: 'GRN-2026-0089 (Greenply Consignment)',
    oldValue: 'Current Stock: 85 sheets',
    newValue: 'Updated Stock: 185 sheets (+100 sheets inward)',
    ipAddress: '103.21.58.12',
    device: 'Warehouse Industrial Tablet (Android 14)',
  },
  {
    id: 'aud-004',
    timestamp: '2026-10-03T11:15:00Z',
    userId: 'usr-002',
    userName: 'Priya Patel',
    userRole: 'manager',
    action: 'transfer_dispatched',
    module: 'Logistics',
    targetId: 'tr-001',
    targetDescription: 'TR-2026-031 (Bhiwandi Hub ➔ Panvel Depot)',
    newValue: '25 sheets Gurjan BWP dispatched via Truck MH-04-GP-8842',
    ipAddress: '103.21.58.14',
    device: 'Desktop Chrome 129 (Windows 11)',
  },
  {
    id: 'aud-005',
    timestamp: '2026-10-01T09:00:00Z',
    userId: 'usr-001',
    userName: 'Rajesh Sharma',
    userRole: 'admin',
    action: 'login',
    module: 'Security',
    targetDescription: 'Administrator 2FA Session Verification',
    newValue: 'Successful OTP Login verification',
    ipAddress: '192.168.1.10',
    device: 'MacBook Pro macOS 15.0',
  },
];

export const auditLogService = {
  async getAuditLogs(filters?: {
    module?: string;
    action?: string;
    search?: string;
  }): Promise<AuditLogEntry[]> {
    await new Promise((res) => setTimeout(res, 40));
    let list = [...auditLogsDatabase];

    if (filters?.module && filters.module !== 'all') {
      list = list.filter((l) => l.module.toLowerCase() === filters.module!.toLowerCase());
    }

    if (filters?.action && filters.action !== 'all') {
      list = list.filter((l) => l.action === filters.action);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.targetDescription.toLowerCase().includes(q) ||
          (l.targetId && l.targetId.toLowerCase().includes(q)) ||
          l.ipAddress.includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async logAction(
    entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'ipAddress' | 'device'>
  ): Promise<AuditLogEntry> {
    const id = `aud-${String(auditLogsDatabase.length + 1).padStart(3, '0')}`;
    const newEntry: AuditLogEntry = {
      ...entry,
      id,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.42',
      device:
        typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('Windows')
          ? 'Desktop Chrome (Windows 11)'
          : 'Desktop Client (Secure Terminal)',
    };
    auditLogsDatabase.unshift(newEntry);
    return newEntry;
  },
};
