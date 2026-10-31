import { StorageService, STORAGE_KEYS } from './storageService';

export interface ComplianceDocument {
  id: string;
  title: string;
  category: 'BIS & Quality' | 'E-Way Bills' | 'Transporter LRs' | 'Mill Test Reports' | 'GST & Statutory';
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'xlsx' | 'jpg' | 'png';
  linkedEntity?: string;
  uploadedBy: string;
  uploadedAt: string;
  expiryDate?: string;
  status: 'verified' | 'pending' | 'expired';
  issuer: string;
}

export const documentsService = {
  async getDocuments(category?: string, search?: string): Promise<ComplianceDocument[]> {
    await new Promise((res) => setTimeout(res, 20));
    let list = StorageService.get<ComplianceDocument[]>(STORAGE_KEYS.DOCUMENTS, []);

    if (category && category !== 'all') {
      list = list.filter((d) => d.category === category);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.issuer.toLowerCase().includes(q) ||
          (d.linkedEntity && d.linkedEntity.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  },

  async uploadDocument(doc: Omit<ComplianceDocument, 'id' | 'uploadedAt'>): Promise<ComplianceDocument> {
    await new Promise((res) => setTimeout(res, 40));
    const list = StorageService.get<ComplianceDocument[]>(STORAGE_KEYS.DOCUMENTS, []);
    const newDoc: ComplianceDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    list.unshift(newDoc);
    StorageService.set(STORAGE_KEYS.DOCUMENTS, list);
    return newDoc;
  },

  async addDocument(doc: Omit<ComplianceDocument, 'id' | 'uploadedAt'>): Promise<ComplianceDocument> {
    return documentsService.uploadDocument(doc);
  },

  async deleteDocument(id: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 30));
    const list = StorageService.get<ComplianceDocument[]>(STORAGE_KEYS.DOCUMENTS, []);
    const updated = list.filter((d) => d.id !== id);
    StorageService.set(STORAGE_KEYS.DOCUMENTS, updated);
    return true;
  },

  _seedDocumentsForTesting(docs: ComplianceDocument[]): void {
    StorageService.set(STORAGE_KEYS.DOCUMENTS, docs);
  },
};
