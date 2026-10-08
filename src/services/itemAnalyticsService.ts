import {
  TimeGranularity,
  SalesAnalyticsPoint,
  SalesAnalyticsSummary,
  TopCustomerItemStat,
} from '../types/itemDetail';
import { MOCK_CUSTOMERS } from '../data/customers';

// Deterministic seed helper
function seedRand(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export const itemAnalyticsService = {
  async getSalesAnalytics(
    itemId: string,
    itemSellingPrice: number,
    granularity: TimeGranularity = 'monthly',
    customStartDate?: string,
    customEndDate?: string
  ): Promise<SalesAnalyticsSummary> {
    await new Promise((res) => setTimeout(res, 60));

    // Numeric seed based on itemId characters
    let seed = 0;
    for (let i = 0; i < itemId.length; i++) {
      seed += itemId.charCodeAt(i);
    }

    let points: SalesAnalyticsPoint[] = [];

    if (granularity === 'daily') {
      // Last 14 days
      const days = ['25 Sep', '26 Sep', '27 Sep', '28 Sep', '29 Sep', '30 Sep', '01 Oct', '02 Oct', '03 Oct', '04 Oct', '05 Oct', '06 Oct', '07 Oct', '08 Oct'];
      points = days.map((day, idx) => {
        const r = seedRand(seed + idx * 3.1);
        const units = Math.round(5 + r * 35);
        const orders = Math.max(1, Math.round(units / (3 + r * 4)));
        const sales = units * itemSellingPrice;
        return {
          periodLabel: day,
          salesINR: sales,
          unitsSold: units,
          ordersCount: orders,
        };
      });
    } else if (granularity === 'weekly') {
      // Last 8 weeks
      const weeks = ['W33', 'W34', 'W35', 'W36', 'W37', 'W38', 'W39', 'W40'];
      points = weeks.map((w, idx) => {
        const r = seedRand(seed + idx * 5.7);
        const units = Math.round(30 + r * 140);
        const orders = Math.max(2, Math.round(units / 12));
        const sales = units * itemSellingPrice;
        return {
          periodLabel: w,
          salesINR: sales,
          unitsSold: units,
          ordersCount: orders,
        };
      });
    } else if (granularity === 'monthly') {
      // Last 12 months (Oct 2025 to Oct 2026)
      const months = ['Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26'];
      points = months.map((m, idx) => {
        const r = seedRand(seed + idx * 7.9);
        const units = Math.round(80 + r * 320);
        const orders = Math.max(5, Math.round(units / 16));
        const sales = units * itemSellingPrice;
        return {
          periodLabel: m,
          salesINR: sales,
          unitsSold: units,
          ordersCount: orders,
        };
      });
    } else {
      // Yearly (FY 2024-25 vs FY 2025-26 vs FY 2026-27)
      const years = ['FY 2024-25', 'FY 2025-26', 'FY 2026-27 (YTD)'];
      points = years.map((yr, idx) => {
        const r = seedRand(seed + idx * 11.3);
        const units = Math.round(1200 + r * 2800);
        const orders = Math.max(40, Math.round(units / 20));
        const sales = units * itemSellingPrice;
        return {
          periodLabel: yr,
          salesINR: sales,
          unitsSold: units,
          ordersCount: orders,
        };
      });
    }

    // MANDATORY DATA RULE: Totals must be strictly computed from visible rows
    const totalSalesINR = points.reduce((acc, p) => acc + p.salesINR, 0);
    const unitsSold = points.reduce((acc, p) => acc + p.unitsSold, 0);
    const ordersCount = points.reduce((acc, p) => acc + p.ordersCount, 0);

    // Avg Selling Price strictly computed as Total Sales ÷ Units Sold
    const avgSellingPriceINR = unitsSold > 0 ? Math.round(totalSalesINR / unitsSold) : itemSellingPrice;

    // Realistic trend % change vs previous equivalent period
    const totalSalesChangePercent = Number((4.5 + seedRand(seed + 1) * 12.0).toFixed(1));
    const ordersChangePercent = Number((2.8 + seedRand(seed + 2) * 9.5).toFixed(1));
    const unitsSoldChangePercent = Number((3.2 + seedRand(seed + 3) * 11.0).toFixed(1));
    const avgPriceChangePercent = Number(((seedRand(seed + 4) - 0.5) * 4).toFixed(1));

    return {
      totalSalesINR,
      totalSalesChangePercent,
      ordersCount,
      ordersChangePercent,
      unitsSold,
      unitsSoldChangePercent,
      avgSellingPriceINR,
      avgPriceChangePercent,
      chartData: points,
    };
  },

  async getTopCustomers(itemId: string, itemSellingPrice: number): Promise<TopCustomerItemStat[]> {
    await new Promise((res) => setTimeout(res, 50));

    let seed = 0;
    for (let i = 0; i < itemId.length; i++) seed += itemId.charCodeAt(i);

    // Pick 5 top buyers from mock customers deterministically
    const selected = [
      MOCK_CUSTOMERS[(seed * 3) % MOCK_CUSTOMERS.length],
      MOCK_CUSTOMERS[(seed * 7) % MOCK_CUSTOMERS.length],
      MOCK_CUSTOMERS[(seed * 11) % MOCK_CUSTOMERS.length],
      MOCK_CUSTOMERS[(seed * 13) % MOCK_CUSTOMERS.length],
      MOCK_CUSTOMERS[(seed * 17) % MOCK_CUSTOMERS.length],
    ];

    return selected.map((cust, idx) => {
      const units = Math.round(120 - idx * 20 + seedRand(seed + idx) * 40);
      const totalSpent = units * itemSellingPrice;
      const daysAgo = (idx + 1) * 4;
      const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      return {
        customerId: cust.id,
        customerName: cust.companyName,
        city: cust.city,
        state: cust.state,
        unitsPurchased: units,
        totalSpentINR: totalSpent,
        lastPurchaseDate: d.toISOString(),
      };
    });
  },

  async getItemDocuments(itemId: string): Promise<import('../types/itemDetail').ItemDocument[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [
      {
        id: `doc-${itemId}-1`,
        itemId,
        title: 'BIS IS:710 Marine Grade Compliance Certificate',
        fileType: 'pdf',
        fileSize: '1.8 MB',
        uploadedBy: 'Rajesh Sharma',
        uploadedAt: '2026-08-14T11:20:00Z',
        url: '#',
        category: 'Certificate',
      },
      {
        id: `doc-${itemId}-2`,
        itemId,
        title: 'Supplier Material Test Report & Moisture Analysis',
        fileType: 'pdf',
        fileSize: '3.4 MB',
        uploadedBy: 'Kavita Menon',
        uploadedAt: '2026-09-02T15:45:00Z',
        url: '#',
        category: 'Test Report',
      },
      {
        id: `doc-${itemId}-3`,
        itemId,
        title: 'Technical Specification Sheet (Rev 4.2)',
        fileType: 'pdf',
        fileSize: '820 KB',
        uploadedBy: 'Priya Patel',
        uploadedAt: '2026-07-19T09:10:00Z',
        url: '#',
        category: 'Spec Sheet',
      },
      {
        id: `doc-${itemId}-4`,
        itemId,
        title: 'Consignment Tax Invoice & E-Way Bill Copy',
        fileType: 'pdf',
        fileSize: '1.2 MB',
        uploadedBy: 'Amit Verma',
        uploadedAt: '2026-09-28T14:05:00Z',
        url: '#',
        category: 'Supplier Invoice',
      },
    ];
  },
};

