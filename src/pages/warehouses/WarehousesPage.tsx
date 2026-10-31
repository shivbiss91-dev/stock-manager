import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Phone,
  Package,
  Layers,
  Plus,
  Building2,
  HardDrive,
} from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import { Warehouse } from '../../types/warehouse';
import { formatINR } from '../../utils/formatINR';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { AddWarehouseModal } from '../../components/warehouses/AddWarehouseModal';

export const WarehousesPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadWarehouses = () => {
    setIsLoading(true);
    warehouseService.getWarehouses().then((data) => {
      setWarehouses(data.filter((w) => w.id !== 'all'));
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const totalValue = warehouses.reduce((acc, w) => acc + w.stockValueINR, 0);
  const totalPieces = warehouses.reduce((acc, w) => acc + w.totalPieces, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Warehouse Network & Hubs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
              {warehouses.length} {warehouses.length === 1 ? 'Facility' : 'Facilities'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time storage capacities, rack allocations, and multi-state inventory asset valuation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {warehouses.length > 0 && (
            <div className="flex items-center gap-4 template-card p-3 rounded-[20px] border border-slate-200 dark:border-white/[0.06] text-xs shadow-soft">
              <div>
                <span className="text-slate-400 block text-[10px]">Consolidated Inventory</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {formatINR(totalValue)}
                </span>
              </div>
              <div className="border-l border-slate-200 dark:border-white/[0.08] pl-4">
                <span className="text-slate-400 block text-[10px]">Total Stock</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {totalPieces.toLocaleString('en-IN')} units
                </span>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Warehouse
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-[20px] bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <EmptyState
          title="No warehouses configured yet"
          description="Add your first warehouse or storage facility to start tracking inventory balances, receiving goods, and scheduling inter-hub transfers."
          actionText="Add Warehouse Facility"
          onAction={() => setIsAddModalOpen(true)}
          icon={<WarehouseIcon className="w-7 h-7 text-brand-orange" />}
          className="py-16"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-6 shadow-soft space-y-4 hover:border-accent-orange/40 transition group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-accent-orange/10 text-accent-orange flex items-center justify-center font-bold text-base border border-accent-orange/20">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-accent-orange transition-colors">
                        {wh.name}
                      </h3>
                      {wh.isPrimary && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Primary
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400">Code: {wh.code}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Inventory Value</span>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {formatINR(wh.stockValueINR)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 dark:border-white/[0.06] text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Stored SKUs</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{wh.totalItemsCount}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Units on Hand</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{wh.totalPieces.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Floor Area</span>
                  <strong className="text-slate-900 dark:text-white">{wh.totalCapacitySqFt.toLocaleString('en-IN')} sq.ft</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Space Utilization</span>
                  <strong className="text-slate-900 dark:text-white">{wh.utilizedCapacityPercent.toFixed(1)}%</strong>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2 pt-1">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{wh.address}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{wh.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAddModalOpen && (
        <AddWarehouseModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onCreated={() => loadWarehouses()}
        />
      )}
    </div>
  );
};
