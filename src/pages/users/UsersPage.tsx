import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MapPin,
  Clock,
  Check,
  X,
  Lock,
  Edit2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { auditLogService } from '../../services/auditLogService';
import { User, Role } from '../../types/auth';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { formatDateTime } from '../../utils/dateUtils';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');

  // Modal states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('staff');
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff' as Role,
    warehouseId: 'wh-001',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleRoleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      const oldRole = editingUser.role;
      const updated = await userService.updateUserRole(editingUser.id, selectedRole);
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));

      // Audit log the permission modification
      await auditLogService.logAction({
        userId: currentUser?.id || 'usr-001',
        userName: currentUser?.name || 'Administrator',
        userRole: currentUser?.role || 'admin',
        action: 'settings_updated',
        module: 'Security',
        targetId: editingUser.id,
        targetDescription: `Role changed for ${editingUser.name} (${editingUser.email})`,
        oldValue: `Role: ${oldRole}`,
        newValue: `Role: ${selectedRole} (${updated.roleTitle})`,
      });

      addNotification({
        title: 'User Role Updated',
        message: `${editingUser.name} is now assigned as ${updated.roleTitle}.`,
        type: 'success',
      });
      setEditingUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update role';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userToToggle: User) => {
    if (userToToggle.id === currentUser?.id) {
      addNotification({
        title: 'Cannot Suspend Self',
        message: 'You cannot suspend your currently active administrative session.',
        type: 'warning',
      });
      return;
    }

    try {
      const updated = await userService.toggleUserStatus(userToToggle.id);
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));

      await auditLogService.logAction({
        userId: currentUser?.id || 'usr-001',
        userName: currentUser?.name || 'Administrator',
        userRole: currentUser?.role || 'admin',
        action: 'settings_updated',
        module: 'Security',
        targetId: userToToggle.id,
        targetDescription: `User status toggled for ${userToToggle.name}`,
        oldValue: `Status: ${userToToggle.status}`,
        newValue: `Status: ${updated.status}`,
      });

      addNotification({
        title: updated.status === 'active' ? 'Account Activated' : 'Account Suspended',
        message: `${userToToggle.name}'s account status has been switched to ${updated.status}.`,
        type: updated.status === 'active' ? 'success' : 'info',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name.trim() || !newUserData.email.trim()) {
      addNotification({ title: 'Missing Information', message: 'Name and email are mandatory.', type: 'warning' });
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
        newValue: `Role: ${created.role}, Warehouse: ${created.warehouseId}`,
      });

      addNotification({
        title: 'User Enrolled',
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
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'User creation failed';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

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
                Users & Access Roles
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Manage employee access credentials, role hierarchies, warehouse assignments, and security permissions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewUserModalOpen(true)}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-accent-orange text-white hover:bg-accent-orange/90 transition flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.06] pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'users'
              ? 'bg-accent-orange text-white shadow-sm'
              : 'template-input text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
          }`}
        >
          Staff Directory ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'matrix'
              ? 'bg-accent-orange text-white shadow-sm'
              : 'template-input text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
          }`}
        >
          Role Permissions Matrix
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Search bar */}
          <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-4 shadow-soft">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, email, phone number, or role..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3.5">Team Member</th>
                    <th className="px-4 py-3.5">Contact Details</th>
                    <th className="px-4 py-3.5">Role & Access Tier</th>
                    <th className="px-4 py-3.5">Facility Assignment</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Last Active</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        Loading employee roster...
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                      >
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
                                {u.id === currentUser?.id && (
                                  <span className="text-[10px] bg-slate-100 dark:bg-white/[0.05] text-slate-400 px-1.5 py-0.2 rounded font-normal border border-slate-200 dark:border-white/[0.06]">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">{u.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        </td>

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

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{u.warehouseId === 'all' ? 'All Hubs (Central)' : u.warehouseId}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              u.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {u.status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{u.lastLogin ? formatDateTime(u.lastLogin) : 'Never'}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setSelectedRole(u.role);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-lg transition"
                              title="Modify role"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={u.id === currentUser?.id}
                              className={`p-1.5 rounded-lg transition ${
                                u.status === 'active'
                                  ? 'text-rose-500 hover:bg-rose-500/10'
                                  : 'text-emerald-500 hover:bg-emerald-500/10'
                              }`}
                              title={u.status === 'active' ? 'Suspend account' : 'Activate account'}
                            >
                              {u.status === 'active' ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        No team members match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Role Permissions Matrix */
        <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-6 shadow-soft space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Access Control & Role Privilege Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              StockVista enforces strict RBAC (Role-Based Access Control) across operational and financial modules.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
              <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3.5">Platform Module / Function</th>
                  <th className="p-3.5 text-center">Admin / Owner</th>
                  <th className="p-3.5 text-center">Operations Manager</th>
                  <th className="p-3.5 text-center">Billing Staff</th>
                  <th className="p-3.5 text-center">Auditor / Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {[
                  {
                    module: 'Dashboard & KPI Metrics',
                    admin: true,
                    manager: true,
                    staff: true,
                    viewer: true,
                  },
                  {
                    module: 'Inventory Catalog & Stock Levels',
                    admin: true,
                    manager: true,
                    staff: true,
                    viewer: true,
                  },
                  {
                    module: 'View Cost Price & Profit Margin %',
                    admin: true,
                    manager: false,
                    staff: false,
                    viewer: false,
                  },
                  {
                    module: 'Direct Selling Price Editing',
                    admin: true,
                    manager: false, // Requires approval
                    staff: false,
                    viewer: false,
                  },
                  {
                    module: 'Create GST Tax Invoices',
                    admin: true,
                    manager: true,
                    staff: true,
                    viewer: false,
                  },
                  {
                    module: 'Generate E-Way Bill & E-Invoice IRN',
                    admin: true,
                    manager: true,
                    staff: true,
                    viewer: false,
                  },
                  {
                    module: 'Purchase Orders & GRN Receiving',
                    admin: true,
                    manager: true,
                    staff: false,
                    viewer: false,
                  },
                  {
                    module: 'Inter-Hub Transfers & Logistics Dispatch',
                    admin: true,
                    manager: true,
                    staff: false,
                    viewer: false,
                  },
                  {
                    module: 'Two-Tier Authorization Approval Queue',
                    admin: true,
                    manager: true,
                    staff: false,
                    viewer: false,
                  },
                  {
                    module: 'Financial Statements & GST Audit Reports',
                    admin: true,
                    manager: true,
                    staff: false,
                    viewer: true,
                  },
                  {
                    module: 'User Roles & Access Enrollment',
                    admin: true,
                    manager: false,
                    staff: false,
                    viewer: false,
                  },
                  {
                    module: 'Immutable Security Audit Log',
                    admin: true,
                    manager: false,
                    staff: false,
                    viewer: false,
                  },
                  {
                    module: 'Database JSON Backup & Disaster Recovery',
                    admin: true,
                    manager: false,
                    staff: false,
                    viewer: false,
                  },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                      {row.module}
                    </td>
                    <td className="p-3.5 text-center">
                      {row.admin ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-400 dark:text-slate-600 mx-auto" />
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {row.manager ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-400 dark:text-slate-600 mx-auto" />
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {row.staff ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-400 dark:text-slate-600 mx-auto" />
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {row.viewer ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-400 dark:text-slate-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Update Role for {editingUser.name}
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
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-orange text-white hover:bg-accent-orange/90 transition shadow-sm"
                >
                  Save New Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Enroll New Staff Member
            </h3>
            <p className="text-xs text-slate-400">
              Create employee credentials and assign access level and primary warehouse facility.
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
                  Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="e.g. rahul@stockvista.in"
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
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
                    <option value="staff" className="dark:bg-dark-card">Billing Staff</option>
                    <option value="manager" className="dark:bg-dark-card">Operations Manager</option>
                    <option value="viewer" className="dark:bg-dark-card">Auditor & Viewer</option>
                    <option value="admin" className="dark:bg-dark-card">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hub Assignment
                  </label>
                  <select
                    value={newUserData.warehouseId}
                    onChange={(e) => setNewUserData({ ...newUserData, warehouseId: e.target.value })}
                    className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  >
                    <option value="wh-001" className="dark:bg-dark-card">Bhiwandi Hub</option>
                    <option value="wh-002" className="dark:bg-dark-card">Panvel Logistics Hub</option>
                    <option value="wh-003" className="dark:bg-dark-card">Nagpur Central Depot</option>
                    <option value="wh-004" className="dark:bg-dark-card">Pune Chakan Depot</option>
                    <option value="all" className="dark:bg-dark-card">All Hubs (Central)</option>
                  </select>
                </div>
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
