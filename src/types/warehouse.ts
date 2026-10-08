export interface Warehouse {
  id: string;
  code: string;
  name: string;
  state: string;
  stateCode: string; // 2-digit GST state code
  city: string;
  address: string;
  pincode: string;
  contactPerson: string;
  phone: string;
  totalCapacitySqFt: number;
  utilizedCapacityPercent: number;
  totalItemsCount: number;
  totalPieces: number;
  stockValueINR: number;
  isPrimary?: boolean;
}
