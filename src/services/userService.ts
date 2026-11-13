import { User, Role, AppPermissionModule, DEFAULT_ROLE_MODULES, AuthSession } from '../types/auth';
import { UserAccount } from '../data/users';
import { StorageService, STORAGE_KEYS } from './storageService';
import { auditLogService } from './auditLogService';

function sanitizeUser(account: UserAccount): User {
  const { passwordHash, requiresOtp, otpCode, ...clean } = account;
  return clean;
}

export const userService = {
  async getUsers(): Promise<User[]> {
    await new Promise((res) => setTimeout(res, 30));
    const accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    return accounts.map(sanitizeUser);
  },

  async getUserById(id: string): Promise<User | null> {
    const accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const user = accounts.find((u) => u.id === id);
    return user ? sanitizeUser(user) : null;
  },

  getUserByIdSync(id: string): User | null {
    try {
      const accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
      const user = accounts.find((u) => u.id === id);
      return user ? sanitizeUser(user) : null;
    } catch {
      return null;
    }
  },

  async updateUserRole(id: string, newRole: Role, adminUser?: User): Promise<User> {
    await new Promise((res) => setTimeout(res, 40));
    
    // Security check: staff cannot elevate roles
    if (adminUser && adminUser.role !== 'admin') {
      throw new Error('Unauthorized. Only administrators can modify roles and permissions.');
    }

    const accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const user = accounts.find((u) => u.id === id);
    if (!user) throw new Error('User not found');

    const oldRole = user.role;
    user.role = newRole;
    user.roleTitle =
      newRole === 'admin'
        ? 'System Administrator'
        : newRole === 'manager'
        ? 'Operations Manager'
        : newRole === 'staff'
        ? 'Billing Staff'
        : 'Auditor & Viewer';

    // If no custom permissions assigned, update to new role's defaults
    if (!user.permissions) {
      user.permissions = [...DEFAULT_ROLE_MODULES[newRole]];
    }

    StorageService.set(STORAGE_KEYS.USERS, accounts);

    // Update active session if target user is currently logged in
    const activeSession = StorageService.get<AuthSession | null>(STORAGE_KEYS.SESSION, null);
    if (activeSession && activeSession.user.id === id) {
      activeSession.user.role = user.role;
      activeSession.user.roleTitle = user.roleTitle;
      activeSession.user.permissions = user.permissions;
      StorageService.set(STORAGE_KEYS.SESSION, activeSession);
    }

    // Audit log
    try {
      await auditLogService.logAction({
        userId: adminUser?.id || 'admin',
        userName: adminUser?.name || 'Administrator',
        userRole: adminUser?.role || 'admin',
        action: 'settings_updated',
        module: 'Security',
        targetId: user.id,
        targetDescription: `Role updated for ${user.name} (${user.email})`,
        oldValue: `Role: ${oldRole}`,
        newValue: `Role: ${newRole} (${user.roleTitle})`,
      });
    } catch {}

    return sanitizeUser(user);
  },

  async updateUserPermissions(
    id: string,
    permissions: AppPermissionModule[],
    adminUser?: User
  ): Promise<User> {
    await new Promise((res) => setTimeout(res, 40));

    // Security check
    if (adminUser && adminUser.role !== 'admin') {
      throw new Error('Unauthorized. Only administrators can modify staff permissions.');
    }

    const accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const user = accounts.find((u) => u.id === id);
    if (!user) throw new Error('User not found');

    const previousPerms = user.permissions || DEFAULT_ROLE_MODULES[user.role] || [];
    user.permissions = [...permissions];

    StorageService.set(STORAGE_KEYS.USERS, accounts);

    // Synchronize active session if this user is logged in
    const activeSession = StorageService.get<AuthSession | null>(STORAGE_KEYS.SESSION, null);
    if (activeSession && activeSession.user.id === id) {
      activeSession.user.permissions = user.permissions;
      StorageService.set(STORAGE_KEYS.SESSION, activeSession);
    }

    // Audit log
    try {
      await auditLogService.logAction({
        userId: adminUser?.id || 'admin',
        userName: adminUser?.name || 'Administrator',
        userRole: adminUser?.role || 'admin',
        action: 'settings_updated',
        module: 'Security',
        targetId: user.id,
        targetDescription: `Permissions customized for ${user.name} (${user.email})`,
        oldValue: `${previousPerms.length} modules granted`,
        newValue: `${permissions.length} modules granted: [${permissions.join(', ')}]`,
      });
    } catch {}

    return sanitizeUser(user);
  },

  async toggleUserStatus(id: string): Promise<User> {
    await new Promise((res) => setTimeout(res, 40));
    const accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const user = accounts.find((u) => u.id === id);
    if (!user) throw new Error('User not found');

    user.status = user.status === 'active' ? 'suspended' : 'active';
    StorageService.set(STORAGE_KEYS.USERS, accounts);

    // If suspended/deactivated, revoke active session
    if (user.status !== 'active') {
      const activeSession = StorageService.get<AuthSession | null>(STORAGE_KEYS.SESSION, null);
      if (activeSession && activeSession.user.id === id) {
        StorageService.remove(STORAGE_KEYS.SESSION);
      }
    }

    return sanitizeUser(user);
  },

  async deactivateUser(id: string, adminUser?: User): Promise<User> {
    await new Promise((res) => setTimeout(res, 40));

    if (adminUser && adminUser.role !== 'admin') {
      throw new Error('Unauthorized. Only administrators can deactivate accounts.');
    }

    if (adminUser && adminUser.id === id) {
      throw new Error('You cannot deactivate your own active administrative account.');
    }

    const accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const user = accounts.find((u) => u.id === id);
    if (!user) throw new Error('User not found');

    user.status = 'deactivated';
    StorageService.set(STORAGE_KEYS.USERS, accounts);

    // Immediately revoke any active session for this user
    const activeSession = StorageService.get<AuthSession | null>(STORAGE_KEYS.SESSION, null);
    if (activeSession && activeSession.user.id === id) {
      StorageService.remove(STORAGE_KEYS.SESSION);
    }

    // Audit log
    try {
      await auditLogService.logAction({
        userId: adminUser?.id || 'admin',
        userName: adminUser?.name || 'Administrator',
        userRole: adminUser?.role || 'admin',
        action: 'settings_updated',
        module: 'Security',
        targetId: user.id,
        targetDescription: `Staff account DEACTIVATED for ${user.name} (${user.email})`,
        oldValue: 'Status: active',
        newValue: 'Status: deactivated (logins blocked, active sessions revoked)',
      });
    } catch {}

    return sanitizeUser(user);
  },

  async reactivateUser(id: string, adminUser?: User): Promise<User> {
    await new Promise((res) => setTimeout(res, 40));

    if (adminUser && adminUser.role !== 'admin') {
      throw new Error('Unauthorized. Only administrators can reactivate accounts.');
    }

    const accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const user = accounts.find((u) => u.id === id);
    if (!user) throw new Error('User not found');

    user.status = 'active';
    StorageService.set(STORAGE_KEYS.USERS, accounts);

    try {
      await auditLogService.logAction({
        userId: adminUser?.id || 'admin',
        userName: adminUser?.name || 'Administrator',
        userRole: adminUser?.role || 'admin',
        action: 'settings_updated',
        module: 'Security',
        targetId: user.id,
        targetDescription: `Staff account REACTIVATED for ${user.name} (${user.email})`,
        oldValue: 'Status: deactivated',
        newValue: 'Status: active (access restored)',
      });
    } catch {}

    return sanitizeUser(user);
  },

  async approveUser(id: string, adminUser?: User): Promise<User> {
    await new Promise((res) => setTimeout(res, 40));

    if (adminUser && adminUser.role !== 'admin') {
      throw new Error('Unauthorized. Only administrators can approve accounts.');
    }

    const accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const user = accounts.find((u) => u.id === id);
    if (!user) throw new Error('User not found');

    user.status = 'active';
    StorageService.set(STORAGE_KEYS.USERS, accounts);

    try {
      await auditLogService.logAction({
        userId: adminUser?.id || 'admin',
        userName: adminUser?.name || 'Administrator',
        userRole: adminUser?.role || 'admin',
        action: 'settings_updated',
        module: 'Security',
        targetId: user.id,
        targetDescription: `Staff registration APPROVED for ${user.name} (${user.email})`,
        oldValue: 'Status: pending_approval',
        newValue: 'Status: active',
      });
    } catch {}

    return sanitizeUser(user);
  },

  async rejectUser(id: string, adminUser?: User): Promise<User> {
    await new Promise((res) => setTimeout(res, 40));

    const accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const user = accounts.find((u) => u.id === id);
    if (!user) throw new Error('User not found');

    user.status = 'deactivated';
    StorageService.set(STORAGE_KEYS.USERS, accounts);

    try {
      await auditLogService.logAction({
        userId: adminUser?.id || 'admin',
        userName: adminUser?.name || 'Administrator',
        userRole: adminUser?.role || 'admin',
        action: 'settings_updated',
        module: 'Security',
        targetId: user.id,
        targetDescription: `Staff registration REJECTED for ${user.name} (${user.email})`,
        oldValue: 'Status: pending_approval',
        newValue: 'Status: deactivated',
      });
    } catch {}

    return sanitizeUser(user);
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
      permissions: userData.permissions || [...DEFAULT_ROLE_MODULES[userData.role]],
      loginMethod: userData.loginMethod || 'email_password',
      preferredLoginMethod: userData.preferredLoginMethod || userData.loginMethod || 'email_password',
      createdAt: new Date().toISOString(),
    };

    accounts.push(newAccount);
    StorageService.set(STORAGE_KEYS.USERS, accounts);

    return sanitizeUser(newAccount);
  },

  async deleteUser(id: string, adminUser?: User): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 40));
    if (adminUser && adminUser.id === id) {
      throw new Error('You cannot delete your own administrative account.');
    }

    let accounts = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const target = accounts.find((u) => u.id === id);
    if (!target) return false;

    accounts = accounts.filter((u) => u.id !== id);
    StorageService.set(STORAGE_KEYS.USERS, accounts);

    // If active session belongs to deleted user, clear it
    const activeSession = StorageService.get<AuthSession | null>(STORAGE_KEYS.SESSION, null);
    if (activeSession && activeSession.user.id === id) {
      StorageService.remove(STORAGE_KEYS.SESSION);
    }

    try {
      await auditLogService.logAction({
        userId: adminUser?.id || 'admin',
        userName: adminUser?.name || 'Administrator',
        userRole: adminUser?.role || 'admin',
        action: 'settings_updated',
        module: 'Security',
        targetId: id,
        targetDescription: `Staff account deleted: ${target.name} (${target.email})`,
      });
    } catch {}

    return true;
  },

  /**
   * Helper for test suites to seed test user accounts
   */
  _seedUsersForTesting(testUsers: UserAccount[]): void {
    StorageService.set(STORAGE_KEYS.USERS, testUsers);
  },
};
