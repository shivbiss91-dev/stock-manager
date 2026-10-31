import { User } from '../types/auth';

export interface UserAccount extends User {
  passwordHash: string;
  requiresOtp: boolean;
  otpCode?: string;
}

/**
 * Users Seed: Empty initial collection for production.
 * Initial administrator profile is created explicitly during the first-time setup process.
 */
export const MOCK_USERS: UserAccount[] = [];
