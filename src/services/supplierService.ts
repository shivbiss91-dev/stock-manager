import { Supplier } from '../types/sales';
import { MOCK_SUPPLIERS } from '../data/suppliers';

let suppliersDatabase: Supplier[] = [...MOCK_SUPPLIERS];

export const supplierService = {
  async getSuppliers(category?: string): Promise<Supplier[]> {
    await new Promise((res) => setTimeout(res, 40));
    if (!category || category === 'all') {
      return [...suppliersDatabase];
    }
    return suppliersDatabase.filter((s) => s.category.toLowerCase() === category.toLowerCase());
  },

  async getSupplierById(id: string): Promise<Supplier | null> {
    await new Promise((res) => setTimeout(res, 30));
    const found = suppliersDatabase.find((s) => s.id === id);
    return found ? { ...found } : null;
  },
};
