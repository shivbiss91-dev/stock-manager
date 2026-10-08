import { inventoryService } from './inventoryService';
import { customerService } from './customerService';
import { supplierService } from './supplierService';
import { invoiceService } from './invoiceService';
import { MOCK_WAREHOUSES } from '../data/warehouses';
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

    return {
      version: '2.1.0',
      timestamp: new Date().toISOString(),
      environment: 'StockVista Production Hub (Bhiwandi / Mumbai)',
      metadata: {
        itemsCount: items.length,
        customersCount: customers.length,
        suppliersCount: suppliers.length,
        invoicesCount: invoices.length,
        warehousesCount: MOCK_WAREHOUSES.length,
      },
      data: {
        items,
        customers,
        suppliers,
        invoices,
        warehouses: MOCK_WAREHOUSES,
        materials: MATERIAL_CATEGORIES,
      },
    };
  },

  async restoreSnapshot(fileContent: string): Promise<{
    success: boolean;
    metadata?: DatabaseSnapshot['metadata'];
    error?: string;
  }> {
    await new Promise((res) => setTimeout(res, 80));
    try {
      const parsed = JSON.parse(fileContent) as DatabaseSnapshot;
      if (!parsed.version || !parsed.data || !parsed.metadata) {
        return { success: false, error: 'Invalid database snapshot format. Missing required root properties.' };
      }
      return { success: true, metadata: parsed.metadata };
    } catch {
      return { success: false, error: 'Failed to parse JSON file. File is corrupt or not valid JSON.' };
    }
  },
};
