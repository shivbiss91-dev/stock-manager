import { InventoryItem } from '../types/inventory';

/**
 * Inventory Seed: Empty initial collection for production.
 * Live catalog items are created by authorized users and persisted to storage.
 */
export const MASTER_INVENTORY: InventoryItem[] = [];
