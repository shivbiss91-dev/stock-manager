import { Customer } from '../types/sales';
import { MOCK_CUSTOMERS } from '../data/customers';
import { validateGSTIN, getStateCodeFromGSTIN, getStateNameByCode } from '../utils/gstUtils';

// In-memory customers array
let customersDatabase: Customer[] = [...MOCK_CUSTOMERS];

export const customerService = {
  async getCustomers(query?: string): Promise<Customer[]> {
    await new Promise((res) => setTimeout(res, 40));
    if (!query || !query.trim()) {
      return [...customersDatabase];
    }
    const q = query.trim().toLowerCase();
    return customersDatabase.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.gstin.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    await new Promise((res) => setTimeout(res, 30));
    const found = customersDatabase.find((c) => c.id === id);
    return found ? { ...found } : null;
  },

  async createCustomer(
    data: Omit<Customer, 'id' | 'outstandingBalanceINR'>
  ): Promise<Customer> {
    await new Promise((res) => setTimeout(res, 60));

    // Validate 15-character GSTIN
    if (!validateGSTIN(data.gstin)) {
      throw new Error(
        `Invalid GSTIN "${data.gstin}". Must be 15 alphanumeric characters formatted per standard Indian GST regulation.`
      );
    }

    const stateCode = getStateCodeFromGSTIN(data.gstin) || data.stateCode;
    const stateName = getStateNameByCode(stateCode);

    const pad = String(customersDatabase.length + 1).padStart(4, '0');
    const newCustomer: Customer = {
      ...data,
      id: `cust-${pad}`,
      stateCode,
      state: stateName,
      outstandingBalanceINR: 0,
    };

    customersDatabase.unshift(newCustomer);
    return newCustomer;
  },
};
