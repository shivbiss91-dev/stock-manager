import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Receipt,
  ArrowRightLeft,
  Printer,
  Package,
  Layers,
  MapPin,
  Building2,
  Calendar,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Tag,
  ShieldCheck,
  FileText,
  Upload,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  ChevronRight,
  Maximize2,
  Table as TableIcon,
  BarChart2,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { inventoryService } from '../../services/inventoryService';
import { itemAnalyticsService } from '../../services/itemAnalyticsService';
import { stockMovementService } from '../../services/stockMovementService';
import { ComputedInventoryItem } from '../../types/inventory';
import {
  SalesAnalyticsSummary,
  TopCustomerItemStat,
  StockMovementRecord,
  ItemDocument,
  TimeGranularity,
  MovementType,
} from '../../types/itemDetail';
import { useAuthStore } from '../../store/authStore';
import { formatINR } from '../../utils/formatINR';
import { formatDate } from '../../utils/dateUtils';
import { EditItemModal } from '../../components/itemDetail/EditItemModal';
import { TransferStockModal } from '../../components/itemDetail/TransferStockModal';
import { BarcodeLabelModal } from '../../components/itemDetail/BarcodeLabelModal';
import { useNotificationStore } from '../../store/notificationStore';

type ActiveTab = 'overview' | 'analytics' | 'movements' | 'documents';

