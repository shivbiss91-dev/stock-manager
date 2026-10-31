import { Supplier } from '../types/sales';
import { StorageService, STORAGE_KEYS } from './storageService';

export const supplierService = {
  async getSuppliers(category?: string): Promise<Supplier[]> {
    await new Promise((res) => setTimeout(res, 30));
    const list = StorageService.get<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
    if (!category || category === 'all') {
      return [...list];
    }
    return list.filter((s) => s.category.toLowerCase() === category.toLowerCase());
  },

  async getSupplierById(id: string): Promise<Supplier | null> {
    await new Promise((res) => setTimeout(res, 20));
    const list = StorageService.get<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
    const found = list.find((s) => s.id === id);
    return found ? { ...found } : null;
  },

  async createSupplier(data: Omit<Supplier, 'id'>): Promise<Supplier> {
    await new Promise((res) => setTimeout(res, 50));
    const list = StorageService.get<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);

    const id = `sup-${String(list.length + 1).padStart(3, '0')}`;
    const newSupplier: Supplier = {
      ...data,
      id,
    };

    list.unshift(newSupplier);
    StorageService.set(STORAGE_KEYS.SUPPLIERS, list);
    return newSupplier;
  },

  _seedSuppliersForTesting(suppliers: Supplier[]): void {
    StorageService.set(STORAGE_KEYS.SUPPLIERS, suppliers);
  },
};
