import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { materialsService, MaterialTileSummary } from '../../services/materialsService';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { formatINR } from '../../utils/formatINR';
import { MaterialCategory } from '../../types/inventory';
import {
  Layers,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Edit2,
  Package,
  Boxes,
  CheckCircle2,
} from 'lucide-react';

export const MaterialsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedWarehouseId } = useUIStore();

  const [categories, setCategories] = useState<MaterialTileSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin category name editing
  const [editCategory, setEditCategory] = useState<MaterialTileSummary | null>(null);
  const [newName, setNewName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const isAdmin = user?.role === 'admin';

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await materialsService.getCategories(selectedWarehouseId);
      setCategories(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [selectedWarehouseId]);

  const handleEditClick = (e: React.MouseEvent, cat: MaterialTileSummary) => {
    e.stopPropagation();
    setEditCategory(cat);
    setNewName(cat.name);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory || !newName.trim()) return;
    setIsSavingName(true);
    try {
      await materialsService.updateCategoryName(editCategory.id, newName.trim());
      setIsSavingName(false);
      setEditCategory(null);
      loadCategories();
    } catch {
      setIsSavingName(false);
    }
  };

  const renderMiniSparkline = (data: number[]) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke="#FF6B35"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#12151D] p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
              Wholesale Master Categories
            </span>
            <Badge variant="solid-blue" size="sm">
              8 Material Classes
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
            Raw Materials & Commodity Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#9AA0AE] mt-1">
            Browse warehouse stock grouped by commercial material classes. Select any tile to enter the category catalog.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <span className="text-xs text-slate-400 italic hidden md:inline">
              (Admin Mode: Click ✏️ on any category to rename)
            </span>
          )}
        </div>
      </div>

      {/* Grid of 8 Material Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-slate-100 dark:bg-[#12151D] animate-pulse border border-slate-200/60 dark:border-white/[0.06]"
              />
            ))
          : categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => navigate(`/materials/${cat.id}`)}
                className="group relative rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#181B25] dark:to-[#12151D] border border-slate-200/80 dark:border-white/[0.08] hover:border-brand-orange/60 dark:hover:border-brand-orange/60 transition-all duration-200 shadow-sm hover:shadow-[0_0_20px_rgba(255,107,53,0.15)] cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Hero Image Header with Gradient Overlay */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-[11px] font-bold text-white border border-white/20">
                      {cat.itemCount.toLocaleString('en-IN')} SKUs
                    </span>

                    {cat.lowStockCount > 0 ? (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 text-[10.5px] font-extrabold flex items-center gap-1 shadow-sm">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{cat.lowStockCount} Low Stock</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-xl bg-emerald-500 text-white text-[10px] font-bold">
                        Stock Stable
                      </span>
                    )}
                  </div>

                  {/* Category Title & Admin Edit Trigger */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-white tracking-tight drop-shadow-sm flex items-center gap-2">
                      <span>{cat.name}</span>
                    </h3>

                    {isAdmin && (
                      <button
                        onClick={(e) => handleEditClick(e, cat)}
                        className="p-1.5 rounded-xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-colors"
                        title="Rename category (Admin only)"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Content & Metrics */}
                <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-500 dark:text-[#9AA0AE] line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Total Volume:</span>
                      <span className="font-bold text-slate-800 dark:text-[#F2F4F8]">
                        {cat.totalPieces.toLocaleString('en-IN')} units
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Wholesale Value:</span>
                      <span className="font-extrabold text-brand-orange text-sm">
                        {formatINR(cat.stockValueINR, { compact: true })}
                      </span>
                    </div>
                  </div>

                  {/* Mini Trend & Navigation Trigger */}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">30d Demand</span>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                        <TrendingUp className="w-3 h-3" />
                        <span>+{cat.growthPercent}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {renderMiniSparkline(cat.miniSalesGraph)}
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1A1D26] group-hover:bg-brand-orange group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                        <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Admin Rename Modal */}
      {editCategory && (
        <Modal
          isOpen={!!editCategory}
          onClose={() => setEditCategory(null)}
          title={`Rename Category: ${editCategory.name}`}
          subtitle="Modify the commercial label displayed throughout wholesale catalog"
          size="sm"
        >
          <form onSubmit={handleSaveName} className="space-y-4">
            <Input
              label="Category Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Architectural Wood & Timber"
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                type="button"
                onClick={() => setEditCategory(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={isSavingName}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Save Name
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
