/**
 * Centralized persistent storage service for StockVista ERP.
 * Manages clean initial states, safe schema validation, and persistent storage in browser localStorage.
 */

export const STORAGE_KEYS = {
  INITIALIZED: 'stockvista_erp_v3_initialized',
  USERS: 'stockvista_erp_v3_users',
  SESSION: 'stockvista_erp_v3_session',
  ITEMS: 'stockvista_erp_v3_items',
  WAREHOUSES: 'stockvista_erp_v3_warehouses',
  CUSTOMERS: 'stockvista_erp_v3_customers',
  SUPPLIERS: 'stockvista_erp_v3_suppliers',
  PURCHASES: 'stockvista_erp_v3_purchases',
  GRN: 'stockvista_erp_v3_grn',
  SUPPLIER_BILLS: 'stockvista_erp_v3_supplier_bills',
  TRANSFERS: 'stockvista_erp_v3_transfers',
  QUOTATIONS: 'stockvista_erp_v3_quotations',
  SALES_ORDERS: 'stockvista_erp_v3_sales_orders',
  RETURNS: 'stockvista_erp_v3_returns',
  INVOICES: 'stockvista_erp_v3_invoices',
  MOVEMENTS: 'stockvista_erp_v3_movements',
  APPROVALS: 'stockvista_erp_v3_approvals',
  AUDIT: 'stockvista_erp_v3_audit',
  DOCUMENTS: 'stockvista_erp_v3_documents',
  NOTIFICATIONS: 'stockvista_erp_v3_notifications',
  SETTINGS: 'stockvista_erp_v3_settings',
} as const;

export class StorageService {
  private static isInitialized = false;
  private static inMemoryStore = new Map<string, string>();

  private static getStorage(): {
    getItem: (k: string) => string | null;
    setItem: (k: string, v: string) => void;
    removeItem: (k: string) => void;
  } {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    return {
      getItem: (k: string) => StorageService.inMemoryStore.get(k) ?? null,
      setItem: (k: string, v: string) => {
        StorageService.inMemoryStore.set(k, v);
      },
      removeItem: (k: string) => {
        StorageService.inMemoryStore.delete(k);
      },
    };
  }

  /**
   * Initializes the storage. On first launch, wipes legacy mock keys and ensures all collections start empty.
   */
  static init(): void {
    if (this.isInitialized) return;

    try {
      const storage = this.getStorage();
      const initialized = storage.getItem(STORAGE_KEYS.INITIALIZED);
      if (!initialized) {
        // One-time purge of legacy mock data keys in browser
        if (typeof window !== 'undefined' && window.localStorage) {
          const legacyKeys = [
            'stockvista_session',
            'stockvista_inventory_items_v2',
            'stockvista_layout_usr-001',
            'stockvista_layout_usr-002',
            'stockvista_layout_usr-003',
            'stockvista_layout_usr-004',
            'stockvista_category_view',
          ];
          legacyKeys.forEach((key) => localStorage.removeItem(key));
        }

        // Initialize clean empty collections
        storage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.GRN, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.SUPPLIER_BILLS, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.SALES_ORDERS, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.APPROVALS, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));

        storage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('Storage initialization error:', e);
    }
  }

  static get<T>(key: string, defaultValue: T): T {
    try {
      this.init();
      const storage = this.getStorage();
      const raw = storage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      this.init();
      const storage = this.getStorage();
      storage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to persist key "${key}":`, e);
    }
  }

  static remove(key: string): void {
    try {
      const storage = this.getStorage();
      storage.removeItem(key);
    } catch {}
  }

  /**
   * Explicit, controlled system reset. Wipes all stored collections back to empty state.
   */
  static resetToFreshInstall(): void {
    try {
      const storage = this.getStorage();
      Object.values(STORAGE_KEYS).forEach((k) => storage.removeItem(k));
      this.isInitialized = false;
      this.init();
    } catch (e) {
      console.error('Failed to reset storage:', e);
    }
  }
}
