import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MapPin,
  Clock,
  Check,
  X,
  Edit2,
  Search,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Lock,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { auditLogService } from '../../services/auditLogService';
import {
  User,
  Role,
  UserStatus,
  AppPermissionModule,
  APP_MODULES,
  DEFAULT_ROLE_MODULES,
  LoginMethod,
} from '../../types/auth';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { formatDateTime } from '../../utils/dateUtils';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');

  // Modals state
  const [editingRoleUser, setEditingRoleUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('staff');

  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<AppPermissionModule[]>([]);

  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null);

  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff' as Role,
    warehouseId: 'wh-001',
    loginMethod: 'google' as LoginMethod,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Update Role
  const handleRoleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoleUser) return;

    setIsSubmitting(true);
    try {
      const updated = await userService.updateUserRole(
        editingRoleUser.id,
        selectedRole,
        currentUser || undefined
      );
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));

      addNotification({
        title: 'Role Updated',
        message: `${editingRoleUser.name} is now assigned as ${updated.roleTitle}.`,
        type: 'success',
      });
      setEditingRoleUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update role';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Permissions Modal
  const openPermissionsModal = (user: User) => {
    setPermissionsUser(user);
    setSelectedPermissions(user.permissions || [...DEFAULT_ROLE_MODULES[user.role]]);
  };

  // Toggle single permission module
  const handleTogglePermission = (moduleId: AppPermissionModule) => {
    if (selectedPermissions.includes(moduleId)) {
      setSelectedPermissions(selectedPermissions.filter((m) => m !== moduleId));
    } else {
      setSelectedPermissions([...selectedPermissions, moduleId]);
    }
  };

  // Quick permission helpers
  const handleGrantAll = () => {
    setSelectedPermissions(APP_MODULES.map((m) => m.id));
  };

  const handleRevokeAll = () => {
    setSelectedPermissions([]);
  };

  const handleResetToRoleDefaults = () => {
    if (permissionsUser) {
      setSelectedPermissions([...DEFAULT_ROLE_MODULES[permissionsUser.role]]);
    }
  };

  // Save Permissions
  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissionsUser) return;

    setIsSubmitting(true);
    try {
      const updated = await userService.updateUserPermissions(
        permissionsUser.id,
        selectedPermissions,
        currentUser || undefined
      );
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));

      addNotification({
        title: 'Permissions Saved',
        message: `Updated module permissions for ${permissionsUser.name} (${selectedPermissions.length} modules granted).`,
        type: 'success',
      });
      setPermissionsUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save permissions';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Deactivation
  const handleConfirmDeactivation = async () => {
    if (!deactivatingUser) return;

    if (deactivatingUser.id === currentUser?.id) {
      addNotification({
        title: 'Action Blocked',
        message: 'You cannot deactivate your own active administrative account.',
        type: 'warning',
      });
      setDeactivatingUser(null);
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await userService.deactivateUser(
        deactivatingUser.id,
        currentUser || undefined
      );
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));

      addNotification({
        title: 'Account Deactivated',
        message: `${deactivatingUser.name}'s account has been deactivated. Active sessions revoked and future logins blocked.`,
        type: 'info',
      });
      setDeactivatingUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deactivation failed';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reactivate Account
  const handleReactivateUser = async (targetUser: User) => {
    setIsSubmitting(true);
    try {
      const updated = await userService.reactivateUser(
        targetUser.id,
        currentUser || undefined
      );
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));

      addNotification({
        title: 'Account Reactivated',
        message: `${targetUser.name}'s account has been restored to active status.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reactivation failed';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Approve Pending Registration
  const handleApproveUser = async (targetUser: User) => {
    setIsSubmitting(true);
    try {
      const updated = await userService.approveUser(
        targetUser.id,
        currentUser || undefined
      );
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));

      addNotification({
        title: 'Account Approved',
        message: `${targetUser.name}'s registration has been approved. They can now log in.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reject Pending Registration
  const handleRejectUser = async (targetUser: User) => {
    setIsSubmitting(true);
    try {
      const updated = await userService.rejectUser(
        targetUser.id,
        currentUser || undefined
      );
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));

      addNotification({
        title: 'Registration Rejected',
        message: `${targetUser.name}'s registration request was rejected.`,
        type: 'info',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rejection failed';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create New User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name.trim() || !newUserData.email.trim()) {
      addNotification({
        title: 'Missing Information',
        message: 'Name and email are mandatory.',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await userService.createUser({
        name: newUserData.name.trim(),
        email: newUserData.email.trim(),
        phone: newUserData.phone.trim() || '+91 98200 00000',
        role: newUserData.role,
        roleTitle:
          newUserData.role === 'admin'
            ? 'System Administrator'
            : newUserData.role === 'manager'
            ? 'Operations Manager'
            : newUserData.role === 'staff'
            ? 'Billing Staff'
            : 'Auditor & Viewer',
        warehouseId: newUserData.warehouseId,
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80`,
        status: 'active',
        loginMethod: newUserData.loginMethod,
        preferredLoginMethod: newUserData.loginMethod,
        permissions: [...DEFAULT_ROLE_MODULES[newUserData.role]],
      });

      setUsers([...users, created]);

      await auditLogService.logAction({
        userId: currentUser?.id || 'usr-001',
        userName: currentUser?.name || 'Administrator',
        userRole: currentUser?.role || 'admin',
        action: 'settings_updated',
        module: 'Security',
        targetId: created.id,
        targetDescription: `New user onboarded: ${created.name} (${created.email})`,
        newValue: `Role: ${created.role}, Method: ${newUserData.loginMethod}`,
      });

      addNotification({
        title: 'Staff Enrolled',
        message: `${created.name} has been enrolled as ${created.roleTitle}.`,
        type: 'success',
      });

      setIsNewUserModalOpen(false);
      setNewUserData({
        name: '',
        email: '',
        phone: '',
        role: 'staff',
        warehouseId: 'wh-001',
        loginMethod: 'google',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'User creation failed';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered users calculation
  const filteredUsers = users.filter((u) => {
    // Status filter
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;

    // Role filter
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchPhone = (u.phone || '').toLowerCase().includes(q);
      const matchRole = u.role.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchRole) return false;
    }

    return true;
  });

  // Counts for status tabs
  const activeCount = users.filter((u) => u.status === 'active').length;
  const deactivatedCount = users.filter((u) => u.status === 'deactivated' || u.status === 'suspended').length;
  const pendingCount = users.filter((u) => u.status === 'pending_approval').length;

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'staff':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'viewer':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'deactivated':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Deactivated
          </span>
        );
      case 'pending_approval':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Approval
          </span>
        );
      case 'suspended':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Suspended
          </span>
        );
    }
  };

  const getLoginMethodBadge = (method?: LoginMethod) => {
    switch (method) {
      case 'google':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="font-extrabold text-[9px]">G</span>
            <span>Google</span>
          </span>
        );
      case 'phone_otp':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Smartphone className="w-2.5 h-2.5" />
            <span>Phone OTP</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Mail className="w-2.5 h-2.5" />
            <span>Email</span>
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 rounded-xl text-accent-blue border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Staff Management & Access Control
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Manage staff credentials, login methods, individual module permissions, and account activation status.
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewUserModalOpen(true)}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-accent-orange text-white hover:bg-accent-orange/90 transition flex items-center gap-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Staff Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters Bar: Status Tabs, Role Select, and Search */}
          <div className="space-y-3">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
                }`}
              >
                All Accounts ({users.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Active ({activeCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('deactivated')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  statusFilter === 'deactivated'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Deactivated ({deactivatedCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('pending_approval')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  statusFilter === 'pending_approval'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Pending Approval ({pendingCount})</span>
              </button>

              {/* Role filter dropdown */}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'all' | Role)}
                  className="px-2.5 py-1.5 text-xs rounded-xl template-input border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>

            {/* Search Bar */}
            <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-3 shadow-soft">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff by name, email, mobile number, or role..."
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>
            </div>
          </div>

          {/* Staff Accounts Table */}
          <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3.5">Staff Account</th>
                    <th className="px-4 py-3.5">Contact & Login Method</th>
                    <th className="px-4 py-3.5">Role Tier</th>
                    <th className="px-4 py-3.5">Module Permissions</th>
                    <th className="px-4 py-3.5">Facility Assignment</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Last Active</th>
                    <th className="px-4 py-3.5 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        Loading staff roster...
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const grantedPermsCount = (u.permissions || DEFAULT_ROLE_MODULES[u.role]).length;
                      const isSelf = u.id === currentUser?.id;

                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors ${
                            u.status === 'deactivated' ? 'opacity-70 bg-rose-500/[0.02]' : ''
                          }`}
                        >
                          {/* Staff Account */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {u.avatar ? (
                                <img
                                  src={u.avatar}
                                  alt={u.name}
                                  className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100 dark:ring-white/[0.1]"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-accent-orange/20 text-accent-orange font-bold flex items-center justify-center text-xs">
                                  {u.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isSelf && (
                                    <span className="text-[10px] bg-slate-100 dark:bg-white/[0.05] text-slate-400 px-1.5 py-0.2 rounded font-normal border border-slate-200 dark:border-white/[0.06]">
                                      You
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">{u.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Contact & Verified Login Method */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{u.email}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{u.phone}</span>
                              </div>
                              {getLoginMethodBadge(u.loginMethod || u.preferredLoginMethod)}
                            </div>
                          </td>

                          {/* Role Tier */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(
                                  u.role
                                )}`}
                              >
                                {u.role}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              {u.roleTitle}
                            </span>
                          </td>

                          {/* Module Permissions */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <button
                              onClick={() => openPermissionsModal(u)}
                              disabled={!isAdmin}
                              className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                                grantedPermsCount === APP_MODULES.length
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20'
                              } ${!isAdmin ? 'cursor-default' : 'cursor-pointer'}`}
                              title={isAdmin ? 'Click to customize individual module permissions' : 'Assigned modules'}
                            >
                              <Shield className="w-3 h-3" />
                              <span>{grantedPermsCount}/{APP_MODULES.length} Modules</span>
                              {isAdmin && (
                                <Sliders className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                              )}
                            </button>
                          </td>

                          {/* Facility Assignment */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{u.warehouseId === 'all' ? 'All Hubs (Central)' : u.warehouseId}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {getStatusBadge(u.status)}
                          </td>

                          {/* Last Active */}
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1 text-[11px]">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{u.lastLogin ? formatDateTime(u.lastLogin) : 'Never'}</span>
                            </div>
                          </td>

                          {/* Administrative Actions */}
                          <td className="px-4 py-3.5 whitespace-nowrap text-right">
                            {isAdmin ? (
                              <div className="flex items-center justify-end gap-1.5">
                                {/* If pending approval: Approve / Reject */}
                                {u.status === 'pending_approval' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveUser(u)}
                                      className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition"
                                      title="Approve staff registration"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRejectUser(u)}
                                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                                      title="Reject staff registration"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}

                                {/* Permissions Editor */}
                                <button
                                  onClick={() => openPermissionsModal(u)}
                                  className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition"
                                  title="Edit module permissions"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                </button>

                                {/* Role Editor */}
                                <button
                                  onClick={() => {
                                    setEditingRoleUser(u);
                                    setSelectedRole(u.role);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-lg transition"
                                  title="Change role tier"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Deactivate / Reactivate Account */}
                                {u.status === 'active' && !isSelf && (
                                  <button
                                    onClick={() => setDeactivatingUser(u)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                                    title="Deactivate staff account (blocks logins and revokes sessions)"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {u.status === 'deactivated' && (
                                  <button
                                    onClick={() => handleReactivateUser(u)}
                                    className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition"
                                    title="Reactivate staff account"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">Admin Only</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        No team members match your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

      {/* ============================================================ */}
      {/* MODAL 1: STAFF PERMISSIONS MANAGEMENT MODAL                  */}
      {/* ============================================================ */}
      {permissionsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-accent-blue text-[11px] font-bold border border-blue-500/20 mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin-Controlled Permissions</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Module Permissions: {permissionsUser.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Grant or revoke individual operational modules. Revocations are immediately enforced across frontend routes and services.
                </p>
              </div>
              <button
                onClick={() => setPermissionsUser(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={handleGrantAll}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition"
              >
                Grant All (9)
              </button>
              <button
                type="button"
                onClick={handleRevokeAll}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition"
              >
                Revoke All
              </button>
              <button
                type="button"
                onClick={handleResetToRoleDefaults}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition ml-auto"
              >
                Reset to {permissionsUser.role} Defaults
              </button>
            </div>

            {/* Module Checkboxes */}
            <form onSubmit={handleSavePermissions} className="space-y-3">
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {APP_MODULES.map((mod) => {
                  const isChecked = selectedPermissions.includes(mod.id);
                  const isSettings = mod.id === 'module_settings';

                  return (
                    <label
                      key={mod.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'border-blue-500/40 bg-blue-500/[0.08]'
                          : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(mod.id)}
                        className="mt-1 rounded text-accent-blue focus:ring-accent-blue accent-blue-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {mod.name}
                          </span>
                          {isSettings && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Admin-Only by Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {mod.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setPermissionsUser(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-orange text-white hover:bg-accent-orange/90 transition shadow-sm"
                >
                  Save Permissions ({selectedPermissions.length} Active)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: DEACTIVATE CONFIRMATION MODAL                       */}
      {/* ============================================================ */}
      {deactivatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md template-card border border-rose-500/30 rounded-[24px] shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Deactivate Staff Account?
                </h3>
                <p className="text-xs text-rose-500">
                  Immediate session revocation and login block
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <p>
                Are you sure you want to deactivate <strong>{deactivatingUser.name}</strong> ({deactivatingUser.email})?
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <li><strong>Revoke active sessions:</strong> If this staff member is currently logged in, their session will be terminated immediately.</li>
                <li><strong>Block new logins:</strong> Access via Google OAuth, Phone OTP, and Password will be completely denied.</li>
                <li><strong>Preserve records:</strong> Profile information, historical orders, and audit trail logs remain permanently preserved.</li>
                <li><strong>Reversible:</strong> You can reactivate this account at any time with one click.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setDeactivatingUser(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDeactivation}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm flex items-center gap-1.5"
              >
                <UserX className="w-4 h-4" />
                <span>Confirm Deactivation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: ROLE EDIT MODAL                                     */}
      {/* ============================================================ */}
      {editingRoleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Update Role Tier: {editingRoleUser.name}
            </h3>
            <p className="text-xs text-slate-400">
              Select the new security and access privilege tier for this team member.
            </p>

            <form onSubmit={handleRoleUpdate} className="space-y-4">
              <div className="space-y-2">
                {[
                  {
                    role: 'admin' as Role,
                    title: 'System Administrator',
                    desc: 'Full read/write across all modules, approvals, audit logs, and settings.',
                  },
                  {
                    role: 'manager' as Role,
                    title: 'Operations Manager',
                    desc: 'Manage inventory, purchase orders, transfers, and billing without cost visibility.',
                  },
                  {
                    role: 'staff' as Role,
                    title: 'Billing Staff',
                    desc: 'Create sales quotations and invoices; record customer orders.',
                  },
                  {
                    role: 'viewer' as Role,
                    title: 'Auditor & Viewer',
                    desc: 'Read-only access across inventory records and financial reports.',
                  },
                ].map((tier) => (
                  <label
                    key={tier.role}
                    className={`block p-3 rounded-xl border cursor-pointer transition ${
                      selectedRole === tier.role
                        ? 'border-accent-orange bg-accent-orange/10'
                        : 'border-slate-200 dark:border-white/[0.08] template-input hover:border-slate-300 dark:hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="userRole"
                        checked={selectedRole === tier.role}
                        onChange={() => setSelectedRole(tier.role)}
                        className="text-accent-orange focus:ring-accent-orange"
                      />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {tier.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-5">
                      {tier.desc}
                    </p>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setEditingRoleUser(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-orange text-white hover:bg-accent-orange/90 transition shadow-sm"
                >
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: ENROLL NEW STAFF MODAL                              */}
      {/* ============================================================ */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Enroll New Staff Member
            </h3>
            <p className="text-xs text-slate-400">
              Create employee credentials, assign preferred login method, and configure facility access.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="e.g. Rahul Deshmukh"
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="e.g. rahul.staff@gmail.com"
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number (For OTP Verification)
                </label>
                <input
                  type="text"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  placeholder="+91 98200 12345"
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role Tier
                  </label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as Role })}
                    className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  >
                    <option value="staff">Billing Staff</option>
                    <option value="manager">Operations Manager</option>
                    <option value="viewer">Auditor & Viewer</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Verified Login Method
                  </label>
                  <select
                    value={newUserData.loginMethod}
                    onChange={(e) => setNewUserData({ ...newUserData, loginMethod: e.target.value as LoginMethod })}
                    className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  >
                    <option value="google">Google OAuth</option>
                    <option value="phone_otp">Phone Number / OTP</option>
                    <option value="email_password">Corporate Email</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hub Facility Assignment
                </label>
                <select
                  value={newUserData.warehouseId}
                  onChange={(e) => setNewUserData({ ...newUserData, warehouseId: e.target.value })}
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                >
                  <option value="wh-001">Bhiwandi Central Hub</option>
                  <option value="wh-002">Panvel Logistics Hub</option>
                  <option value="wh-003">Nagpur Central Depot</option>
                  <option value="wh-004">Pune Chakan Depot</option>
                  <option value="all">All Hubs (Central)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-orange text-white hover:bg-accent-orange/90 transition shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
