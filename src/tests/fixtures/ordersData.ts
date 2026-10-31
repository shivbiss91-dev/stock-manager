import { OrderHistoryItem, OrderProgressStatus } from '../../types/sales';
import { MOCK_CUSTOMERS } from './customers';

export interface OrdersStatusSummary {
  status: OrderProgressStatus;
  label: string;
  count: number;
  totalAmountINR: number;
  percentage: number;
  colorClass: string;
  texturePattern: string;
}

export const MOCK_ORDERS_STATUS_BREAKDOWN: OrdersStatusSummary[] = [
  {
    status: 'completed',
    label: 'Completed & Delivered',
    count: 368,
    totalAmountINR: 48250000, // ₹4.82 Cr
    percentage: 69.2,
    colorClass: 'bg-emerald-500 text-emerald-500',
    texturePattern: 'bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:6px_6px]',
  },
  {
    status: 'in_progress',
    label: 'In Progress / Transit',
    count: 94,
    totalAmountINR: 12450000, // ₹1.24 Cr
    percentage: 17.7,
    colorClass: 'bg-blue-500 text-blue-500',
    texturePattern: 'bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:6px_6px]',
  },
  {
    status: 'overdue',
    label: 'Payment Overdue',
    count: 48,
    totalAmountINR: 5850000, // ₹58.5 L
    percentage: 9.0,
    colorClass: 'bg-rose-500 text-rose-500',
    texturePattern: 'bg-[radial-gradient(#EF4444_1px,transparent_1px)] [background-size:6px_6px]',
  },
  {
    status: 'returned',
    label: 'Returns / Credit Notes',
    count: 22,
    totalAmountINR: 2250000, // ₹22.5 L
    percentage: 4.1,
    colorClass: 'bg-amber-500 text-amber-500',
    texturePattern: 'bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:6px_6px]',
  },
];

export const MOCK_ORDER_HISTORY: OrderHistoryItem[] = [
  {
    id: 'ord-hist-1',
    orderNumber: 'SO-2026-4401',
    invoiceNumber: 'INV-2026-27-00389',
    customerName: 'Rajdhani Timber Mart (Bhopal)',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    date: '2026-10-08T11:45:00Z',
    itemsCount: 140,
    primaryItemName: 'Gurjan BWP Marine Plywood 18mm',
    amountINR: 345000,
    status: 'completed',
  },
  {
    id: 'ord-hist-2',
    orderNumber: 'SO-2026-4402',
    invoiceNumber: 'INV-2026-27-00390',
    customerName: 'Kalyan Building Solutions (Surat)',
    city: 'Surat',
    state: 'Gujarat',
    date: '2026-10-08T10:20:00Z',
    itemsCount: 85,
    primaryItemName: 'Tata Tiscon TMT Fe550D Reinforcement Rods',
    amountINR: 680000,
    status: 'in_progress',
  },
  {
    id: 'ord-hist-3',
    orderNumber: 'SO-2026-4403',
    invoiceNumber: 'INV-2026-27-00391',
    customerName: 'Apex Interiors & Furnishings (Bengaluru)',
    city: 'Bengaluru',
    state: 'Karnataka',
    date: '2026-10-08T09:15:00Z',
    itemsCount: 220,
    primaryItemName: 'Action TESA Pre-lam HDHMR Board 12mm',
    amountINR: 412500,
    status: 'completed',
  },
  {
    id: 'ord-hist-4',
    orderNumber: 'SO-2026-4404',
    invoiceNumber: 'INV-2026-27-00392',
    customerName: 'Balaji Contractors & Wholesale Hub (Delhi)',
    city: 'New Delhi',
    state: 'Delhi',
    date: '2026-10-07T16:40:00Z',
    itemsCount: 45,
    primaryItemName: 'Saint-Gobain Planilaque Extra Clear Glass',
    amountINR: 520000,
    status: 'overdue',
  },
  {
    id: 'ord-hist-5',
    orderNumber: 'SO-2026-4405',
    invoiceNumber: 'INV-2026-27-00393',
    customerName: 'Shree Ram Hardware Depot (Pune)',
    city: 'Pune',
    state: 'Maharashtra',
    date: '2026-10-07T14:10:00Z',
    itemsCount: 300,
    primaryItemName: 'Supreme Schedule 80 Industrial PVC 110mm',
    amountINR: 285000,
    status: 'completed',
  },
  {
    id: 'ord-hist-6',
    orderNumber: 'SO-2026-4406',
    invoiceNumber: 'INV-2026-27-00394',
    customerName: 'Metro Packaging Systems LLP (Hyderabad)',
    city: 'Hyderabad',
    state: 'Telangana',
    date: '2026-10-07T11:05:00Z',
    itemsCount: 180,
    primaryItemName: 'ITC CyberXL Pac Duplex Packaging Board',
    amountINR: 390000,
    status: 'returned',
  },
  {
    id: 'ord-hist-7',
    orderNumber: 'SO-2026-4407',
    invoiceNumber: 'INV-2026-27-00395',
    customerName: 'Crown Glass & Glazing Works (Jaipur)',
    city: 'Jaipur',
    state: 'Rajasthan',
    date: '2026-10-06T17:20:00Z',
    itemsCount: 60,
    primaryItemName: 'Modiguard Toughened Safety Glass 8mm',
    amountINR: 310000,
    status: 'in_progress',
  },
];
