export interface ComplianceDocument {
  id: string;
  title: string;
  category: 'BIS & Quality' | 'E-Way Bills' | 'Transporter LRs' | 'Mill Test Reports' | 'GST & Statutory';
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'xlsx' | 'jpg' | 'png';
  linkedEntity?: string; // e.g. PO-2026-0045, INV-2026-27-00039
  uploadedBy: string;
  uploadedAt: string; // ISO
  expiryDate?: string; // ISO
  status: 'verified' | 'pending' | 'expired';
  issuer: string;
}

let documentsDatabase: ComplianceDocument[] = [
  {
    id: 'doc-001',
    title: 'BIS IS:303 Moisture Resistant Plywood License',
    category: 'BIS & Quality',
    fileName: 'BIS_IS303_License_2026_27.pdf',
    fileSize: '1.8 MB',
    fileType: 'pdf',
    linkedEntity: 'Greenply Industries Ltd',
    uploadedBy: 'Rajesh Sharma',
    uploadedAt: '2026-09-15T10:00:00Z',
    expiryDate: '2027-09-14T23:59:59Z',
    status: 'verified',
    issuer: 'Bureau of Indian Standards (BIS)',
  },
  {
    id: 'doc-002',
    title: 'GST Registration Certificate Form GST REG-06',
    category: 'GST & Statutory',
    fileName: 'GST_Registration_Certificate_27AABCS1429B1Z2.pdf',
    fileSize: '840 KB',
    fileType: 'pdf',
    uploadedBy: 'Rajesh Sharma',
    uploadedAt: '2026-04-01T09:30:00Z',
    status: 'verified',
    issuer: 'Goods & Services Tax Network (GSTN)',
  },
  {
    id: 'doc-003',
    title: 'E-Way Bill Slip 3829-1048-1239 (Bhiwandi to Panvel)',
    category: 'E-Way Bills',
    fileName: 'EWB_382910481239.pdf',
    fileSize: '320 KB',
    fileType: 'pdf',
    linkedEntity: 'TR-2026-031',
    uploadedBy: 'Suresh Patil',
    uploadedAt: '2026-10-03T11:20:00Z',
    expiryDate: '2026-10-05T23:59:59Z',
    status: 'verified',
    issuer: 'National Informatics Centre (NIC)',
  },
  {
    id: 'doc-004',
    title: 'VRL Logistics Lorry Receipt LR-MH-99482',
    category: 'Transporter LRs',
    fileName: 'VRL_LR_MH_99482.jpg',
    fileSize: '2.1 MB',
    fileType: 'jpg',
    linkedEntity: 'PO-2026-0045',
    uploadedBy: 'Priya Patel',
    uploadedAt: '2026-10-05T16:45:00Z',
    status: 'verified',
    issuer: 'VRL Logistics Ltd',
  },
  {
    id: 'doc-005',
    title: 'Mill Test Certificate (MTC) Grade 304 Stainless Sheets',
    category: 'Mill Test Reports',
    fileName: 'Jindal_Stainless_MTC_Lot_882.pdf',
    fileSize: '3.4 MB',
    fileType: 'pdf',
    linkedEntity: 'GRN-2026-0087',
    uploadedBy: 'Suresh Patil',
    uploadedAt: '2026-09-28T14:10:00Z',
    status: 'verified',
    issuer: 'Jindal Stainless Metallurgical Lab',
  },
  {
    id: 'doc-006',
    title: 'GSTR-3B Tax Return Filing Acknowledgement (Sept 2026)',
    category: 'GST & Statutory',
    fileName: 'GSTR3B_Ack_Sep_2026.pdf',
    fileSize: '620 KB',
    fileType: 'pdf',
    uploadedBy: 'Rajesh Sharma',
    uploadedAt: '2026-10-02T18:00:00Z',
    status: 'verified',
    issuer: 'Directorate of Commercial Taxes, Maharashtra',
  },
  {
    id: 'doc-007',
    title: 'Fire Safety NOC - Bhiwandi Central Warehouse Hub',
    category: 'BIS & Quality',
    fileName: 'Fire_Safety_NOC_Bhiwandi_2026.pdf',
    fileSize: '1.2 MB',
    fileType: 'pdf',
    uploadedBy: 'Suresh Patil',
    uploadedAt: '2026-03-20T11:00:00Z',
    expiryDate: '2027-03-19T23:59:59Z',
    status: 'verified',
    issuer: 'Maharashtra Fire Services',
  },
  {
    id: 'doc-008',
    title: 'E-Way Bill 5192-8839-2910 (Consignment Inward)',
    category: 'E-Way Bills',
    fileName: 'EWB_519288392910.pdf',
    fileSize: '310 KB',
    fileType: 'pdf',
    linkedEntity: 'PO-2026-0046',
    uploadedBy: 'Amit Verma',
    uploadedAt: '2026-10-07T08:30:00Z',
    status: 'pending',
    issuer: 'National Informatics Centre (NIC)',
  },
];

export const documentsService = {
  async getDocuments(filters?: {
    category?: string;
    search?: string;
  }): Promise<ComplianceDocument[]> {
    await new Promise((res) => setTimeout(res, 40));
    let list = [...documentsDatabase];

    if (filters?.category && filters.category !== 'all') {
      list = list.filter((d) => d.category.toLowerCase() === filters.category!.toLowerCase());
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.issuer.toLowerCase().includes(q) ||
          (d.linkedEntity && d.linkedEntity.toLowerCase().includes(q))
      );
    }

    return list.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  },

  async addDocument(
    doc: Omit<ComplianceDocument, 'id' | 'uploadedAt'>
  ): Promise<ComplianceDocument> {
    await new Promise((res) => setTimeout(res, 60));
    const newDoc: ComplianceDocument = {
      ...doc,
      id: `doc-${String(documentsDatabase.length + 1).padStart(3, '0')}`,
      uploadedAt: new Date().toISOString(),
    };
    documentsDatabase.unshift(newDoc);
    return { ...newDoc };
  },

  async deleteDocument(id: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 40));
    const idx = documentsDatabase.findIndex((d) => d.id === id);
    if (idx !== -1) {
      documentsDatabase.splice(idx, 1);
      return true;
    }
    return false;
  },
};
