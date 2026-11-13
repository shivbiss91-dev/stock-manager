import { User } from '../types/auth';

export interface UserAccount extends User {
  passwordHash: string;
  requiresOtp: boolean;
  otpCode?: string;
}

export const MOCK_USERS: UserAccount[] = [
  {
    id: 'usr-admin-01',
    name: 'Administrator',
    email: 'admin@stockvista.in',
    role: 'admin',
    roleTitle: 'System Administrator',
    phone: '+91 98200 12345',
    passwordHash: 'admin123',
    requiresOtp: false,
    warehouseId: 'all',
    warehouseName: 'All Warehouses',
    status: 'active',
  },
];