export const ItemDetailPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const isAdmin = user?.role === 'owner' || user?.role === 'admin';

  // Item state
  const [item, setItem] = useState<ComputedInventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('analytics');

  // Analytics state
  const [granularity, setGranularity] = useState<TimeGranularity>('monthly');
  const [analytics, setAnalytics] = useState<SalesAnalyticsSummary | null>(null);
  const [topCustomers, setTopCustomers] = useState<TopCustomerItemStat[]>([]);
  const [analyticsViewMode, setAnalyticsViewMode] = useState<'chart' | 'table'>('chart');
  const [showSalesLine, setShowSalesLine] = useState(true);
  const [showUnitsLine, setShowUnitsLine] = useState(true);

  // Movements state
  const [movements, setMovements] = useState<StockMovementRecord[]>([]);
  const [movementFilter, setMovementFilter] = useState<MovementType | 'all'>('all');

  // Documents state
  const [documents, setDocuments] = useState<ItemDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  // Load item data
  useEffect(() => {
    let isMounted = true;
    async function loadItem() {
      if (!itemId) return;
      setIsLoading(true);
      try {
        const found = await inventoryService.getItemById(itemId);
        if (isMounted) {
          setItem(found);
          if (found) {
            // Load analytics, movements, docs
            const [analyticsRes, customersRes, movementsRes, docsRes] = await Promise.all([
              itemAnalyticsService.getSalesAnalytics(found.id, found.sellingPrice, granularity),
              itemAnalyticsService.getTopCustomers(found.id, found.sellingPrice),
              stockMovementService.getMovements({ itemId: found.id }),
              itemAnalyticsService.getItemDocuments(found.id),
            ]);
            if (isMounted) {
              setAnalytics(analyticsRes);
              setTopCustomers(customersRes);
              setMovements(movementsRes);
              setDocuments(docsRes);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load item detail:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadItem();
    return () => {
      isMounted = false;
    };
  }, [itemId]);

  // Reload analytics on granularity switch
  useEffect(() => {
    if (!item) return;
    let isMounted = true;
    itemAnalyticsService
      .getSalesAnalytics(item.id, item.sellingPrice, granularity)
      .then((data) => {
        if (isMounted) setAnalytics(data);
      });
    return () => {
      isMounted = false;
    };
  }, [granularity, item]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    if (movementFilter === 'all') return movements;
    return movements.filter((m) => m.type === movementFilter);
  }, [movements, movementFilter]);

  // Margin calculation for Admin
  const profitMarginPercent = useMemo(() => {
    if (!item || item.sellingPrice <= 0) return 0;
    const diff = item.sellingPrice - item.costPrice;
    return Math.round((diff / item.sellingPrice) * 1000) / 10;
  }, [item]);

  // Export Analytics to CSV
  const handleExportCSV = () => {
    if (!analytics || !item) return;
    const headers = ['Period', 'Sales (INR)', 'Units Sold', 'Orders Count'];
    const rows = analytics.chartData.map((d) => [
      `"${d.periodLabel}"`,
      d.salesINR.toFixed(2),
      d.unitsSold,
      d.ordersCount,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.sku}_Sales_Analytics_${granularity}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    addNotification({
      title: 'Analytics Exported',
      message: `Exported ${analytics.chartData.length} records for ${item.sku}.`,
      type: 'info',
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-72 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <Package className="w-16 h-16 mx-auto text-slate-400" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Item Not Found</h2>
        <p className="text-sm text-slate-500">
          The item identifier <code className="font-mono text-primary-500">{itemId}</code> was not found in the inventory ledger.
        </p>
        <Link
          to="/materials"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Materials</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Breadcrumbs & Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <Link to="/dashboard" className="hover:text-primary-600 dark:hover:text-accent-teal transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/materials" className="hover:text-primary-600 dark:hover:text-accent-teal transition-colors">
            Materials
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link
            to={`/materials/${item.materialCategory}`}
            className="capitalize hover:text-primary-600 dark:hover:text-accent-teal transition-colors"
          >
            {item.materialCategory}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-xs">
            {item.name}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Edit / Request Edit button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border transition-all flex items-center gap-1.5 ${
              isAdmin
                ? 'template-input border border-slate-300 dark:border-white/[0.08] text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isAdmin ? 'Edit Item' : 'Request Edit'}</span>
            {isAdmin ? (
              <span className="text-[10px] bg-accent-orange/20 text-accent-orange px-1.5 py-0.5 rounded font-bold">
                ADMIN
              </span>
            ) : (
              <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold">
                REQ
              </span>
            )}
          </button>

          {/* Transfer Stock */}
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-white/[0.08] template-input text-slate-700 dark:text-slate-200 hover:text-white transition flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-4 h-4 text-accent-blue" />
            <span>Transfer Stock</span>
          </button>

          {/* Print Label */}
          <button
            onClick={() => setIsLabelModalOpen(true)}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-white/[0.08] template-input text-slate-700 dark:text-slate-200 hover:text-white transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Label</span>
          </button>

          {/* Generate Bill / Invoice */}
          <button
            onClick={() => navigate(`/sales/invoices/new?itemId=${item.id}`)}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white shadow-sm transition flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4" />
            <span>Generate Bill</span>
          </button>
        </div>
      </div>

      {/* 2. Top Header Grid: Gallery & Info Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Product Images Gallery (5 cols) */}
        <div className="lg:col-span-5 template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-4 sm:p-5 shadow-soft space-y-4">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] flex items-center justify-center group">
            <img
              src={item.images[selectedImageIndex] || item.images[0]}
              alt={item.name}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                isImageZoomed ? 'scale-150 cursor-zoom-out' : 'group-hover:scale-105 cursor-zoom-in'
              }`}
              onClick={() => setIsImageZoomed(!isImageZoomed)}
            />

            {/* Category Chip */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-black/60 backdrop-blur-md text-white capitalize border border-white/20">
                {item.materialCategory} • {item.materialSubtype}
              </span>
            </div>

            {/* Zoom hint */}
            <button
              onClick={() => setIsImageZoomed(!isImageZoomed)}
              className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/50 text-white backdrop-blur-md opacity-80 hover:opacity-100 transition-opacity"
              title="Click to zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnails row */}
          {item.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {item.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImageIndex(idx);
                    setIsImageZoomed(false);
                  }}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-accent-orange scale-105 shadow-md'
                      : 'border-slate-200 dark:border-white/[0.08] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Quick Specifications list */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            <div className="flex justify-between">
              <span>Barcode (EAN-13):</span>
              <span className="font-mono text-slate-700 dark:text-slate-200">{item.barcode}</span>
            </div>
            <div className="flex justify-between">
              <span>HSN Classification:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{item.hsnCode}</span>
            </div>
            <div className="flex justify-between">
              <span>GST Tax Slab:</span>
              <span className="font-semibold text-accent-orange">{item.gstRate}%</span>
            </div>
          </div>
        </div>

        {/* Right: Master Info Card (7 cols) */}
        <div className="lg:col-span-7 template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-5 sm:p-6 shadow-soft space-y-5">
          {/* Header & Badges */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {item.sku}
              </span>

              {/* Status Badge */}
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${
                  item.stockStatus === 'in_stock'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : item.stockStatus === 'low_stock'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : item.stockStatus === 'dead_stock'
                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                }`}
              >
                ● {item.stockStatus.replace('_', ' ')}
              </span>

              <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Updated {formatDate(item.updatedAt)}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              {item.name}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
              {item.description}
            </p>
          </div>

          {/* Pricing & Stock Highlight Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/[0.06]">
            {/* Selling Price */}
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Wholesale Price</p>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {formatINR(item.sellingPrice)}
              </p>
              <p className="text-[10px] text-slate-400">excl. {item.gstRate}% GST</p>
            </div>

            {/* Current Stock */}
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Available Stock</p>
              <p
                className={`text-base sm:text-lg font-bold mt-0.5 ${
                  item.currentStock <= item.reorderLevel
                    ? 'text-amber-500'
                    : 'text-emerald-500'
                }`}
              >
                {item.currentStock.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-slate-500">{item.unit}</span>
              </p>
              <p className="text-[10px] text-slate-400">Reorder at {item.reorderLevel} {item.unit}</p>
            </div>

            {/* Admin Only: Cost Price */}
            <div>
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Cost Price</p>
                {!isAdmin && <Lock className="w-2.5 h-2.5 text-slate-400" />}
              </div>
              {isAdmin ? (
                <>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {formatINR(item.costPrice)}
                  </p>
                  <p className="text-[10px] text-accent-orange font-medium">ADMIN ONLY</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-slate-400 mt-1">••••••</p>
                  <p className="text-[10px] text-slate-400">Restricted</p>
                </>
              )}
            </div>

            {/* Admin Only: Margin */}
            <div>
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Margin</p>
                {!isAdmin && <Lock className="w-2.5 h-2.5 text-slate-400" />}
              </div>
              {isAdmin ? (
                <>
                  <p className="text-base sm:text-lg font-bold text-emerald-500 mt-0.5">
                    {profitMarginPercent}%
                  </p>
                  <p className="text-[10px] text-slate-400">
                    +{formatINR(item.sellingPrice - item.costPrice)} / {item.unit}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-slate-400 mt-1">••••••</p>
                  <p className="text-[10px] text-slate-400">Restricted</p>
                </>
              )}
            </div>
          </div>

          {/* Location & Supply Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06]">
              <MapPin className="w-4 h-4 text-accent-orange mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Storage Location</p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">{item.warehouseName}</p>
                <p className="text-[11px] font-mono text-slate-400">{item.rackLocation}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06]">
              <Building2 className="w-4 h-4 text-accent-blue mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Wholesale Supplier</p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">{item.supplierName}</p>
                <p className="text-[11px] text-slate-400">ID: {item.supplierId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tabbed Sections (Analytics, Overview, Movements, Documents) */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 border-b border-slate-200 dark:border-white/[0.06] overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'analytics'
                ? 'border-accent-orange text-accent-orange font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Sales Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'overview'
                ? 'border-accent-orange text-accent-orange font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Overview & Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'movements'
                ? 'border-accent-orange text-accent-orange font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Stock Movements</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06]">
              {movements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'documents'
                ? 'border-accent-orange text-accent-orange font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Documents</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06]">
              {documents.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Sales Analytics (Matching Reference Image 3) */}
        {activeTab === 'analytics' && analytics && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Controls Bar: Granularity toggle & Export actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Granularity buttons */}
              <div className="flex items-center p-1 template-input rounded-xl border border-slate-200 dark:border-white/[0.08] w-fit">
                {(['daily', 'weekly', 'monthly', 'yearly'] as TimeGranularity[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setGranularity(mode)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                      granularity === mode
                        ? 'bg-accent-orange text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* View switch & Export */}
              <div className="flex items-center gap-2">
                <div className="flex items-center template-input rounded-xl p-1 border border-slate-200 dark:border-white/[0.08]">
                  <button
                    onClick={() => setAnalyticsViewMode('chart')}
                    className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                      analyticsViewMode === 'chart'
                        ? 'bg-accent-orange text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Chart View"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setAnalyticsViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                      analyticsViewMode === 'table'
                        ? 'bg-accent-orange text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Table View"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/[0.08] template-input text-slate-700 dark:text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-accent-blue" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* 4 KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Sales */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06]">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Sales Value</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {formatINR(analytics.totalSalesINR)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-500">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{analytics.totalSalesChangePercent}% vs prior period</span>
                </div>
              </div>

              {/* Units Sold */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06]">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Units Sold</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {analytics.unitsSold.toLocaleString('en-IN')}{' '}
                  <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-500">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{analytics.unitsSoldChangePercent}% demand</span>
                </div>
              </div>

              {/* Avg Selling Price */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06]">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg Selling Realization</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {formatINR(analytics.avgSellingPriceINR)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                  <span>Strict (Sales ÷ Units)</span>
                </div>
              </div>

              {/* Order Count */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06]">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Invoices / Orders</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {analytics.ordersCount.toLocaleString('en-IN')}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-500">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{analytics.ordersChangePercent}% transactions</span>
                </div>
              </div>
            </div>

            {/* Dual-Axis Line Chart Card */}
            {analyticsViewMode === 'chart' ? (
              <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Revenue vs Demand Volume Trends
                    </h3>
                    <p className="text-xs text-slate-500">
                      Dual-axis comparison of Gross Sales (₹) on primary axis and Units Sold on secondary axis.
                    </p>
                  </div>

                  {/* Series Legend Toggles */}
                  <div className="flex items-center gap-4 text-xs">
                    <button
                      onClick={() => setShowSalesLine(!showSalesLine)}
                      className={`flex items-center gap-1.5 transition-opacity ${
                        showSalesLine ? 'opacity-100 font-semibold' : 'opacity-40'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-accent-blue inline-block"></span>
                      <span className="text-slate-700 dark:text-slate-200">Revenue (₹)</span>
                    </button>
                    <button
                      onClick={() => setShowUnitsLine(!showUnitsLine)}
                      className={`flex items-center gap-1.5 transition-opacity ${
                        showUnitsLine ? 'opacity-100 font-semibold' : 'opacity-40'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-accent-orange inline-block"></span>
                      <span className="text-slate-700 dark:text-slate-200">Units ({item.unit})</span>
                    </button>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                      <XAxis
                        dataKey="periodLabel"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      {/* Left Axis: INR Revenue */}
                      <YAxis
                        yAxisId="salesAxis"
                        orientation="left"
                        tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 11, fill: '#3B5BFF' }}
                        axisLine={{ stroke: '#3B5BFF' }}
                      />
                      {/* Right Axis: Quantity Units */}
                      <YAxis
                        yAxisId="unitsAxis"
                        orientation="right"
                        tickFormatter={(val) => `${val}`}
                        tick={{ fontSize: 11, fill: '#FF6B35' }}
                        axisLine={{ stroke: '#FF6B35' }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="p-3 bg-slate-900/95 text-white rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                                <p className="font-bold text-slate-300">{label}</p>
                                {payload.map((entry, idx) => (
                                  <p key={idx} style={{ color: entry.color }} className="flex justify-between gap-4">
                                    <span>{entry.name}:</span>
                                    <span className="font-semibold">
                                      {entry.dataKey === 'salesINR'
                                        ? formatINR(Number(entry.value))
                                        : `${entry.value} ${item.unit}`}
                                    </span>
                                  </p>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {showSalesLine && (
                        <Line
                          yAxisId="salesAxis"
                          type="monotone"
                          dataKey="salesINR"
                          name="Sales (₹)"
                          stroke="#3B5BFF"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: '#3B5BFF' }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                      {showUnitsLine && (
                        <Bar
                          yAxisId="unitsAxis"
                          dataKey="unitsSold"
                          name="Units Sold"
                          fill="#FF6B35"
                          opacity={0.8}
                          radius={[4, 4, 0, 0]}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              /* Tabular View */
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.06]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Period</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Revenue (₹)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Units Sold</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Avg Price / Unit</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Invoices</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-slate-700 dark:text-slate-300">
                    {analytics.chartData.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-4 font-medium">{d.periodLabel}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-emerald-500">
                          {formatINR(d.salesINR)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {d.unitsSold} {item.unit}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {formatINR(d.unitsSold > 0 ? d.salesINR / d.unitsSold : 0)}
                        </td>
                        <td className="py-2.5 px-4 text-right">{d.ordersCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Top Buyers / Customers Table Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Top Wholesale Buyers for this SKU
                  </h3>
                  <p className="text-xs text-slate-500">
                    Distributors and contractors with highest volume procurement.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06]">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Customer / Firm</th>
                      <th className="py-2.5 px-3 font-semibold">Location</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Total Units</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Gross Billing (₹)</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Last Purchase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-slate-700 dark:text-slate-300">
                    {topCustomers.map((cust) => (
                      <tr key={cust.customerId} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                          {cust.customerName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {cust.city}, {cust.state}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          {cust.unitsPurchased.toLocaleString('en-IN')} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-white">
                          {formatINR(cust.totalSpentINR)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          {formatDate(cust.lastPurchaseDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Overview & Technical Specs */}
        {activeTab === 'overview' && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Specifications */}
              <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-accent-orange" />
                  <span>Technical Specifications</span>
                </h3>

                <div className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Material Category</span>
                    <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                      {item.materialCategory}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Sub-Type Classification</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.materialSubtype}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Billing UoM</span>
                    <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                      {item.unit}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Reorder Trigger</span>
                    <span className="font-semibold text-amber-500">
                      {item.reorderLevel} {item.unit}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">HSN Tariff Code</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {item.hsnCode}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Standard GST Slab</span>
                    <span className="font-semibold text-accent-orange">
                      {item.gstRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Warehouse & Storage Logistics */}
              <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent-blue" />
                  <span>Warehouse Storage Information</span>
                </h3>

                <div className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Primary Warehouse</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.warehouseName}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Bin / Rack Coordinate</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {item.rackLocation}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Designated Supplier</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.supplierName}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Supplier Ledger ID</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {item.supplierId}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Stock Asset Value</span>
                    <span className="font-semibold text-emerald-500">
                      {formatINR(item.currentStock * item.costPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Notes */}
            <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Detailed Product Overview
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Stock Movement Ledger */}
        {activeTab === 'movements' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Inventory Movement Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Full audit trail of receipts, shipments, transfers, and warehouse adjustments.
                </p>
              </div>

              {/* Movement Type Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={movementFilter}
                  onChange={(e) => setMovementFilter(e.target.value as MovementType | 'all')}
                  className="px-3 py-2 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                >
                  <option value="all" className="dark:bg-dark-card">All Movements</option>
                  <option value="in" className="dark:bg-dark-card">Inward Receipts (PO)</option>
                  <option value="out" className="dark:bg-dark-card">Sales Dispatches (SO)</option>
                  <option value="transfer" className="dark:bg-dark-card">Inter-Hub Transfers</option>
                  <option value="return" className="dark:bg-dark-card">Sales Returns (Credit Notes)</option>
                  <option value="damage" className="dark:bg-dark-card">Damage / Write-offs</option>
                  <option value="adjustment" className="dark:bg-dark-card">Physical Audits</option>
                </select>

                <Link
                  to={`/stock-movements?itemId=${item.id}`}
                  className="px-3 py-1.5 text-xs font-semibold text-accent-blue hover:underline"
                >
                  View All Movements ➔
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.06]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Date & Time</th>
                    <th className="py-2.5 px-3 font-semibold">Type</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Quantity Delta</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Stock After</th>
                    <th className="py-2.5 px-3 font-semibold">Reference Document</th>
                    <th className="py-2.5 px-3 font-semibold">Logged By</th>
                    <th className="py-2.5 px-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-slate-700 dark:text-slate-300">
                  {filteredMovements.length > 0 ? (
                    filteredMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(m.date)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                              m.type === 'in'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : m.type === 'out'
                                ? 'bg-blue-500/10 text-accent-blue border border-blue-500/20'
                                : m.type === 'transfer'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : m.type === 'return'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : m.type === 'damage'
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                            m.quantityDelta > 0
                              ? 'text-emerald-500'
                              : 'text-rose-500'
                          }`}
                        >
                          {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta} {m.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium whitespace-nowrap">
                          {m.stockAfter} {m.unit}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-accent-blue whitespace-nowrap">
                          {m.referenceNumber}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{m.userName}</span>
                          <span className="text-[10px] text-slate-400 block">{m.userRole}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={m.notes}>
                          {m.notes}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No movement entries match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Documents & Compliance */}
        {activeTab === 'documents' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Compliance Certificates & Invoices
                </h3>
                <p className="text-xs text-slate-500">
                  Manage quality inspection certificates, BIS licenses, test reports, and consignments.
                </p>
              </div>

              {/* Upload Document simulation */}
              <button
                onClick={() => {
                  const newDoc: ItemDocument = {
                    id: `doc-${item.id}-${Date.now()}`,
                    itemId: item.id,
                    title: 'New Uploaded Quality Test Certificate.pdf',
                    fileType: 'pdf',
                    fileSize: '1.5 MB',
                    uploadedBy: user?.name || 'Administrator',
                    uploadedAt: new Date().toISOString(),
                    url: '#',
                    category: 'Test Report',
                  };
                  setDocuments([newDoc, ...documents]);
                  addNotification({
                    title: 'Document Uploaded',
                    message: 'New quality certification attached to item record.',
                    type: 'success',
                  });
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-accent-orange text-white hover:bg-accent-orange/90 transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] flex items-start justify-between gap-3 hover:shadow-xs transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {doc.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-white/[0.06]">
                          {doc.category}
                        </span>
                        <span>•</span>
                        <span>{doc.fileSize}</span>
                        <span>•</span>
                        <span>Uploaded by {doc.uploadedBy}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Dated {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        addNotification({
                          title: 'Viewing Document',
                          message: `Opening ${doc.title} in secure viewer.`,
                          type: 'info',
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.05] rounded-lg transition"
                      title="Preview Document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        addNotification({
                          title: 'Downloading Document',
                          message: `Downloading ${doc.title} (${doc.fileSize})`,
                          type: 'info',
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.05] rounded-lg transition"
                      title="Download Document"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isEditModalOpen && (
        <EditItemModal
          item={item}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onItemUpdated={(updated) => setItem(updated)}
        />
      )}

      {isTransferModalOpen && (
        <TransferStockModal
          item={item}
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onTransferComplete={async () => {
            const reloaded = await inventoryService.getItemById(item.id);
            if (reloaded) setItem(reloaded);
            const m = await stockMovementService.getMovements({ itemId: item.id });
            setMovements(m);
          }}
        />
      )}

      {isLabelModalOpen && (
        <BarcodeLabelModal
          item={item}
          isOpen={isLabelModalOpen}
          onClose={() => setIsLabelModalOpen(false)}
        />
      )}
    </div>
  );
};
