import { AuditLogEntry, AuditAction, AuditModule } from '../types/audit';
import { StorageService, STORAGE_KEYS } from './storageService';

export const auditLogService = {
  async getLogs(filters?: {
    module?: AuditModule | 'all';
    action?: AuditAction | 'all';
    userId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLogEntry[]> {
    await new Promise((res) => setTimeout(res, 20));
    let list = StorageService.get<AuditLogEntry[]>(STORAGE_KEYS.AUDIT, []);

    if (filters?.module && filters.module !== 'all') {
      list = list.filter((l) => l.module.toLowerCase() === filters.module!.toLowerCase());
    }
    if (filters?.action && filters.action !== 'all') {
      list = list.filter((l) => l.action === filters.action);
    }
    if (filters?.userId) {
      list = list.filter((l) => l.userId === filters.userId);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.targetDescription.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (l.newValue && l.newValue.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async getAuditLogs(filters?: {
    module?: AuditModule | 'all';
    action?: AuditAction | 'all';
    userId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLogEntry[]> {
    return auditLogService.getLogs(filters);
  },

  async logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const list = StorageService.get<AuditLogEntry[]>(STORAGE_KEYS.AUDIT, []);
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newEntry);
    StorageService.set(STORAGE_KEYS.AUDIT, list);
    return newEntry;
  },

  _seedAuditLogsForTesting(logs: AuditLogEntry[]): void {
    StorageService.set(STORAGE_KEYS.AUDIT, logs);
  },
};
