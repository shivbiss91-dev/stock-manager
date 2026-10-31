import { MATERIAL_CATEGORIES } from '../data/materialCategories';
import { MaterialCategory, MaterialCategoryInfo } from '../types/inventory';
import { inventoryService } from './inventoryService';

export interface MaterialTileSummary extends MaterialCategoryInfo {
  itemCount: number;
  totalPieces: number;
  stockValueINR: number;
  lowStockCount: number;
  miniSalesGraph: number[];
  growthPercent: number;
}

// Local mutable category state to support admin renaming
let categoriesState: MaterialCategoryInfo[] = [...MATERIAL_CATEGORIES];

export const materialsService = {
  async getCategories(warehouseId?: string): Promise<MaterialTileSummary[]> {
    await new Promise((res) => setTimeout(res, 30));

    const { items } = await inventoryService.getItems({
      warehouseId,
      pageSize: 5000,
    });

    return categoriesState.map((cat) => {
      const catItems = items.filter((i) => i.materialCategory === cat.id);
      const itemCount = catItems.length;
      const totalPieces = catItems.reduce((acc, curr) => acc + curr.currentStock, 0);
      const stockValueINR = catItems.reduce(
        (acc, curr) => acc + curr.currentStock * curr.costPrice,
        0
      );
      const lowStockCount = catItems.filter(
        (i) => i.stockStatus === 'low_stock' || i.stockStatus === 'out_of_stock'
      ).length;

      // Realistic mini sales sparkline data strictly based on real items
      let miniSalesGraph: number[] = [];
      let growthPercent = 0;

      if (itemCount > 0 && totalPieces > 0) {
        miniSalesGraph = [totalPieces, totalPieces, totalPieces, totalPieces, totalPieces];
        growthPercent = 0;
      }

      return {
        ...cat,
        itemCount,
        totalPieces,
        stockValueINR,
        lowStockCount,
        miniSalesGraph,
        growthPercent,
      };
    });
  },

  async getCategoryById(id: MaterialCategory): Promise<MaterialCategoryInfo | null> {
    await new Promise((res) => setTimeout(res, 20));
    const cat = categoriesState.find((c) => c.id === id);
    return cat ? { ...cat } : null;
  },

  async updateCategoryName(id: MaterialCategory, newName: string): Promise<MaterialCategoryInfo> {
    await new Promise((res) => setTimeout(res, 30));
    const idx = categoriesState.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Category not found');

    categoriesState[idx] = {
      ...categoriesState[idx],
      name: newName.trim(),
    };
    return { ...categoriesState[idx] };
  },
};
