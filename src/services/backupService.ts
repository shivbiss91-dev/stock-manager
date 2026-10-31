import { inventoryService } from './inventoryService';
import { customerService } from './customerService';
import { supplierService } from './supplierService';
import { invoiceService } from './invoiceService';
import { warehouseService } from './warehouseService';
import { settingsService } from './settingsService';
import { StorageService, STORAGE_KEYS } from './storageService';
import { MATERIAL_CATEGORIES } from '../data/materialCategories';

export interface DatabaseSnapshot {
  version: string;
  timestamp: string;
  environment: string;
  metadata: {
    itemsCount: number;
    customersCount: number;
    suppliersCount: number;
    invoicesCount: number;
    warehousesCount: number;
  };
  data: {
    items: unknown[];
    customers: unknown[];
    suppliers: unknown[];
    invoices: unknown[];
    warehouses: unknown[];
    materials: unknown[];
  };
}

export const backupService = {
  async generateSnapshot(): Promise<DatabaseSnapshot> {
    const items = await inventoryService.getAllItems();
    const customers = await customerService.getCustomers();
    const suppliers = await supplierService.getSuppliers();
    const invoices = await invoiceService.getInvoices();
    const warehouses = await warehouseService.getWarehouses();
    const settings = await settingsService.getSettings();

    const companyName = settings.companyName || 'StockVista ERP';

    return {
      version: '2.1.0',
      timestamp: new Date().toISOString(),
      environment: `${companyName} Database Instance`,
      metadata: {
        itemsCount: items.length,
        customersCount: customers.length,
        suppliersCount: suppliers.length,
        invoicesCount: invoices.length,
        warehousesCount: warehouses.length,
      },
      data: {
        items,
        customers,
        suppliers,
        invoices,
        warehouses,
        materials: MATERIAL_CATEGORIES,
      },
    };
  },

  async restoreSnapshot(fileContent: string): Promise<{
    success: boolean;
    metadata?: DatabaseSnapshot['metadata'];
    error?: string;
  }> {
    try {
      const parsed = JSON.parse(fileContent) as DatabaseSnapshot;
      if (!parsed.version || !parsed.data || !parsed.metadata) {
        return { success: false, error: 'Invalid database snapshot format. Missing required root properties.' };
      }

      if (Array.isArray(parsed.data.items)) {
        StorageService.set(STORAGE_KEYS.ITEMS, parsed.data.items);
      }
      if (Array.isArray(parsed.data.customers)) {
        StorageService.set(STORAGE_KEYS.CUSTOMERS, parsed.data.customers);
      }
      if (Array.isArray(parsed.data.suppliers)) {
        StorageService.set(STORAGE_KEYS.SUPPLIERS, parsed.data.suppliers);
      }
      if (Array.isArray(parsed.data.invoices)) {
        StorageService.set(STORAGE_KEYS.INVOICES, parsed.data.invoices);
      }
      if (Array.isArray(parsed.data.warehouses)) {
        StorageService.set(STORAGE_KEYS.WAREHOUSES, parsed.data.warehouses);
      }

      return { success: true, metadata: parsed.metadata };
    } catch {
      return { success: false, error: 'Failed to parse JSON file. File is corrupt or not valid JSON.' };
    }
  },
};

