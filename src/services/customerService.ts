import { Customer } from '../types/sales';
import { validateGSTIN, getStateCodeFromGSTIN, getStateNameByCode } from '../utils/gstUtils';
import { StorageService, STORAGE_KEYS } from './storageService';

export const customerService = {
  async getCustomers(query?: string): Promise<Customer[]> {
    await new Promise((res) => setTimeout(res, 30));
    const list = StorageService.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    if (!query || !query.trim()) {
      return [...list];
    }
    const q = query.trim().toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.gstin.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    await new Promise((res) => setTimeout(res, 20));
    const list = StorageService.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const found = list.find((c) => c.id === id);
    return found ? { ...found } : null;
  },

  async createCustomer(
    data: Omit<Customer, 'id' | 'outstandingBalanceINR'>
  ): Promise<Customer> {
    await new Promise((res) => setTimeout(res, 50));

    if (!validateGSTIN(data.gstin)) {
      throw new Error(
        `Invalid GSTIN "${data.gstin}". Must be 15 alphanumeric characters formatted per standard Indian GST regulation.`
      );
    }

    const stateCode = getStateCodeFromGSTIN(data.gstin) || data.stateCode;
    const stateName = getStateNameByCode(stateCode);

    const list = StorageService.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const pad = String(list.length + 1).padStart(4, '0');
    const newCustomer: Customer = {
      ...data,
      id: `cust-${pad}`,
      stateCode,
      state: stateName,
      outstandingBalanceINR: 0,
    };

    list.unshift(newCustomer);
    StorageService.set(STORAGE_KEYS.CUSTOMERS, list);
    return newCustomer;
  },

  _seedCustomersForTesting(customers: Customer[]): void {
    StorageService.set(STORAGE_KEYS.CUSTOMERS, customers);
  },
};
