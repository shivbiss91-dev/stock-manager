import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileCheck,
  ExternalLink,
  Plus,
  X,
  FileSpreadsheet,
  FileImage,
  FolderOpen,
} from 'lucide-react';
import { documentsService, ComplianceDocument } from '../../services/documentsService';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils/dateUtils';

export const DocumentsPage: React.FC = () => {
  const { addNotification } = useNotificationStore();
  const { user } = useAuthStore();

  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<ComplianceDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // New document form state
  const [newDocData, setNewDocData] = useState({
    title: '',
    category: 'BIS & Quality' as ComplianceDocument['category'],
    fileName: '',
    issuer: '',
    linkedEntity: '',
    expiryDate: '',
    fileType: 'pdf' as ComplianceDocument['fileType'],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const data = await documentsService.getDocuments({
        category: selectedCategory,
        search: searchQuery,
      });
      setDocuments(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocs();
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${docTitle}"?`)) return;

    const success = await documentsService.deleteDocument(docId);
    if (success) {
      setDocuments(documents.filter((d) => d.id !== docId));
      addNotification({
        title: 'Document Removed',
        message: `${docTitle} has been deleted.`,
        type: 'info',
      });
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocData.title.trim() || !newDocData.issuer.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Document title and issuing authority are mandatory.',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await documentsService.addDocument({
        title: newDocData.title.trim(),
        category: newDocData.category,
        fileName: newDocData.fileName.trim() || `${newDocData.title.replace(/\s+/g, '_')}.pdf`,
        fileSize: '1.4 MB',
        fileType: newDocData.fileType,
        linkedEntity: newDocData.linkedEntity.trim() || undefined,
        uploadedBy: user?.name || 'Administrator',
        expiryDate: newDocData.expiryDate || undefined,
        status: 'verified',
        issuer: newDocData.issuer.trim(),
      });

      setDocuments([created, ...documents]);
      addNotification({
        title: 'Document Uploaded',
        message: `${created.title} has been archived in the repository.`,
        type: 'success',
      });

      setIsUploadModalOpen(false);
      setNewDocData({
        title: '',
        category: 'BIS & Quality',
        fileName: '',
        issuer: '',
        linkedEntity: '',
        expiryDate: '',
        fileType: 'pdf',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatedDownload = (doc: ComplianceDocument) => {
    addNotification({
      title: 'Downloading Document',
      message: `Fetching ${doc.fileName} (${doc.fileSize})...`,
      type: 'info',
    });
  };

  const getFileIcon = (type: ComplianceDocument['fileType']) => {
    switch (type) {
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'jpg':
      case 'png':
        return <FileImage className="w-5 h-5 text-purple-600" />;
      case 'pdf':
      default:
        return <FileText className="w-5 h-5 text-rose-600" />;
    }
  };

  const verifiedCount = documents.filter((d) => d.status === 'verified').length;
  const pendingCount = documents.filter((d) => d.status === 'pending').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent-orange/10 rounded-xl text-accent-orange border border-accent-orange/20">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Compliance & Documents Repository
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized archive for BIS licenses, E-Way bills, transporter lorry receipts, mill test reports, and GST filings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white transition flex items-center gap-2 shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* KPI Overview row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Archives
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900 dark:text-white">{documents.length}</span>
            <span className="text-xs text-slate-400">files</span>
          </div>
        </div>

        <div className="p-4 template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
            Verified & Valid
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-emerald-400">{verifiedCount}</span>
            <span className="text-xs text-slate-400">records</span>
          </div>
        </div>

        <div className="p-4 template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
            Pending Audit
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-amber-400">{pendingCount}</span>
            <span className="text-xs text-slate-400">review</span>
          </div>
        </div>

        <div className="p-4 template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Vault Utilization
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900 dark:text-white">11.8 MB</span>
            <span className="text-xs text-slate-400">of 10 GB</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-4 shadow-soft space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, file name, issuing authority, or linked order/LR..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white transition shadow-xs"
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          {[
            'all',
            'BIS & Quality',
            'E-Way Bills',
            'Transporter LRs',
            'Mill Test Reports',
            'GST & Statutory',
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-accent-orange text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Documents' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-slate-400">Loading documents...</div>
        ) : documents.length > 0 ? (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-5 shadow-soft hover:border-accent-orange/40 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] flex-shrink-0">
                    {getFileIcon(doc.fileType)}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      doc.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : doc.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2" title={doc.title}>
                    {doc.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate" title={doc.fileName}>
                    {doc.fileName} ({doc.fileSize})
                  </p>
                </div>

                <div className="space-y-1 text-xs pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Authority / Issuer:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[160px]" title={doc.issuer}>
                      {doc.issuer}
                    </span>
                  </div>

                  {doc.linkedEntity && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Linked Reference:</span>
                      <span className="font-mono font-semibold text-accent-blue truncate max-w-[160px]">
                        {doc.linkedEntity}
                      </span>
                    </div>
                  )}

                  {doc.expiryDate && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Valid Until:</span>
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        {formatDate(doc.expiryDate)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Uploaded by:</span>
                    <span className="text-slate-600 dark:text-slate-400">{doc.uploadedBy}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="px-2.5 py-1 text-xs font-semibold text-accent-orange hover:bg-accent-orange/10 rounded-lg transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSimulatedDownload(doc)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition"
                    title="Download document"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id, doc.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-slate-400 template-card rounded-[20px] border border-slate-200 dark:border-white/[0.06] space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-400" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No documents found</p>
            <p className="text-xs">Try selecting a different category or upload a new record.</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Archive Compliance Document
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={newDocData.title}
                  onChange={(e) => setNewDocData({ ...newDocData, title: e.target.value })}
                  placeholder="e.g. BIS IS:303 Certification 2026-27"
                  className="w-full px-3 py-2 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={newDocData.category}
                    onChange={(e) =>
                      setNewDocData({
                        ...newDocData,
                        category: e.target.value as ComplianceDocument['category'],
                      })
                    }
                    className="w-full px-3 py-2 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  >
                    <option value="BIS & Quality" className="dark:bg-dark-card">BIS & Quality</option>
                    <option value="E-Way Bills" className="dark:bg-dark-card">E-Way Bills</option>
                    <option value="Transporter LRs" className="dark:bg-dark-card">Transporter LRs</option>
                    <option value="Mill Test Reports" className="dark:bg-dark-card">Mill Test Reports</option>
                    <option value="GST & Statutory" className="dark:bg-dark-card">GST & Statutory</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    File Format
                  </label>
                  <select
                    value={newDocData.fileType}
                    onChange={(e) =>
                      setNewDocData({
                        ...newDocData,
                        fileType: e.target.value as ComplianceDocument['fileType'],
                      })
                    }
                    className="w-full px-3 py-2 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  >
                    <option value="pdf" className="dark:bg-dark-card">PDF (.pdf)</option>
                    <option value="xlsx" className="dark:bg-dark-card">Excel (.xlsx)</option>
                    <option value="jpg" className="dark:bg-dark-card">Image (.jpg / .png)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Issuing Authority / Mill *
                </label>
                <input
                  type="text"
                  required
                  value={newDocData.issuer}
                  onChange={(e) => setNewDocData({ ...newDocData, issuer: e.target.value })}
                  placeholder="e.g. Bureau of Indian Standards / NIC"
                  className="w-full px-3 py-2 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Linked PO / Order ID
                  </label>
                  <input
                    type="text"
                    value={newDocData.linkedEntity}
                    onChange={(e) => setNewDocData({ ...newDocData, linkedEntity: e.target.value })}
                    placeholder="e.g. PO-2026-0045"
                    className="w-full px-3 py-2 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={newDocData.expiryDate}
                    onChange={(e) => setNewDocData({ ...newDocData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  />
                </div>
              </div>

              {/* Mock upload dropzone */}
              <div className="border-2 border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl p-4 text-center bg-slate-50/50 dark:bg-white/[0.02]">
                <Upload className="w-6 h-6 mx-auto text-accent-orange mb-1" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Drag & drop file or click to browse
                </span>
                <span className="text-[10px] text-slate-400">
                  Supports PDF, JPEG, PNG, Excel up to 25 MB
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white transition shadow-sm"
                >
                  Archive Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                {getFileIcon(selectedDoc.fileType)}
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedDoc.title}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedDoc.fileName} • {selectedDoc.fileSize}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Document Preview Box */}
            <div className="h-64 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {selectedDoc.issuer}
                  </div>
                  <div className="text-[10px] text-slate-500">Government of India / Statutory Body</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                    DIGITALLY SIGNED & VERIFIED
                  </span>
                </div>
              </div>

              <div className="text-center py-6 space-y-1">
                <FileCheck className="w-10 h-10 mx-auto text-accent-orange mb-2" />
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {selectedDoc.title}
                </h4>
                <p className="text-xs text-slate-500">
                  Target Entity: {selectedDoc.linkedEntity || 'Central Warehouse Network'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Recorded on {formatDate(selectedDoc.uploadedAt)} by {selectedDoc.uploadedBy}
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200 dark:border-white/[0.06] pt-2">
                <span>Ref Hash: SHA256-8a9f02c771b9...</span>
                <span>StockVista Enterprise Vault</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Status: <strong className="text-emerald-400 capitalize">{selectedDoc.status}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleSimulatedDownload(selectedDoc);
                    setSelectedDoc(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
