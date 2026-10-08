import { create } from 'zustand';
import { User, Role, AuthSession, ROLE_PERMISSIONS, PermissionAction } from '../types/auth';
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
  verifyOtp: (otpCode: string) => Promise<void>;
  resendOtp: () => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  logout: () => void;
  switchRole: (role: Role) => Promise<void>;
  hasPermission: (permission: PermissionAction) => boolean;
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
      });
    },

    switchRole: async (role: Role) => {
      set({ isLoading: true });
      try {
        const user = await authService.switchRole(role);
        const session = authService.getCurrentSession();
        set({
          user,
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
      const permissions = ROLE_PERMISSIONS[user.role] || [];
      return permissions.includes(permission);
    },

    clearError: () => set({ error: null }),
    cancelOtp: () => set({ otpPendingEmail: null, otpMaskedPhone: null, error: null }),
  };
});
