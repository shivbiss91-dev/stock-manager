import { MOCK_WAREHOUSES } from '../data/warehouses';
import { Warehouse } from '../types/warehouse';

export const warehouseService = {
  async getWarehouses(): Promise<Warehouse[]> {
    await new Promise((res) => setTimeout(res, 100));
    return [...MOCK_WAREHOUSES];
  },

  async getWarehouseById(id: string): Promise<Warehouse | null> {
    await new Promise((res) => setTimeout(res, 80));
    const wh = MOCK_WAREHOUSES.find((w) => w.id === id);
    return wh ? { ...wh } : null;
  },
};
