export interface ApprovalRequest {
  id: string;
  type: 'price_adjustment' | 'stock_adjustment' | 'item_edit' | 'discount_approval';
  targetId: string; // itemId or invoiceId
  targetTitle: string;
  requestedBy: string;
  requestedByRole: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  oldValue: string;
  newValue: string;
  reason: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

let approvalsDatabase: ApprovalRequest[] = [
  {
    id: 'appr-1',
    type: 'price_adjustment',
    targetId: 'item-wd-0001',
    targetTitle: 'Gurjan BWP Marine Plywood 18mm',
    requestedBy: 'Amit Verma',
    requestedByRole: 'Billing Staff',
    requestedAt: '2026-10-08T10:15:00Z',
    status: 'pending',
    oldValue: '₹2,450.00 / sheet',
    newValue: '₹2,320.00 / sheet (-5.3%)',
    reason: 'Client Apex Furnishings placing bulk order of 250 sheets',
  },
  {
    id: 'appr-2',
    type: 'discount_approval',
    targetId: 'inv-2026-00392',
    targetTitle: 'Invoice INV-2026-27-00392 (Balaji Contractors)',
    requestedBy: 'Amit Verma',
    requestedByRole: 'Billing Staff',
    requestedAt: '2026-10-07T16:30:00Z',
    status: 'pending',
    oldValue: 'Standard 2% Discount',
    newValue: 'Requested 4.5% Special Discount',
    reason: 'Advance RTGS payment clearance agreed',
  },
  {
    id: 'appr-3',
    type: 'stock_adjustment',
    targetId: 'item-mt-0012',
    targetTitle: 'Tata Tiscon TMT Fe550D (16mm)',
    requestedBy: 'Priya Patel',
    requestedByRole: 'Manager',
    requestedAt: '2026-10-06T14:00:00Z',
    status: 'pending',
    oldValue: '120 Bundles',
    newValue: '115 Bundles (-5 write-off)',
    reason: 'Transit bend damage during trailer unloading',
  },
];

export const approvalsService = {
  async getApprovals(): Promise<ApprovalRequest[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...approvalsDatabase];
  },

  async createApproval(request: Omit<ApprovalRequest, 'id' | 'requestedAt' | 'status'>): Promise<ApprovalRequest> {
    await new Promise((res) => setTimeout(res, 50));
    const created: ApprovalRequest = {
      ...request,
      id: `appr-${Date.now()}`,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };
    approvalsDatabase.unshift(created);
    return created;
  },

  async createRequest(request: Omit<ApprovalRequest, 'id' | 'requestedAt' | 'status'>): Promise<ApprovalRequest> {
    return this.createApproval(request);
  },

  async approveRequest(id: string, reviewedBy: string, reviewNotes?: string): Promise<ApprovalRequest> {
    await new Promise((res) => setTimeout(res, 50));
    const item = approvalsDatabase.find((a) => a.id === id);
    if (!item) throw new Error('Request not found');

    item.status = 'approved';
    item.reviewedBy = reviewedBy;
    item.reviewedAt = new Date().toISOString();
    item.reviewNotes = reviewNotes || 'Approved by administrator';
    return item;
  },

  async rejectRequest(id: string, reviewedBy: string, reviewNotes: string): Promise<ApprovalRequest> {
    await new Promise((res) => setTimeout(res, 50));
    const item = approvalsDatabase.find((a) => a.id === id);
    if (!item) throw new Error('Request not found');

    item.status = 'rejected';
    item.reviewedBy = reviewedBy;
    item.reviewedAt = new Date().toISOString();
    item.reviewNotes = reviewNotes;
    return item;
  },
};
