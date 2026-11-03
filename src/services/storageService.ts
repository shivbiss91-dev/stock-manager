import { STARTER_PRODUCTS } from '../data/inventorySeed';
import { migrateProductCategory } from '../data/materialCategories';
import {
  DEMO_ITEMS,
  DEMO_WAREHOUSES,
  DEMO_SUPPLIERS,
  DEMO_CUSTOMERS,
  DEMO_INVOICES,
  DEMO_SALES_ORDERS,
  DEMO_PURCHASES,
  DEMO_TRANSFERS,
  DEMO_MOVEMENTS,
  DEMO_CALENDAR_EVENTS,
} from '../data/demoSeed';

/**
 * Centralized persistent storage service for StockVista ERP.
 * Manages clean initial states, safe schema validation, and persistent storage in browser localStorage.
 * 
 * WORKSPACE ISOLATION:
 * When an active session is marked with `isDemo: true` (Sweedal – Demo Admin),
 * all ERP data keys automatically map to isolated `stockvista_demo_v1_*` keys.
 * Real business data under `stockvista_erp_v3_*` is completely physically isolated
 * and protected from any demo operations.
 */

export const STORAGE_KEYS = {
  INITIALIZED: 'stockvista_erp_v3_initialized',
  STARTER_SEEDED: 'stockvista_starter_seeded_v1',
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
  CALENDAR_EVENTS: 'stockvista_erp_v3_calendar_events',
} as const;

export const DEMO_STORAGE_PREFIX = 'stockvista_demo_v1_';

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
   * Detects whether the current active user session is a Demo Admin session.
   */
  static isDemoActive(): boolean {
    try {
      const storage = this.getStorage();
      const raw = storage.getItem(STORAGE_KEYS.SESSION);
      if (!raw) return false;
      const session = JSON.parse(raw);
      return Boolean(session?.isDemo || session?.user?.isDemo);
    } catch {
      return false;
    }
  }

  /**
   * Resolves the physical storage key based on active workspace (Production vs Demo).
   */
  static getEffectiveKey(key: string): string {
    // Session itself is always stored in the global session slot
    if (key === STORAGE_KEYS.SESSION) {
      return key;
    }
    // In Demo mode, redirect all ERP collection keys to the isolated demo storage namespace
    if (this.isDemoActive()) {
      return key.replace('stockvista_erp_v3_', DEMO_STORAGE_PREFIX);
    }
    return key;
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

        // Initialize clean starter collections: exactly the four starter products for items, clean empty for all transactions/parties
        storage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
        storage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(STARTER_PRODUCTS));
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
        storage.setItem(STORAGE_KEYS.STARTER_SEEDED, 'true');
      } else {
        // If initialized previously but starter products have not been seeded and items list is empty
        const seeded = storage.getItem(STORAGE_KEYS.STARTER_SEEDED);
        if (!seeded) {
          const currentItemsRaw = storage.getItem(STORAGE_KEYS.ITEMS);
          if (!currentItemsRaw || currentItemsRaw === '[]') {
            storage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(STARTER_PRODUCTS));
          }
          storage.setItem(STORAGE_KEYS.STARTER_SEEDED, 'true');
        }

        // Ensure any existing items are safely preserved and migrated to approved catalogue categories
        const currentItemsRaw = storage.getItem(STORAGE_KEYS.ITEMS);
        if (currentItemsRaw) {
          try {
            const items = JSON.parse(currentItemsRaw);
            if (Array.isArray(items)) {
              let changed = false;
              const validCats = ['card_holder', 'lanyard', 'hook', 'button_bag'];
              const migrated = items.map((it: any) => {
                if (!validCats.includes(it.materialCategory)) {
                  changed = true;
                  return {
                    ...it,
                    materialCategory: migrateProductCategory(it.materialCategory, it.name, it.sku),
                  };
                }
                return it;
              });
              if (changed) {
                storage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(migrated));
              }
            }
          } catch {}
        }
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('Storage initialization error:', e);
    }
  }

  /**
   * Seeds or re-seeds the separate Demo Administrator workspace with realistic sample records.
   */
  static seedDemoWorkspace(forceReset = false): void {
    try {
      const storage = this.getStorage();
      const initializedKey = `${DEMO_STORAGE_PREFIX}initialized`;
      const isAlreadySeeded = storage.getItem(initializedKey);

      if (!isAlreadySeeded || forceReset) {
        storage.setItem(`${DEMO_STORAGE_PREFIX}items`, JSON.stringify(DEMO_ITEMS));
        storage.setItem(`${DEMO_STORAGE_PREFIX}warehouses`, JSON.stringify(DEMO_WAREHOUSES));
        storage.setItem(`${DEMO_STORAGE_PREFIX}suppliers`, JSON.stringify(DEMO_SUPPLIERS));
        storage.setItem(`${DEMO_STORAGE_PREFIX}customers`, JSON.stringify(DEMO_CUSTOMERS));
        storage.setItem(`${DEMO_STORAGE_PREFIX}invoices`, JSON.stringify(DEMO_INVOICES));
        storage.setItem(`${DEMO_STORAGE_PREFIX}sales_orders`, JSON.stringify(DEMO_SALES_ORDERS));
        storage.setItem(`${DEMO_STORAGE_PREFIX}purchases`, JSON.stringify(DEMO_PURCHASES));
        storage.setItem(`${DEMO_STORAGE_PREFIX}transfers`, JSON.stringify(DEMO_TRANSFERS));
        storage.setItem(`${DEMO_STORAGE_PREFIX}movements`, JSON.stringify(DEMO_MOVEMENTS));
        storage.setItem(`${DEMO_STORAGE_PREFIX}calendar_events`, JSON.stringify(DEMO_CALENDAR_EVENTS));
        storage.setItem(`${DEMO_STORAGE_PREFIX}notifications`, JSON.stringify([]));
        storage.setItem(`${DEMO_STORAGE_PREFIX}settings`, JSON.stringify({}));
        storage.setItem(initializedKey, 'true');
      }
    } catch (e) {
      console.error('Failed to seed demo workspace:', e);
    }
  }

  /**
   * Resets the demo workspace back to pristine realistic sample data.
   * Completely preserves production business data.
   */
  static resetDemoWorkspace(): void {
    this.seedDemoWorkspace(true);
  }

  static get<T>(key: string, defaultValue: T): T {
    try {
      this.init();
      const storage = this.getStorage();
      const effectiveKey = this.getEffectiveKey(key);
      const raw = storage.getItem(effectiveKey);
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
      const effectiveKey = this.getEffectiveKey(key);
      storage.setItem(effectiveKey, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to persist key "${key}":`, e);
    }
  }

  static remove(key: string): void {
    try {
      const storage = this.getStorage();
      const effectiveKey = this.getEffectiveKey(key);
      storage.removeItem(effectiveKey);
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
