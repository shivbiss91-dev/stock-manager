import { StorageService, STORAGE_KEYS } from './storageService';

export interface ApprovalRequest {
  id: string;
  type: 'price_adjustment' | 'stock_adjustment' | 'item_edit' | 'discount_approval';
  targetId: string;
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

export const approvalsService = {
  async getApprovals(status?: 'pending' | 'approved' | 'rejected'): Promise<ApprovalRequest[]> {
    await new Promise((res) => setTimeout(res, 20));
    const list = StorageService.get<ApprovalRequest[]>(STORAGE_KEYS.APPROVALS, []);
    if (!status) return [...list];
    return list.filter((a) => a.status === status);
  },

  async submitRequest(request: Omit<ApprovalRequest, 'id' | 'status' | 'requestedAt'>): Promise<ApprovalRequest> {
    await new Promise((res) => setTimeout(res, 30));
    const list = StorageService.get<ApprovalRequest[]>(STORAGE_KEYS.APPROVALS, []);
    const newRequest: ApprovalRequest = {
      ...request,
      id: `appr-${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    list.unshift(newRequest);
    StorageService.set(STORAGE_KEYS.APPROVALS, list);
    return newRequest;
  },

  async createRequest(request: Omit<ApprovalRequest, 'id' | 'status' | 'requestedAt'>): Promise<ApprovalRequest> {
    return approvalsService.submitRequest(request);
  },

  async createApproval(request: Omit<ApprovalRequest, 'id' | 'status' | 'requestedAt'>): Promise<ApprovalRequest> {
    return approvalsService.submitRequest(request);
  },

  async reviewRequest(
    id: string,
    decision: 'approved' | 'rejected',
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<ApprovalRequest> {
    await new Promise((res) => setTimeout(res, 30));
    const list = StorageService.get<ApprovalRequest[]>(STORAGE_KEYS.APPROVALS, []);
    const request = list.find((a) => a.id === id);
    if (!request) throw new Error('Approval request not found');

    request.status = decision;
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date().toISOString();
    request.reviewNotes = reviewNotes;

    StorageService.set(STORAGE_KEYS.APPROVALS, list);
    return { ...request };
  },

  async approveRequest(
    id: string,
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<ApprovalRequest> {
    return approvalsService.reviewRequest(id, 'approved', reviewedBy, reviewNotes);
  },

  async rejectRequest(
    id: string,
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<ApprovalRequest> {
    return approvalsService.reviewRequest(id, 'rejected', reviewedBy, reviewNotes);
  },

  _seedApprovalsForTesting(approvals: ApprovalRequest[]): void {
    StorageService.set(STORAGE_KEYS.APPROVALS, approvals);
  },
};
