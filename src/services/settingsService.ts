export interface CompanySettings {
  companyName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  cin: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  email: string;
  phone: string;
  website: string;

  // Bank details
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  upiId: string;

  // Invoicing rules
  invoicePrefix: string;
  defaultPaymentTermsDays: number;
  autoGenerateEInvoice: boolean;
  autoGenerateEWayBill: boolean;
  eWayBillThreshold: number;
  defaultTermsAndConditions: string;

  // Notifications
  lowStockEmailAlerts: boolean;
  smsDispatchAlerts: boolean;
  whatsappInvoicing: boolean;
}

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'StockVista Wholesale India Pvt Ltd',
  tradeName: 'StockVista Industrial & Wholesale Depot',
  gstin: '27AABCS1429B1Z2',
  pan: 'AABCS1429B',
  cin: 'U51909MH2021PTC368912',
  address: 'Plot No. 42-45, Bhiwandi Logistics Corridor, Pipeline Road, Rahnal',
  city: 'Bhiwandi',
  state: 'Maharashtra',
  stateCode: '27',
  pincode: '421302',
  email: 'billing@stockvista.in',
  phone: '+91 22 2847 9100',
  website: 'https://stockvista.in',

  bankName: 'HDFC Bank Ltd',
  accountName: 'StockVista Wholesale India Pvt Ltd',
  accountNumber: '50200084920192',
  ifscCode: 'HDFC0000240',
  branch: 'Kanjurmarg West, Mumbai',
  upiId: 'stockvista@hdfcbank',

  invoicePrefix: 'INV',
  defaultPaymentTermsDays: 30,
  autoGenerateEInvoice: true,
  autoGenerateEWayBill: true,
  eWayBillThreshold: 50000,
  defaultTermsAndConditions:
    '1. Goods once sold will not be taken back after 7 days from delivery date.\n2. Interest @ 18% p.a. will be charged on overdue payments after due date.\n3. Subject to Thane/Mumbai jurisdiction only.',

  lowStockEmailAlerts: true,
  smsDispatchAlerts: true,
  whatsappInvoicing: true,
};

const STORAGE_KEY = 'stockvista_company_settings';

export const settingsService = {
  async getSettings(): Promise<CompanySettings> {
    await new Promise((res) => setTimeout(res, 30));
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback
    }
    return { ...DEFAULT_SETTINGS };
  },

  async updateSettings(newSettings: Partial<CompanySettings>): Promise<CompanySettings> {
    await new Promise((res) => setTimeout(res, 50));
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage quotas
    }
    return updated;
  },
};
