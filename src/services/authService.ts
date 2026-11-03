import { User, Role, AuthSession } from '../types/auth';
import { UserAccount } from '../data/users';
import { StorageService, STORAGE_KEYS } from './storageService';

export interface LoginResult {
  requiresOtp: boolean;
  user?: User;
  session?: AuthSession;
  maskedPhone?: string;
}

export interface InitialAdminInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

function sanitizeUser(account: UserAccount): User {
  const { passwordHash, requiresOtp, otpCode, ...clean } = account;
  return clean;
}

export const authService = {
  async hasUsers(): Promise<boolean> {
    const users = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    return users.length > 0;
  },

  async createInitialAdmin(input: InitialAdminInput): Promise<AuthSession> {
    await new Promise((res) => setTimeout(res, 200));

    const existingUsers = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    if (existingUsers.length > 0) {
      throw new Error('Initial administrator account already exists. Please log in with existing credentials.');
    }

    if (!input.name || !input.name.trim()) {
      throw new Error('Administrator full name is required.');
    }
    if (!input.email || !input.email.includes('@')) {
      throw new Error('A valid corporate work email is required.');
    }
    if (!input.password || input.password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    const now = new Date().toISOString();
    const adminUser: UserAccount = {
      id: 'usr-admin-01',
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: 'admin',
      roleTitle: 'System Administrator',
      phone: input.phone?.trim() || '+91 98000 00000',
      passwordHash: input.password,
      requiresOtp: false,
      status: 'active',
      lastLogin: now,
      warehouseId: 'all',
      warehouseName: 'All Facilities',
    };

    StorageService.set(STORAGE_KEYS.USERS, [adminUser]);

    const session: AuthSession = {
      user: sanitizeUser(adminUser),
      token: `token_${adminUser.id}_${Date.now()}`,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
    };

    StorageService.set(STORAGE_KEYS.SESSION, session);
    return session;
  },

  async login(email: string, passwordHash: string): Promise<LoginResult> {
    await new Promise((res) => setTimeout(res, 180));

    const users = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const userAccount = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!userAccount) {
      throw new Error('Invalid email address or user account does not exist.');
    }

    if (userAccount.passwordHash !== passwordHash) {
      throw new Error('Invalid password. Please check your credentials.');
    }

    if (userAccount.status !== 'active') {
      throw new Error('This account has been deactivated. Contact your administrator.');
    }

    if (userAccount.requiresOtp) {
      const phone = userAccount.phone || '+91 99999 99999';
      const maskedPhone = phone.replace(/(\+91\s\d{2})\d{4}(\s\d{4})/, '$1****$2');
      return {
        requiresOtp: true,
        user: sanitizeUser(userAccount),
        maskedPhone,
      };
    }

    // Update lastLogin
    userAccount.lastLogin = new Date().toISOString();
    StorageService.set(STORAGE_KEYS.USERS, users);

    const session: AuthSession = {
      user: sanitizeUser(userAccount),
      token: `token_${userAccount.id}_${Date.now()}`,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
    };

    StorageService.set(STORAGE_KEYS.SESSION, session);
    return {
      requiresOtp: false,
      user: session.user,
      session,
    };
  },

  async verifyOtp(email: string, otpCode: string): Promise<AuthSession> {
    await new Promise((res) => setTimeout(res, 200));

    const users = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const userAccount = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!userAccount) {
      throw new Error('User not found.');
    }

    if (otpCode !== (userAccount.otpCode || '123456')) {
      throw new Error('Invalid OTP code. Please check and try again.');
    }

    userAccount.lastLogin = new Date().toISOString();
    StorageService.set(STORAGE_KEYS.USERS, users);

    const session: AuthSession = {
      user: sanitizeUser(userAccount),
      token: `token_${userAccount.id}_${Date.now()}`,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    };

    StorageService.set(STORAGE_KEYS.SESSION, session);
    return session;
  },

  async resendOtp(email: string): Promise<{ success: boolean; message: string }> {
    await new Promise((res) => setTimeout(res, 150));
    return {
      success: true,
      message: 'A security verification code has been dispatched to your registered mobile and email.',
    };
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    await new Promise((res) => setTimeout(res, 180));
    const users = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      throw new Error('No registered account found with this email address.');
    }
    return {
      success: true,
      message: `Password reset instructions have been dispatched to ${email}`,
    };
  },

  getCurrentSession(): AuthSession | null {
    try {
      const session = StorageService.get<AuthSession | null>(STORAGE_KEYS.SESSION, null);
      if (!session) return null;
      if (Date.now() > session.expiresAt) {
        StorageService.remove(STORAGE_KEYS.SESSION);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  logout(): void {
    StorageService.remove(STORAGE_KEYS.SESSION);
  },

  isDemoSession(): boolean {
    return StorageService.isDemoActive();
  },

  /**
   * Safe check for whether Sweedal – Demo Admin Login is configured and permitted.
   * STRICT SAFETY REQUIREMENTS:
   * 1. Never exposed in production unless explicitly enabled via VITE_ENABLE_DEMO_LOGIN === 'true'
   *    or running in a designated demo showcase host (e.g. github.io demo).
   * 2. In strict production deployments, passwordless demo login is disabled by default.
   * 3. Operates strictly in a sandboxed storage workspace.
   */
  isDemoLoginConfigured(): boolean {
    if (import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'false') {
      return false;
    }
    if (import.meta.env.PROD) {
      if (import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true') {
        return true;
      }
      if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
        return true;
      }
      return false;
    }
    // Permitted in local development & demo environments
    return true;
  },

  /**
   * Sweedal – One-Click Demo Admin Login
   * Immediately launches a separate demo administrator workspace with zero credentials required.
   */
  async loginDemoAdmin(): Promise<AuthSession> {
    if (!this.isDemoLoginConfigured()) {
      throw new Error(
        'Sweedal – Demo Admin Login is disabled in production or this environment is not an enabled demo environment.'
      );
    }

    // Pre-populate isolated demo workspace with realistic sample data
    StorageService.seedDemoWorkspace();

    const demoUser: User = {
      id: 'usr-demo-sweedal-01',
      name: 'Sweedal – Demo Admin',
      email: 'sweedal.demo@stockvista.internal',
      role: 'admin',
      roleTitle: 'Demonstration Administrator (Demo Workspace)',
      phone: '+91 98000 00000',
      status: 'active',
      isDemo: true,
      lastLogin: new Date().toISOString(),
      warehouseId: 'all',
      warehouseName: 'All Demo Facilities',
    };

    const session: AuthSession = {
      user: demoUser,
      token: `demo_sweedal_${Date.now()}`,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
      isDemo: true,
    };

    StorageService.set(STORAGE_KEYS.SESSION, session);
    return session;
  },

  async switchRole(role: Role): Promise<User> {
    const session = this.getCurrentSession();
    if (!session || !session.user) {
      throw new Error('No active session.');
    }

    const updatedUser: User = {
      ...session.user,
      role,
      roleTitle:
        role === 'admin'
          ? 'System Administrator'
          : role === 'manager'
          ? 'Operations Manager'
          : role === 'staff'
          ? 'Billing Staff'
          : 'Auditor & Viewer',
    };

    const updatedSession: AuthSession = {
      ...session,
      user: updatedUser,
    };

    StorageService.set(STORAGE_KEYS.SESSION, updatedSession);
    return updatedUser;
  },
};
