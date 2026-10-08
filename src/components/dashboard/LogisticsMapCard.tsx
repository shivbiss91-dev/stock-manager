import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { INDIA_LOGISTICS_HUBS, MOCK_ACTIVE_SHIPMENTS } from '../../data/logisticsData';
import { ActiveShipment } from '../../types/logistics';
import {
  Truck,
  AlertTriangle,
  Clock,
  Maximize2,
  Navigation,
  ArrowRight,
  PackageCheck,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LogisticsMapCardProps {
  shipments?: ActiveShipment[];
}

export const LogisticsMapCard: React.FC<LogisticsMapCardProps> = ({ shipments }) => {
  const navigate = useNavigate();
  const activeShipments = shipments && shipments.length > 0 ? shipments : MOCK_ACTIVE_SHIPMENTS;
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);

  const selectedShipment =
    activeShipments.find((s) => s.id === selectedShipmentId) || activeShipments[0];

  return (
    <Card
      variant="glass"
      noPadding
      className="p-5 overflow-hidden flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
              Logistics & Fleet Tracking
            </h3>
            {/* Blue "delay" pill with dark "+2d" pill */}
            <div className="flex items-center gap-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#3B5BFF] text-white text-[11px] font-bold shadow-sm">
                Delay
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#0B0D14] border border-white/20 text-white text-[11px] font-mono font-bold">
                +2d
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-[#9AA0AE]">
            Active inter-state logistics corridors across Indian hubs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* "Delivery delayed" strip with thumbnails and "+N" chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] text-xs">
            <span className="font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden md:inline">Delivery delayed</span>
            </span>

            {/* Thumbnails */}
            <div className="flex items-center -space-x-2">
              <div
                className="w-6 h-6 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#1A1D26]"
                title="Shipment SHP-IND-2026-001"
              >
                P1
              </div>
              <div
                className="w-6 h-6 rounded-full bg-[#3B5BFF] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#1A1D26]"
                title="Shipment SHP-IND-2026-002"
              >
                T2
              </div>
              <div
                className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#1A1D26]"
                title="Shipment SHP-IND-2026-003"
              >
                M3
              </div>
            </div>

            {/* +N Chip */}
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-[#F2F4F8] text-[10px] font-extrabold">
              +3
            </span>
          </div>

          {/* Expand Icon Button */}
          <button
            onClick={() => navigate('/transfers')}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-[#9AA0AE] flex items-center justify-center transition-all"
            title="Open full logistics & transfers page"
            aria-label="Expand logistics"
          >
            <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Grid: Left SVG Map + Right Selected Consignment Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left: Offline SVG Map of India (Dark with Orange & Blue Highlighted States) */}
        <div className="lg:col-span-7 relative w-full h-80 sm:h-96 rounded-2xl bg-[#07090F] dark:bg-[#07090F] border border-slate-200/80 dark:border-white/[0.08] p-3 overflow-hidden flex items-center justify-center select-none shadow-inner">
          {/* Coordinate Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

          {/* Offline Stylized SVG Map of India */}
          <svg
            viewBox="0 0 400 480"
            className="w-full h-full max-h-96 filter drop-shadow-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Base India Territory Landform */}
            <path
              d="M 140 35 
                 C 155 20, 195 20, 215 35 
                 C 230 45, 235 60, 245 70 
                 C 260 75, 290 85, 305 105 
                 C 320 120, 310 145, 335 155 
                 C 355 165, 375 160, 385 175 
                 C 375 195, 345 200, 330 205 
                 C 310 215, 305 230, 290 240 
                 C 280 250, 295 270, 285 285 
                 C 265 315, 250 340, 230 375 
                 C 215 400, 195 435, 185 455 
                 C 180 465, 175 465, 170 455 
                 C 155 425, 145 385, 135 345 
                 C 125 310, 110 270, 100 245 
                 C 90 220, 75 205, 80 185 
                 C 85 165, 115 150, 125 135 
                 C 135 120, 130 90, 135 70 
                 Z"
              fill="rgba(24, 27, 37, 0.95)"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1.5"
            />

            {/* Highlighted Regional Clusters in Orange & Blue */}
            {/* North-Central Corridor (Delhi/UP/MP) - Blue Accent */}
            <path
              d="M 155 100 Q 210 100 250 140 Q 230 190 170 180 Z"
              fill="rgba(59, 91, 255, 0.22)"
              stroke="#3B5BFF"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />

            {/* Western Industrial Belt (Maharashtra / Gujarat) - Orange Accent */}
            <path
              d="M 100 195 Q 160 190 170 260 Q 120 280 100 220 Z"
              fill="rgba(255, 107, 53, 0.25)"
              stroke="#FF6B35"
              strokeWidth="1.4"
            />

            {/* Southern Tech / Warehouse Belt (Karnataka / Tamil Nadu) - Blue Accent */}
            <path
              d="M 135 300 Q 210 300 185 420 Q 150 380 135 300 Z"
              fill="rgba(59, 91, 255, 0.20)"
              stroke="#3B5BFF"
              strokeWidth="1.2"
            />

            {/* Dotted Route Lines from Warehouse to Destination Cities with Circular Nodes */}
            {activeShipments.map((shp) => {
              const x1 = (shp.originHub.x / 100) * 400;
              const y1 = (shp.originHub.y / 100) * 480;
              const x2 = (shp.destinationHub.x / 100) * 400;
              const y2 = (shp.destinationHub.y / 100) * 480;

              const cx = (x1 + x2) / 2 + (y2 - y1) * 0.2;
              const cy = (y1 + y2) / 2 - (x2 - x1) * 0.2;

              const isSelected = selectedShipment?.id === shp.id;
              const isDelayed = shp.status === 'delayed';

              const routeColor = isDelayed ? '#FF4D4F' : isSelected ? '#FF6B35' : '#3B5BFF';

              return (
                <g key={shp.id} className="cursor-pointer" onClick={() => setSelectedShipmentId(shp.id)}>
                  {/* Dotted Route Arc */}
                  <path
                    d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                    fill="none"
                    stroke={routeColor}
                    strokeWidth={isSelected ? '3' : '2'}
                    strokeDasharray="4 4"
                    opacity={isSelected ? 1 : 0.75}
                    className="transition-all"
                  />

                  {/* Vehicle pulsing marker node */}
                  <circle
                    cx={(x1 * (100 - shp.progressPercent) + x2 * shp.progressPercent) / 100}
                    cy={(y1 * (100 - shp.progressPercent) + y2 * shp.progressPercent) / 100}
                    r={isSelected ? 6 : 4}
                    fill={routeColor}
                    className="animate-pulse"
                  />
                </g>
              );
            })}

            {/* Circular Hub Nodes with City Labels */}
            {INDIA_LOGISTICS_HUBS.map((hub) => {
              const px = (hub.x / 100) * 400;
              const py = (hub.y / 100) * 480;
              return (
                <g key={hub.id} className="group">
                  <circle
                    cx={px}
                    cy={py}
                    r="8"
                    fill="#3B5BFF"
                    opacity="0.3"
                    className="animate-ping"
                  />
                  <circle cx={px} cy={py} r="4.5" fill="#FF6B35" stroke="#FFFFFF" strokeWidth="1.5" />
                  <text
                    x={px + 7}
                    y={py + 3}
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontWeight="bold"
                    className="font-sans pointer-events-none select-none drop-shadow"
                  >
                    {hub.code}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map bottom delay alert tag */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 pointer-events-none">
            <div className="px-3 py-1 rounded-xl bg-black/80 border border-rose-500/50 text-rose-300 text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>NH-48 Corridor Alert: +2d Monsoon Roadwork</span>
            </div>
          </div>
        </div>

        {/* Right: Selected Active Consignment Card (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-3.5">
          {selectedShipment ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#181B25] dark:to-[#12151D] border border-slate-200 dark:border-white/[0.08] shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-orange/15 text-brand-orange flex items-center justify-center">
                    <Truck className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-[#F2F4F8] font-mono">
                    {selectedShipment.vehicleNumber}
                  </span>
                </div>
                <Badge
                  variant={selectedShipment.status === 'delayed' ? 'danger' : 'solid-blue'}
                  size="sm"
                  dot
                >
                  {selectedShipment.status === 'delayed' ? 'Delayed (+2d)' : 'On Schedule'}
                </Badge>
              </div>

              {/* Route */}
              <div className="flex items-center justify-between py-2 border-y border-slate-200/60 dark:border-white/[0.06] text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Origin</span>
                  <span className="font-bold text-slate-800 dark:text-[#F2F4F8]">{selectedShipment.originHub.city}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-brand-orange flex-shrink-0 mx-2" />
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Destination</span>
                  <span className="font-bold text-slate-800 dark:text-[#F2F4F8]">{selectedShipment.destinationHub.city}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="my-2.5">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Route Progress</span>
                  <span className="font-bold text-brand-orange">{selectedShipment.progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden">
                  <div
                    style={{ width: `${selectedShipment.progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-[#3B5BFF] to-[#FF6B35] rounded-full transition-all duration-300"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
                <strong>Cargo:</strong> {selectedShipment.cargoDescription} ({selectedShipment.weightTons} Tons)
              </p>

              {selectedShipment.delayReason && (
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 dark:text-rose-400 mb-2 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Highway Alert:</strong> {selectedShipment.delayReason} (+{selectedShipment.delayHours} hrs)
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-[#9AA0AE] pt-1">
                <div>
                  <span>Driver:</span>{' '}
                  <strong className="text-slate-800 dark:text-[#F2F4F8]">{selectedShipment.driverName}</strong>
                </div>
                <div>
                  <span>Phone:</span>{' '}
                  <strong className="text-slate-800 dark:text-[#F2F4F8]">{selectedShipment.driverPhone}</strong>
                </div>
                <div className="col-span-2">
                  <span>E-Way Bill:</span>{' '}
                  <strong className="text-slate-800 dark:text-[#F2F4F8] font-mono">{selectedShipment.ewayBillNumber}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-[#12151D] rounded-2xl border border-slate-200 dark:border-white/[0.08]">
              No active shipments in transit
            </div>
          )}

          {/* Quick Selection Hub Pills */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-[#9AA0AE] uppercase tracking-wider block">
              Active Fleet Corridors
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeShipments.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedShipmentId(s.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                    selectedShipment?.id === s.id
                      ? 'bg-brand-orange text-white border-brand-orange shadow-sm'
                      : 'bg-white dark:bg-[#1A1D26] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#9AA0AE] hover:border-brand-orange/40'
                  }`}
                >
                  {s.originHub.code} → {s.destinationHub.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
