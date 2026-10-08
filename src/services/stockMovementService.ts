import { StockMovementRecord, MovementType } from '../types/itemDetail';

export interface MovementFilterOptions {
  itemId?: string;
  type?: MovementType | 'all';
  search?: string;
  startDate?: string;
  endDate?: string;
}

// In-memory records
let movementsDatabase: StockMovementRecord[] = [
  {
    id: 'mov-1',
    itemId: 'item-wd-0001',
    date: '2026-10-08T09:30:00Z',
    type: 'out',
    quantityDelta: -45,
    stockAfter: 140,
    unit: 'sheets',
    userName: 'Amit Verma',
    userRole: 'Billing Staff',
    referenceNumber: 'SO-2026-4401',
    referenceType: 'SO',
    notes: 'Dispatched to Rajdhani Timber Mart (Invoice INV-2026-27-00389)',
  },
  {
    id: 'mov-2',
    itemId: 'item-wd-0001',
    date: '2026-10-06T15:20:00Z',
    type: 'in',
    quantityDelta: 100,
    stockAfter: 185,
    unit: 'sheets',
    userName: 'Suresh Patil',
    userRole: 'Warehouse Master',
    referenceNumber: 'GRN-2026-0089',
    referenceType: 'PO',
    notes: 'Inward lot received from Greenply Industries (PO-2026-0422)',
  },
  {
    id: 'mov-3',
    itemId: 'item-wd-0001',
    date: '2026-10-03T11:15:00Z',
    type: 'transfer',
    quantityDelta: -25,
    stockAfter: 85,
    unit: 'sheets',
    userName: 'Priya Patel',
    userRole: 'Manager',
    referenceNumber: 'TR-2026-031',
    referenceType: 'Transfer',
    notes: 'Inter-hub transfer to Panvel Logistics Depot (Truck MH-04-GP-8842)',
  },
  {
    id: 'mov-4',
    itemId: 'item-wd-0001',
    date: '2026-09-29T14:00:00Z',
    type: 'return',
    quantityDelta: 5,
    stockAfter: 110,
    unit: 'sheets',
    userName: 'Amit Verma',
    userRole: 'Billing Staff',
    referenceNumber: 'CRN-2026-014',
    referenceType: 'Return',
    notes: 'Customer exchange from Shree Ram Hardware Depot (Surface scuff)',
  },
  {
    id: 'mov-5',
    itemId: 'item-wd-0001',
    date: '2026-09-22T17:45:00Z',
    type: 'damage',
    quantityDelta: -2,
    stockAfter: 105,
    unit: 'sheets',
    userName: 'Suresh Patil',
    userRole: 'Warehouse Master',
    referenceNumber: 'DMG-2026-003',
    referenceType: 'Audit',
    notes: 'Forklift corner impact during rack relocation (Bin BHW-A02-S1)',
  },
  {
    id: 'mov-6',
    itemId: 'item-wd-0001',
    date: '2026-09-15T10:00:00Z',
    type: 'adjustment',
    quantityDelta: 4,
    stockAfter: 107,
    unit: 'sheets',
    userName: 'Rajesh Sharma',
    userRole: 'Admin',
    referenceNumber: 'AUD-2026-Q2',
    referenceType: 'Audit',
    notes: 'Quarterly physical verification reconciliation (+4 sheets found unrecorded)',
  },
];

export const stockMovementService = {
  async getMovements(options: MovementFilterOptions = {}): Promise<StockMovementRecord[]> {
    await new Promise((res) => setTimeout(res, 50));
    const { itemId, type, search } = options;

    let list = [...movementsDatabase];

    if (itemId) {
      list = list.filter((m) => m.itemId === itemId);
      // If none exist for this specific item, generate sample realistic movements
      if (list.length === 0) {
        list = generateSampleMovements(itemId);
      }
    }

    if (type && type !== 'all') {
      list = list.filter((m) => m.type === type);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.referenceNumber.toLowerCase().includes(q) ||
          m.notes.toLowerCase().includes(q) ||
          m.userName.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async addMovement(record: Omit<StockMovementRecord, 'id'>): Promise<StockMovementRecord> {
    await new Promise((res) => setTimeout(res, 40));
    const newRecord: StockMovementRecord = {
      ...record,
      id: `mov-${Date.now()}`,
    };
    movementsDatabase.unshift(newRecord);
    return newRecord;
  },
};

function generateSampleMovements(itemId: string): StockMovementRecord[] {
  return [
    {
      id: `mov-${itemId}-1`,
      itemId,
      date: '2026-10-08T10:00:00Z',
      type: 'out',
      quantityDelta: -20,
      stockAfter: 80,
      unit: 'pieces',
      userName: 'Amit Verma',
      userRole: 'Billing Staff',
      referenceNumber: 'SO-2026-4412',
      referenceType: 'SO',
      notes: 'Wholesale client order dispatch',
    },
    {
      id: `mov-${itemId}-2`,
      itemId,
      date: '2026-10-04T14:30:00Z',
      type: 'in',
      quantityDelta: 50,
      stockAfter: 100,
      unit: 'pieces',
      userName: 'Suresh Patil',
      userRole: 'Warehouse Master',
      referenceNumber: 'GRN-2026-0092',
      referenceType: 'PO',
      notes: 'Direct mill shipment receipt',
    },
    {
      id: `mov-${itemId}-3`,
      itemId,
      date: '2026-09-28T16:00:00Z',
      type: 'transfer',
      quantityDelta: -10,
      stockAfter: 50,
      unit: 'pieces',
      userName: 'Priya Patel',
      userRole: 'Manager',
      referenceNumber: 'TR-2026-035',
      referenceType: 'Transfer',
      notes: 'Transferred to Peenya Hub (KA)',
    },
  ];
}
