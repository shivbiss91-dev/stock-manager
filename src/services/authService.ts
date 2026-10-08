import { MOCK_USERS, UserAccount } from '../data/users';
import { User, Role, AuthSession } from '../types/auth';

const STORAGE_KEY = 'stockvista_session';

export interface LoginResult {
  requiresOtp: boolean;
  user?: User;
  session?: AuthSession;
  maskedPhone?: string;
}

export const authService = {
  async login(email: string, passwordHash: string): Promise<LoginResult> {
    // Artificial small latency to simulate network API
    await new Promise((res) => setTimeout(res, 200));

    const userAccount = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!userAccount) {
      throw new Error('Invalid email address or user account does not exist.');
    }

    if (userAccount.passwordHash !== passwordHash) {
      throw new Error('Invalid password. Please check your credentials.');
    }

    if (userAccount.status !== 'active') {
      throw new Error('This account has been deactivated. Contact the administrator.');
    }

    if (userAccount.requiresOtp) {
      const phone = userAccount.phone;
      const maskedPhone = phone.replace(/(\+91\s\d{2})\d{4}(\s\d{4})/, '$1****$2');
      return {
        requiresOtp: true,
        user: sanitizeUser(userAccount),
        maskedPhone,
      };
    }

    const session: AuthSession = {
      user: sanitizeUser(userAccount),
      token: `token_${userAccount.id}_${Date.now()}`,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return {
      requiresOtp: false,
      user: session.user,
      session,
    };
  },

  async verifyOtp(email: string, otpCode: string): Promise<AuthSession> {
    await new Promise((res) => setTimeout(res, 250));

    const userAccount = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!userAccount) {
      throw new Error('User not found.');
    }

    if (otpCode !== (userAccount.otpCode || '123456')) {
      throw new Error('Invalid OTP code. Please check and try again.');
    }

    const session: AuthSession = {
      user: sanitizeUser(userAccount),
      token: `token_${userAccount.id}_${Date.now()}`,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  },

  async resendOtp(email: string): Promise<{ success: boolean; message: string }> {
    await new Promise((res) => setTimeout(res, 200));
    return {
      success: true,
      message: 'New OTP has been dispatched to your registered mobile number and email.',
    };
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    await new Promise((res) => setTimeout(res, 200));
    const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      throw new Error('No registered account found with this email.');
    }
    return {
      success: true,
      message: 'A password reset link with instructions has been dispatched to ' + email,
    };
  },

  getCurrentSession(): AuthSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Default to Rajesh Sharma (Admin) for instant preview if no session exists
        const defaultAdmin = MOCK_USERS[0];
        const initialSession: AuthSession = {
          user: sanitizeUser(defaultAdmin),
          token: `token_${defaultAdmin.id}_init`,
          expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSession));
        return initialSession;
      }
      const session = JSON.parse(data) as AuthSession;
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  async switchRole(role: Role): Promise<User> {
    await new Promise((res) => setTimeout(res, 100));
    const targetUser = MOCK_USERS.find((u) => u.role === role) || MOCK_USERS[0];
    const session: AuthSession = {
      user: sanitizeUser(targetUser),
      token: `token_${targetUser.id}_${Date.now()}`,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session.user;
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};

function sanitizeUser(user: UserAccount): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleTitle: user.roleTitle,
    phone: user.phone,
    warehouseId: user.warehouseId,
    warehouseName: user.warehouseName,
    avatar: user.avatar,
    lastLogin: user.lastLogin,
    status: user.status,
  };
}
