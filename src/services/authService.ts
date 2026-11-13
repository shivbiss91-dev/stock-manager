import { User, Role, AuthSession, DEFAULT_ROLE_MODULES, LoginMethod } from '../types/auth';
import { UserAccount } from '../data/users';
import { StorageService, STORAGE_KEYS } from './storageService';
import { auditLogService } from './auditLogService';

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

// Temporary in-memory phone OTP store for active sessions
const phoneOtpStore = new Map<string, { code: string; expiresAt: number; phone: string }>();

export const authService = {
  async hasUsers(): Promise<boolean> {
    let users = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    if (!users || users.length === 0) {
      StorageService.set(STORAGE_KEYS.USERS, MOCK_USERS);
      return true;
    }
    return true;
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
      permissions: [...DEFAULT_ROLE_MODULES.admin],
      loginMethod: 'email_password',
      preferredLoginMethod: 'email_password',
      createdAt: now,
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

    let users = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    if (!users || users.length === 0) {
      StorageService.set(STORAGE_KEYS.USERS, MOCK_USERS);
      users = MOCK_USERS;
    }
    const userAccount = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!userAccount) {
      throw new Error('Invalid email address or user account does not exist.');
    }

    if (userAccount.passwordHash !== passwordHash) {
      throw new Error('Invalid password. Please check your credentials.');
    }

    if (userAccount.status === 'deactivated' || userAccount.status === 'suspended') {
      throw new Error('Your account has been deactivated by the administrator. Access is blocked.');
    }

    if (userAccount.status === 'pending_approval') {
      throw new Error('Your account is pending administrator approval. Please contact your administrator.');
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

    // Update lastLogin & preferredLoginMethod
    userAccount.lastLogin = new Date().toISOString();
    userAccount.preferredLoginMethod = 'email_password';
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

  /**
   * Gmail / Google OAuth Staff Authentication & Registration
   */
  async loginWithGoogle(email: string, name?: string, role: Role = 'staff'): Promise<AuthSession> {
    await new Promise((res) => setTimeout(res, 200));

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Valid Google/Gmail account email is required.');
    }

    const users = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    let userAccount = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (userAccount) {
      // Existing staff
      if (userAccount.status === 'deactivated' || userAccount.status === 'suspended') {
        throw new Error('Your account has been deactivated by the administrator. Access is blocked.');
      }
      if (userAccount.status === 'pending_approval') {
        throw new Error('Your account is pending administrator approval. Please contact your administrator.');
      }

      userAccount.lastLogin = new Date().toISOString();
      userAccount.preferredLoginMethod = 'google';
      if (!userAccount.loginMethod) userAccount.loginMethod = 'google';
      StorageService.set(STORAGE_KEYS.USERS, users);
    } else {
      // New staff registration via Google
      const id = `usr-g-${Date.now().toString().slice(-5)}`;
      const now = new Date().toISOString();
      const displayName = name?.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ');

      userAccount = {
        id,
        name: displayName,
        email: cleanEmail,
        role,
        roleTitle:
          role === 'admin'
            ? 'System Administrator'
            : role === 'manager'
            ? 'Operations Manager'
            : 'Billing Staff',
        phone: '+91 98000 00000',
        passwordHash: 'google_oauth_auth_token',
        requiresOtp: false,
        status: 'active',
        lastLogin: now,
        warehouseId: 'wh-001',
        warehouseName: 'Main Warehouse',
        permissions: [...DEFAULT_ROLE_MODULES[role]],
        loginMethod: 'google',
        preferredLoginMethod: 'google',
        createdAt: now,
      };

      users.push(userAccount);
      StorageService.set(STORAGE_KEYS.USERS, users);

      try {
        await auditLogService.logAction({
          userId: id,
          userName: displayName,
          userRole: role,
          action: 'settings_updated',
          module: 'Security',
          targetId: id,
          targetDescription: `Staff registered via Google OAuth: ${displayName} (${cleanEmail})`,
          newValue: `Verified Login Method: Gmail / Google OAuth`,
        });
      } catch {}
    }

    const session: AuthSession = {
      user: sanitizeUser(userAccount),
      token: `token_g_${userAccount.id}_${Date.now()}`,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    };

    StorageService.set(STORAGE_KEYS.SESSION, session);
    return session;
  },

  /**
   * Phone Number OTP Dispatch for Staff Authentication
   */
  async sendPhoneOtp(
    phone: string
  ): Promise<{ success: boolean; otpCode: string; message: string; isNewUser: boolean }> {
    await new Promise((res) => setTimeout(res, 180));

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    const users = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    const digits = cleanPhone.replace(/\D/g, '').slice(-10);
    const existing = users.find((u) => u.phone.replace(/\D/g, '').endsWith(digits));

    if (existing && (existing.status === 'deactivated' || existing.status === 'suspended')) {
      throw new Error('This account has been deactivated by the administrator. Login is blocked.');
    }

    // Default fast OTP for seamless demonstration and testing
    const otpCode = '123456';
    phoneOtpStore.set(digits, {
      code: otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
      phone: cleanPhone,
    });

    return {
      success: true,
      otpCode,
      message: `Security OTP sent to ${cleanPhone}. (Use OTP: ${otpCode})`,
      isNewUser: !existing,
    };
  },

  /**
   * Verify Phone OTP for Staff Authentication & Registration
   */
  async verifyPhoneOtp(
    phone: string,
    otpCode: string,
    name?: string,
    role: Role = 'staff'
  ): Promise<AuthSession> {
    await new Promise((res) => setTimeout(res, 200));

    const cleanPhone = phone.trim();
    const digits = cleanPhone.replace(/\D/g, '').slice(-10);

    if (otpCode.trim() !== '123456') {
      const stored = phoneOtpStore.get(digits);
      if (!stored || stored.code !== otpCode.trim() || Date.now() > stored.expiresAt) {
        throw new Error('Invalid or expired OTP code. Please try again.');
      }
    }

    const users = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
    let userAccount = users.find((u) => u.phone.replace(/\D/g, '').endsWith(digits));

    if (userAccount) {
      // Existing user
      if (userAccount.status === 'deactivated' || userAccount.status === 'suspended') {
        throw new Error('Your account has been deactivated by the administrator. Access is blocked.');
      }
      if (userAccount.status === 'pending_approval') {
        throw new Error('Your account is pending administrator approval. Please contact your administrator.');
      }

      userAccount.lastLogin = new Date().toISOString();
      userAccount.preferredLoginMethod = 'phone_otp';
      if (!userAccount.loginMethod) userAccount.loginMethod = 'phone_otp';
      StorageService.set(STORAGE_KEYS.USERS, users);
    } else {
      // New staff registration via Phone/OTP
      const id = `usr-p-${Date.now().toString().slice(-5)}`;
      const now = new Date().toISOString();
      const displayName = name?.trim() || `Staff ${digits.slice(-4)}`;
      const generatedEmail = `staff.${digits}@stockvista.internal`;

      userAccount = {
        id,
        name: displayName,
        email: generatedEmail,
        role,
        roleTitle:
          role === 'admin'
            ? 'System Administrator'
            : role === 'manager'
            ? 'Operations Manager'
            : 'Billing Staff',
        phone: cleanPhone.startsWith('+91') ? cleanPhone : `+91 ${cleanPhone}`,
        passwordHash: 'phone_otp_auth_token',
        requiresOtp: false,
        status: 'active',
        lastLogin: now,
        warehouseId: 'wh-001',
        warehouseName: 'Main Warehouse',
        permissions: [...DEFAULT_ROLE_MODULES[role]],
        loginMethod: 'phone_otp',
        preferredLoginMethod: 'phone_otp',
        createdAt: now,
      };

      users.push(userAccount);
      StorageService.set(STORAGE_KEYS.USERS, users);

      try {
        await auditLogService.logAction({
          userId: id,
          userName: displayName,
          userRole: role,
          action: 'settings_updated',
          module: 'Security',
          targetId: id,
          targetDescription: `Staff registered via Phone / OTP: ${displayName} (${cleanPhone})`,
          newValue: `Verified Login Method: Phone / OTP`,
        });
      } catch {}
    }

    phoneOtpStore.delete(digits);

    const session: AuthSession = {
      user: sanitizeUser(userAccount),
      token: `token_p_${userAccount.id}_${Date.now()}`,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    };

    StorageService.set(STORAGE_KEYS.SESSION, session);
    return session;
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

      // If user account in users table is deactivated, revoke immediately
      if (!session.isDemo) {
        const users = StorageService.get<UserAccount[]>(STORAGE_KEYS.USERS, []);
        const account = users.find((u) => u.id === session.user.id);
        if (account && (account.status === 'deactivated' || account.status === 'suspended')) {
          StorageService.remove(STORAGE_KEYS.SESSION);
          return null;
        }
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

  isDemoLoginConfigured(): boolean {
    if (import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'false') {
      return false;
    }
    if (import.meta.env.PROD) {
      if (import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true') {
        return true;
      }
      if (
        typeof window !== 'undefined' &&
        (window.location.hostname.endsWith('github.io') ||
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1')
      ) {
        return true;
      }
      return false;
    }
    return true;
  },

  async loginDemoAdmin(): Promise<AuthSession> {
    if (!this.isDemoLoginConfigured()) {
      throw new Error(
        'Sweedal – Demo Admin Login is disabled in production or this environment is not an enabled demo environment.'
      );
    }

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
      permissions: [...DEFAULT_ROLE_MODULES.admin],
    };

    const session: AuthSession = {
      user: demoUser,
      token: `demo_sweedal_${Date.now()}`,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
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
      permissions: [...DEFAULT_ROLE_MODULES[role]],
    };

    const updatedSession: AuthSession = {
      ...session,
      user: updatedUser,
    };

    StorageService.set(STORAGE_KEYS.SESSION, updatedSession);
    return updatedUser;
  },
};
