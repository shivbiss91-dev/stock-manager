import { describe, it, expect } from 'vitest';
import { userService } from '../services/userService';
import { auditLogService } from '../services/auditLogService';
import { approvalsService } from '../services/approvalsService';
import { documentsService } from '../services/documentsService';
import { backupService } from '../services/backupService';
import { settingsService } from '../services/settingsService';

describe('Phase 7: Administration, Roles, Approvals, Audit & Recovery', () => {
  it('User Service: fetches, creates, updates roles, and toggles status', async () => {
    const users = await userService.getUsers();
    expect(users.length).toBeGreaterThan(0);

    const testStaff = users.find((u) => u.role === 'staff');
    expect(testStaff).toBeDefined();

    if (testStaff) {
      // Role promotion
      const promoted = await userService.updateUserRole(testStaff.id, 'manager');
      expect(promoted.role).toBe('manager');
      expect(promoted.roleTitle).toBe('Operations Manager');

      // Status toggle
      const initialStatus = promoted.status;
      const toggled = await userService.toggleUserStatus(testStaff.id);
      expect(toggled.status).not.toBe(initialStatus);

      // Revert status
      const reverted = await userService.toggleUserStatus(testStaff.id);
      expect(reverted.status).toBe(initialStatus);
    }

    // Create user
    const newUser = await userService.createUser({
      name: 'Rohan Sharma',
      email: 'rohan.sharma@stockvista.in',
      phone: '+91 98200 99887',
      role: 'staff',
      roleTitle: 'Billing Staff',
      warehouseId: 'wh-001',
      status: 'active',
    });
    expect(newUser.id).toBeDefined();
    expect(newUser.name).toBe('Rohan Sharma');
  });

  it('Audit Log Service: retrieves logs, filters by module/action, and appends events', async () => {
    const initialLogs = await auditLogService.getAuditLogs();
    expect(initialLogs.length).toBeGreaterThan(0);

    // Filter by module
    const salesLogs = await auditLogService.getAuditLogs({ module: 'Sales' });
    salesLogs.forEach((l) => expect(l.module.toLowerCase()).toBe('sales'));

    // Append new audit event
    const newEntry = await auditLogService.logAction({
      userId: 'usr-001',
      userName: 'Rajesh Sharma',
      userRole: 'admin',
      action: 'price_update',
      module: 'Inventory',
      targetId: 'item-wd-0001',
      targetDescription: 'Bulk price revision for Teak Plywood 18mm',
      oldValue: '₹2,450.00',
      newValue: '₹2,490.00',
    });

    expect(newEntry.id).toBeDefined();
    expect(newEntry.timestamp).toBeDefined();

    const updatedLogs = await auditLogService.getAuditLogs();
    expect(updatedLogs[0]?.id).toBe(newEntry.id);
  });

  it('Approvals Service: manages two-tier approval workflow', async () => {
    const pendingList = await approvalsService.getApprovals('pending');
    expect(pendingList.length).toBeGreaterThan(0);

    const firstItem = pendingList[0];
    expect(firstItem?.status).toBe('pending');

    // Create a new request to test approval without mutating seed data
    const createdRequest = await approvalsService.createRequest({
      type: 'price_adjustment',
      targetId: 'item-wd-0002',
      targetTitle: 'Gurjan Marine MR 12mm Grade A',
      requestedBy: 'Amit Verma',
      requestedByRole: 'staff',
      reason: 'Special concession for volume contractor',
      oldValue: '₹1,850.00 / sheet',
      newValue: '₹1,780.00 / sheet',
    });

    expect(createdRequest.id).toBeDefined();
    expect(createdRequest.status).toBe('pending');

    // Approve the request
    const approved = await approvalsService.approveRequest(
      createdRequest.id,
      'Rajesh Sharma (Admin)',
      'Verified with director'
    );
    expect(approved.status).toBe('approved');
    expect(approved.reviewedBy).toBe('Rajesh Sharma (Admin)');
    expect(approved.reviewNotes).toBe('Verified with director');
  });

  it('Documents Service: archives, categorizes, and manages compliance files', async () => {
    const docs = await documentsService.getDocuments();
    expect(docs.length).toBeGreaterThan(0);

    // Filter by category
    const bisDocs = await documentsService.getDocuments({ category: 'BIS & Quality' });
    bisDocs.forEach((d) => expect(d.category).toBe('BIS & Quality'));

    // Add new document
    const newDoc = await documentsService.addDocument({
      title: 'Pollution Control Board Clearance Certificate',
      category: 'BIS & Quality',
      fileName: 'MPCB_Clearance_2026.pdf',
      fileSize: '2.3 MB',
      fileType: 'pdf',
      uploadedBy: 'Suresh Patil',
      status: 'verified',
      issuer: 'Maharashtra Pollution Control Board',
    });

    expect(newDoc.id).toBeDefined();

    // Delete document
    const deleted = await documentsService.deleteDocument(newDoc.id);
    expect(deleted).toBe(true);
  });

  it('Backup Service: serializes full snapshot and validates restoration', async () => {
    const snapshot = await backupService.generateSnapshot();
    expect(snapshot.version).toBe('2.1.0');
    expect(snapshot.metadata.itemsCount).toBe(3420);
    expect(snapshot.metadata.customersCount).toBeGreaterThan(0);
    expect(snapshot.metadata.warehousesCount).toBe(5);

    // Successful JSON parse validation
    const jsonStr = JSON.stringify(snapshot);
    const restoreResult = await backupService.restoreSnapshot(jsonStr);
    expect(restoreResult.success).toBe(true);
    expect(restoreResult.metadata?.itemsCount).toBe(3420);

    // Corrupted input test
    const corruptedResult = await backupService.restoreSnapshot('invalid-non-json');
    expect(corruptedResult.success).toBe(false);
  });

  it('Settings Service: reads and persists company GSTIN and billing parameters', async () => {
    const settings = await settingsService.getSettings();
    expect(settings.gstin).toBe('27AABCS1429B1Z2');
    expect(settings.bankName).toBe('HDFC Bank Ltd');
    expect(settings.stateCode).toBe('27');

    // Update settings
    const updated = await settingsService.updateSettings({
      defaultPaymentTermsDays: 45,
    });
    expect(updated.defaultPaymentTermsDays).toBe(45);

    // Revert for cleanliness
    await settingsService.updateSettings({
      defaultPaymentTermsDays: 30,
    });
  });
});
