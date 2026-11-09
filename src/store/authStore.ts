import { create } from 'zustand';
import {
  User,
  Role,
  AuthSession,
  ROLE_PERMISSIONS,
  PermissionAction,
  AppPermissionModule,
  hasModuleAccess,
} from '../types/auth';
import { authService } from '../services/authService';

interface AuthStore {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  otpPendingEmail: string | null;
  otpMaskedPhone: string | null;

  login: (email: string, passwordHash: string) => Promise<{ requiresOtp: boolean }>;
  loginWithGoogle: (email: string, name?: string, role?: Role) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<{ otpCode: string; isNewUser: boolean; message: string }>;
  verifyPhoneOtp: (phone: string, otpCode: string, name?: string, role?: Role) => Promise<void>;
  loginDemoAdmin: () => Promise<void>;
  createInitialAdmin: (input: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  verifyOtp: (otpCode: string) => Promise<void>;
  resendOtp: () => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  logout: () => void;
  switchRole: (role: Role) => Promise<void>;
  hasPermission: (permission: PermissionAction) => boolean;
  hasModulePermission: (module: AppPermissionModule) => boolean;
  clearError: () => void;
  cancelOtp: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => {
  // Initialize with persisted session if available
  const existingSession = authService.getCurrentSession();

  return {
    user: existingSession?.user || null,
    session: existingSession,
    isAuthenticated: !!existingSession,
    isLoading: false,
    error: null,
    otpPendingEmail: null,
    otpMaskedPhone: null,

    login: async (email: string, passwordHash: string) => {
      set({ isLoading: true, error: null });
      try {
        const result = await authService.login(email, passwordHash);
        if (result.requiresOtp) {
          set({
            isLoading: false,
            otpPendingEmail: email,
            otpMaskedPhone: result.maskedPhone || null,
          });
          return { requiresOtp: true };
        } else if (result.session && result.user) {
          set({
            user: result.user,
            session: result.session,
            isAuthenticated: true,
            isLoading: false,
            otpPendingEmail: null,
            otpMaskedPhone: null,
          });
          return { requiresOtp: false };
        }
        return { requiresOtp: false };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    loginWithGoogle: async (email: string, name?: string, role: Role = 'staff') => {
      set({ isLoading: true, error: null });
      try {
        const session = await authService.loginWithGoogle(email, name, role);
        set({
          user: session.user,
          session,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Google sign-in failed.';
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    sendPhoneOtp: async (phone: string) => {
      set({ isLoading: true, error: null });
      try {
        const result = await authService.sendPhoneOtp(phone);
        set({ isLoading: false });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send OTP.';
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    verifyPhoneOtp: async (phone: string, otpCode: string, name?: string, role: Role = 'staff') => {
      set({ isLoading: true, error: null });
      try {
        const session = await authService.verifyPhoneOtp(phone, otpCode, name, role);
        set({
          user: session.user,
          session,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid OTP code.';
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    loginDemoAdmin: async () => {
      set({ isLoading: true, error: null });
      try {
        const session = await authService.loginDemoAdmin();
        set({
          user: session.user,
          session,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Demo login failed.';
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    createInitialAdmin: async (input: { name: string; email: string; phone: string; password: string }) => {
      set({ isLoading: true, error: null });
      try {
        const session = await authService.createInitialAdmin(input);
        set({
          user: session.user,
          session,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Admin setup failed.';
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    verifyOtp: async (otpCode: string) => {
      const { otpPendingEmail } = get();
      if (!otpPendingEmail) {
        throw new Error('No pending OTP verification.');
      }
      set({ isLoading: true, error: null });
      try {
        const session = await authService.verifyOtp(otpPendingEmail, otpCode);
        set({
          user: session.user,
          session,
          isAuthenticated: true,
          isLoading: false,
          otpPendingEmail: null,
          otpMaskedPhone: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid OTP.';
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    resendOtp: async () => {
      const { otpPendingEmail } = get();
      if (!otpPendingEmail) throw new Error('No active OTP session');
      const res = await authService.resendOtp(otpPendingEmail);
      return res.message;
    },

    forgotPassword: async (email: string) => {
      const res = await authService.forgotPassword(email);
      return res.message;
    },

    logout: () => {
      authService.logout();
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        otpPendingEmail: null,
        otpMaskedPhone: null,
        error: null,
      });
    },

    switchRole: async (role: Role) => {
      const { user } = get();
      // Security: Only admins can switch roles in test mode
      if (user && user.role !== 'admin') {
        throw new Error('Unauthorized. Only administrators can switch test roles.');
      }

      set({ isLoading: true });
      try {
        const updated = await authService.switchRole(role);
        const session = authService.getCurrentSession();
        set({
          user: updated,
          session,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        set({ isLoading: false });
      }
    },

    hasPermission: (permission: PermissionAction) => {
      const { user } = get();
      if (!user) return false;
      if (user.status === 'deactivated' || user.status === 'suspended') return false;
      if (user.role === 'admin') return true;
      const permissions = ROLE_PERMISSIONS[user.role] || [];
      return permissions.includes(permission);
    },

    hasModulePermission: (module: AppPermissionModule) => {
      const { user } = get();
      return hasModuleAccess(user, module);
    },

    clearError: () => set({ error: null }),
    cancelOtp: () => set({ otpPendingEmail: null, otpMaskedPhone: null, error: null }),
  };
});
