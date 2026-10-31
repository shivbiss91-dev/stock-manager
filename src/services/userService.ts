import { User, Role } from '../types/auth';
import { UserAccount } from '../data/users';
import { StorageService, STORAGE_KEYS } from './storageService';

export const userService = {
  async getUsers(): Promise<User[]> {
    await new Promise((res) => setTimeout(res, 30));
    const accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    return accounts.map(({ passwordHash, requiresOtp, otpCode, ...clean }) => clean);
  },

  async updateUserRole(id: string, newRole: Role): Promise<User> {
    await new Promise((res) => setTimeout(res, 40));
    const accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const user = accounts.find((u) => u.id === id);
    if (!user) throw new Error('User not found');

    user.role = newRole;
    user.roleTitle =
      newRole === 'admin'
        ? 'System Administrator'
        : newRole === 'manager'
        ? 'Operations Manager'
        : newRole === 'staff'
        ? 'Billing Staff'
        : 'Auditor & Viewer';

    StorageService.set(STORAGE_KEYS.USERS, accounts);
    const { passwordHash, requiresOtp, otpCode, ...clean } = user;
    return clean;
  },

  async toggleUserStatus(id: string): Promise<User> {
    await new Promise((res) => setTimeout(res, 40));
    const accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const user = accounts.find((u) => u.id === id);
    if (!user) throw new Error('User not found');

    user.status = user.status === 'active' ? 'suspended' : 'active';
    StorageService.set(STORAGE_KEYS.USERS, accounts);

    const { passwordHash, requiresOtp, otpCode, ...clean } = user;
    return clean;
  },

  async createUser(userData: Omit<User, 'id'> & { password?: string }): Promise<User> {
    await new Promise((res) => setTimeout(res, 50));
    const accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);

    // Check duplicate email
    const exists = accounts.some((u) => u.email.toLowerCase() === userData.email.trim().toLowerCase());
    if (exists) {
      throw new Error(`An account with email "${userData.email}" already exists.`);
    }

    const id = `usr-${String(accounts.length + 1).padStart(3, '0')}`;
    const newAccount: UserAccount = {
      ...userData,
      id,
      passwordHash: userData.password || 'password123',
      requiresOtp: false,
      lastLogin: new Date().toISOString(),
    };

    accounts.push(newAccount);
    StorageService.set(STORAGE_KEYS.USERS, accounts);

    const { passwordHash, requiresOtp, otpCode, ...clean } = newAccount;
    return clean;
  },

  /**
   * Helper for test suites to seed test user accounts
   */
  _seedUsersForTesting(testUsers: UserAccount[]): void {
    StorageService.set(STORAGE_KEYS.USERS, testUsers);
  },
};
