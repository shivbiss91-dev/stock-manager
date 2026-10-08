import { User, Role } from '../types/auth';
import { MOCK_USERS } from '../data/users';

let usersDatabase: User[] = MOCK_USERS.map(({ passwordHash, requiresOtp, otpCode, ...user }) => ({ ...user }));

export const userService = {
  async getUsers(): Promise<User[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...usersDatabase];
  },

  async updateUserRole(id: string, newRole: Role): Promise<User> {
    await new Promise((res) => setTimeout(res, 50));
    const user = usersDatabase.find((u) => u.id === id);
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
    return { ...user };
  },

  async toggleUserStatus(id: string): Promise<User> {
    await new Promise((res) => setTimeout(res, 50));
    const user = usersDatabase.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    user.status = user.status === 'active' ? 'suspended' : 'active';
    return { ...user };
  },

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    await new Promise((res) => setTimeout(res, 60));
    const id = `usr-${String(usersDatabase.length + 1).padStart(3, '0')}`;
    const newUser: User = {
      ...userData,
      id,
      lastLogin: new Date().toISOString(),
    };
    usersDatabase.push(newUser);
    return { ...newUser };
  },
};
