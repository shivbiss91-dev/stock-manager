import { User } from '../../types/auth';

export interface UserAccount extends User {
  passwordHash: string; // for mock authentication check
  requiresOtp: boolean;
  otpCode?: string;
}

export const MOCK_USERS: UserAccount[] = [
  {
    id: 'usr-001',
    name: 'Rajesh Sharma',
    email: 'admin@stockvista.in',
    role: 'admin',
    roleTitle: 'Managing Director & Owner',
    phone: '+91 98200 12345',
    passwordHash: 'admin123',
    requiresOtp: true,
    otpCode: '123456',
    warehouseId: 'wh-001',
    warehouseName: 'Bhiwandi Central Hub (MH)',
    status: 'active',
    lastLogin: '2026-10-08T09:30:00Z',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    id: 'usr-002',
    name: 'Priya Patel',
    email: 'manager@stockvista.in',
    role: 'manager',
    roleTitle: 'Operations & Inventory Manager',
    phone: '+91 98201 67890',
    passwordHash: 'manager123',
    requiresOtp: false,
    warehouseId: 'wh-001',
    warehouseName: 'Bhiwandi Central Hub (MH)',
    status: 'active',
    lastLogin: '2026-10-08T08:45:00Z',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    id: 'usr-003',
    name: 'Amit Verma',
    email: 'staff@stockvista.in',
    role: 'staff',
    roleTitle: 'Senior Billing & Dispatch Executive',
    phone: '+91 98202 45678',
    passwordHash: 'staff123',
    requiresOtp: false,
    warehouseId: 'wh-002',
    warehouseName: 'Panvel Logistics Depot (MH)',
    status: 'active',
    lastLogin: '2026-10-08T10:15:00Z',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    id: 'usr-004',
    name: 'Sunita Rao',
    email: 'viewer@stockvista.in',
    role: 'viewer',
    roleTitle: 'Internal Auditor & Financial Viewer',
    phone: '+91 98203 11223',
    passwordHash: 'viewer123',
    requiresOtp: false,
    warehouseId: 'all',
    warehouseName: 'All Warehouses (Consolidated)',
    status: 'active',
    lastLogin: '2026-10-07T16:20:00Z',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&h=200&q=80',
  },
];
