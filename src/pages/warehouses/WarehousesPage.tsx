import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Phone,
  Package,
  Layers,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Building2,
  HardDrive,
} from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import { Warehouse } from '../../types/warehouse';
import { formatINR } from '../../utils/formatINR';

export const WarehousesPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    warehouseService.getWarehouses().then((data) => {
      if (isMounted) {
        setWarehouses(data.filter((w) => w.id !== 'all'));
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
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
              4 Regional Hubs
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time storage capacities, rack allocations, and multi-state inventory asset valuation.
          </p>
        </div>

        {/* Global valuation stats */}
        <div className="flex items-center gap-4 template-card p-3.5 rounded-[20px] border border-slate-200 dark:border-white/[0.06] text-xs shadow-soft">
          <div>
            <span className="text-slate-400 block text-[10px]">Consolidated Inventory Value</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              {formatINR(totalValue)}
            </span>
          </div>
          <div className="border-l border-slate-200 dark:border-white/[0.08] pl-4">
            <span className="text-slate-400 block text-[10px]">Total Stock In Warehouse</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              {totalPieces.toLocaleString('en-IN')} units
            </span>
          </div>
        </div>
      </div>

      {/* Hub Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-5 sm:p-6 shadow-soft space-y-4 hover:border-accent-orange/40 transition"
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-accent-orange/10 text-accent-orange">
                  <WarehouseIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {wh.name}
                    </h3>
                    {wh.isPrimary && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 uppercase">
                        Primary HQ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Hub Code: {wh.code} • GST State: {wh.stateCode} ({wh.state})
                  </p>
                </div>
              </div>
            </div>

            {/* Address & Contact */}
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] text-xs space-y-1">
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-accent-orange flex-shrink-0 mt-0.5" />
                <span>{wh.address}, Pincode: {wh.pincode}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-[11px] pt-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>Manager: {wh.contactPerson} ({wh.phone})</span>
              </div>
            </div>

            {/* Capacity meter */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Capacity Utilization</span>
                <span className={wh.utilizedCapacityPercent > 80 ? 'text-rose-500' : 'text-emerald-400'}>
                  {wh.utilizedCapacityPercent}% ({wh.totalCapacitySqFt.toLocaleString('en-IN')} sq.ft)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    wh.utilizedCapacityPercent > 80 ? 'bg-rose-500' : 'bg-accent-orange'
                  }`}
                  style={{ width: `${wh.utilizedCapacityPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs">
              <div>
                <span className="text-slate-400 text-[11px]">Total SKUs</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {wh.totalItemsCount.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Physical Units</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {wh.totalPieces.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Hub Stock Value</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatINR(wh.stockValueINR)}
                </p>
              </div>
            </div>

            {/* Link to view inventory */}
            <div className="pt-2">
              <Link
                to={`/items`}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl template-input border border-slate-200 dark:border-white/[0.08] hover:border-accent-orange/40 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5"
              >
                <span>Browse {wh.name} Stock</span>
                <ArrowRight className="w-3.5 h-3.5 text-accent-orange" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
