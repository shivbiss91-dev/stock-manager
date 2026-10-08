export type ShipmentStatus =
  | 'on_schedule'
  | 'delayed'
  | 'out_for_delivery'
  | 'delivered';

export interface LogisticsHub {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  x: number; // Percentage coordinate on India map SVG (0-100)
  y: number; // Percentage coordinate on India map SVG (0-100)
  isOperational: boolean;
}

export interface ActiveShipment {
  id: string;
  trackingNumber: string;
  ewayBillNumber: string;
  originHub: LogisticsHub;
  destinationHub: LogisticsHub;
  vehicleNumber: string; // e.g. MH-04-AB-1234
  driverName: string;
  driverPhone: string;
  cargoDescription: string;
  weightTons: number;
  departureTime: string;
  estimatedArrival: string;
  status: ShipmentStatus;
  progressPercent: number;
  delayReason?: string;
  delayHours?: number;
}
