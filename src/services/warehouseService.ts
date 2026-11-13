import { Warehouse } from '../types/warehouse';
import { StorageService, STORAGE_KEYS } from './storageService';

export const warehouseService = {
  async getWarehouses(): Promise<Warehouse[]> {
    await new Promise((res) => setTimeout(res, 40));
    return StorageService.get<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, []);
  },

  async getWarehouseById(id: string): Promise<Warehouse | null> {
    await new Promise((res) => setTimeout(res, 30));
    const list = StorageService.get<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, []);
    const wh = list.find((w) => w.id === id);
    return wh ? { ...wh } : null;
  },

  async createWarehouse(
    data: Omit<Warehouse, 'id' | 'totalItemsCount' | 'totalPieces' | 'stockValueINR' | 'utilizedCapacityPercent'>
  ): Promise<Warehouse> {
    await new Promise((res) => setTimeout(res, 60));
    const list = StorageService.get<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, []);

    // Check duplicate code
    if (list.some((w) => w.code.toLowerCase() === data.code.trim().toLowerCase())) {
      throw new Error(`A warehouse with code "${data.code}" already exists.`);
    }

    const id = `wh-${String(list.length + 1).padStart(3, '0')}`;
    const newWarehouse: Warehouse = {
      ...data,
      id,
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      totalItemsCount: 0,
      totalPieces: 0,
      stockValueINR: 0,
      utilizedCapacityPercent: 0,
      isPrimary: data.isPrimary ?? (list.length === 0),
    };

    list.push(newWarehouse);
    StorageService.set(STORAGE_KEYS.WAREHOUSES, list);
    return newWarehouse;
  },

  async updateWarehouse(id: string, patch: Partial<Warehouse>): Promise<Warehouse> {
    await new Promise((res) => setTimeout(res, 50));
    const list = StorageService.get<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, []);
    const wh = list.find((w) => w.id === id);
    if (!wh) throw new Error('Warehouse not found');

    Object.assign(wh, patch);
    StorageService.set(STORAGE_KEYS.WAREHOUSES, list);
    return { ...wh };
  },

  _seedWarehousesForTesting(warehouses: Warehouse[]): void {
    StorageService.set(STORAGE_KEYS.WAREHOUSES, warehouses);
  },
};
