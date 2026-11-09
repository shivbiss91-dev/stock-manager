import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { StorageService, STORAGE_KEYS } from '../services/storageService';
import { hasModuleAccess, DEFAULT_ROLE_MODULES, User } from '../types/auth';
import { MOCK_USERS } from './fixtures/users';

describe('Staff Management: Authentication, Permissions & Deactivation', () => {
  const adminUser: User = {
    id: 'usr-admin',
    name: 'Admin Boss',
    email: 'admin.boss@stockvista.internal',
    role: 'admin',
    roleTitle: 'System Administrator',
    phone: '+91 98000 00000',
    status: 'active',
    warehouseId: 'all',
    permissions: [...DEFAULT_ROLE_MODULES.admin],
  };

  const staffUser: User = {
    id: 'usr-staff-test',
    name: 'Staff Tester',
    email: 'staff.tester@stockvista.internal',
    role: 'staff',
    roleTitle: 'Billing Staff',
    phone: '+91 98200 11111',
    status: 'active',
    warehouseId: 'wh-001',
    permissions: [...DEFAULT_ROLE_MODULES.staff],
  };

  beforeEach(() => {
    StorageService.remove(STORAGE_KEYS.SESSION);
    userService._seedUsersForTesting(MOCK_USERS);
  });

  describe('1. Staff Login Method (Google OAuth & Phone OTP)', () => {
    it('authenticates or registers staff via Google OAuth and sets loginMethod to google', async () => {
      const session = await authService.loginWithGoogle(
        'rahul.ops@gmail.com',
        'Rahul Operations',
        'staff'
      );

      expect(session).toBeDefined();
      expect(session.user.email).toBe('rahul.ops@gmail.com');
      expect(session.user.loginMethod).toBe('google');
      expect(session.user.preferredLoginMethod).toBe('google');
      expect(session.user.status).toBe('active');
      expect(session.user.permissions).toBeDefined();

      // Ensure user is recorded in storage with verified login method
      const savedUser = userService.getUserByIdSync(session.user.id);
      expect(savedUser?.loginMethod).toBe('google');
      expect(savedUser?.preferredLoginMethod).toBe('google');
    });

    it('sends phone OTP code and verifies phone OTP authentication', async () => {
      const phone = '9820055443';
      const otpRes = await authService.sendPhoneOtp(phone);

      expect(otpRes.success).toBe(true);
      expect(otpRes.otpCode).toBe('123456');

      // Verify OTP and complete login
      const session = await authService.verifyPhoneOtp(
        phone,
        '123456',
        'Pooja Billing',
        'staff'
      );

      expect(session).toBeDefined();
      expect(session.user.name).toBe('Pooja Billing');
      expect(session.user.phone).toContain('9820055443');
      expect(session.user.loginMethod).toBe('phone_otp');
      expect(session.user.preferredLoginMethod).toBe('phone_otp');
      expect(session.user.status).toBe('active');
    });

    it('rejects invalid phone OTP code', async () => {
      const phone = '9820055443';
      await authService.sendPhoneOtp(phone);

      await expect(
        authService.verifyPhoneOtp(phone, '999999', 'Pooja Billing', 'staff')
      ).rejects.toThrow(/Invalid or expired OTP code/i);
    });
  });

  describe('2. Admin-Controlled Permissions Management', () => {
    it('allows Admin to grant and revoke individual module permissions', async () => {
      // Create a test staff account
      const staff = await userService.createUser({
        name: 'Sunil Rao',
        email: 'sunil.rao@stockvista.internal',
        phone: '+91 98111 22233',
        role: 'staff',
        roleTitle: 'Billing Staff',
        status: 'active',
        warehouseId: 'wh-001',
        permissions: ['module_dashboard', 'module_invoices', 'module_orders'],
      });

      expect(staff.permissions).toContain('module_dashboard');
      expect(staff.permissions).toContain('module_invoices');
      expect(hasModuleAccess(staff, 'module_dashboard')).toBe(true);
      expect(hasModuleAccess(staff, 'module_invoices')).toBe(true);
      expect(hasModuleAccess(staff, 'module_settings')).toBe(false);

      // Admin updates permissions: revoking invoices, granting stock management
      const updated = await userService.updateUserPermissions(
        staff.id,
        ['module_dashboard', 'module_stock', 'module_items'],
        adminUser
      );

      expect(updated.permissions).toContain('module_stock');
      expect(updated.permissions).toContain('module_items');
      expect(updated.permissions).not.toContain('module_invoices');
      expect(hasModuleAccess(updated, 'module_invoices')).toBe(false);
      expect(hasModuleAccess(updated, 'module_stock')).toBe(true);
    });

    it('blocks non-admin staff from updating permissions', async () => {
      await expect(
        userService.updateUserPermissions(
          'usr-002',
          ['module_dashboard', 'module_settings'],
          staffUser
        )
      ).rejects.toThrow(/Only administrators can modify staff permissions/i);
    });
  });

  describe('3. Deactivate & Reactivate Staff Account', () => {
    it('deactivating staff immediately blocks new logins and revokes active sessions', async () => {
      // 1. Staff logs in via Google
      const session = await authService.loginWithGoogle(
        'neha.billing@gmail.com',
        'Neha Billing',
        'staff'
      );
      const staffId = session.user.id;

      // Active session exists
      const currentSession = authService.getCurrentSession();
      expect(currentSession?.user.id).toBe(staffId);

      // 2. Admin deactivates staff account
      const deactivated = await userService.deactivateUser(staffId, adminUser);
      expect(deactivated.status).toBe('deactivated');

      // 3. Active session must be immediately cleared
      const sessionAfterDeactivation = authService.getCurrentSession();
      expect(sessionAfterDeactivation).toBeNull();

      // 4. Future Google login must be blocked
      await expect(
        authService.loginWithGoogle('neha.billing@gmail.com')
      ).rejects.toThrow(/deactivated by the administrator/);

      // 5. Future Phone OTP verification must be blocked
      await expect(
        authService.sendPhoneOtp(session.user.phone || '9820000000')
      ).rejects.toThrow(/deactivated/);
    });

    it('prevents an administrator from deactivating their own active account', async () => {
      await expect(
        userService.deactivateUser(adminUser.id, adminUser)
      ).rejects.toThrow(/cannot deactivate your own active administrative account/);
    });

    it('reactivating staff account restores their ability to log in', async () => {
      // Register staff
      const session = await authService.loginWithGoogle(
        'arjun.dispatch@gmail.com',
        'Arjun Dispatch',
        'staff'
      );
      const staffId = session.user.id;

      // Deactivate
      await userService.deactivateUser(staffId, adminUser);

      // Reactivate
      const reactivated = await userService.reactivateUser(staffId, adminUser);
      expect(reactivated.status).toBe('active');

      // Now staff can log in again successfully
      const newSession = await authService.loginWithGoogle('arjun.dispatch@gmail.com');
      expect(newSession.user.id).toBe(staffId);
      expect(newSession.user.status).toBe('active');
    });
  });

  describe('4. Staff Security & Privilege Enforcement', () => {
    it('blocks non-admin staff from modifying user roles', async () => {
      await expect(
        userService.updateUserRole('usr-002', 'admin', staffUser)
      ).rejects.toThrow(/Only administrators can modify roles and permissions/i);
    });

    it('blocks non-admin staff from deactivating accounts', async () => {
      await expect(
        userService.deactivateUser('usr-002', staffUser)
      ).rejects.toThrow(/Only administrators can deactivate accounts/i);
    });
  });
});
