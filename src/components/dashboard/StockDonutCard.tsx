import React, { useState } from 'react';
import { Card } from '../common/Card';
import { StockDonutSegment } from '../../services/dashboardService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { StockStatus } from '../../types/common';
import { RotateCcw } from 'lucide-react';

interface StockDonutCardProps {
  segments: StockDonutSegment[];
  activeFilter: StockStatus | 'all';
  onSelectSegment: (statusKey: StockStatus | 'all') => void;
}

export const StockDonutCard: React.FC<StockDonutCardProps> = ({
  segments,
  activeFilter,
  onSelectSegment,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalItems = segments.reduce((acc, curr) => acc + curr.value, 0);

  // Status to Texture mapping
  const getTextureForStatus = (statusKey: StockStatus) => {
    switch (statusKey) {
      case 'in_stock':
        return 'url(#donut-in-stock)';
      case 'out_of_stock':
        return '#000000';
      case 'low_stock':
        return 'url(#donut-low-stock)';
      case 'dead_stock':
        return 'url(#donut-dead-stock)';
      default:
        return '#FFFFFF';
    }
  };

  const handleSegmentClick = (entry: StockDonutSegment) => {
    if (activeFilter === entry.statusKey) {
      onSelectSegment('all'); // Toggle off
    } else {
      onSelectSegment(entry.statusKey);
    }
  };

  return (
    <Card
      variant="solid-orange"
      noPadding
      className="relative overflow-hidden flex flex-col justify-between min-h-[300px] sm:min-h-[320px] shadow-xl p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Stock</h3>
          <p className="text-xs text-white/80">Inventory distribution</p>
        </div>

        {activeFilter !== 'all' && (
          <button
            onClick={() => onSelectSegment('all')}
            className="flex items-center gap-1 text-xs text-white bg-black/20 hover:bg-black/30 px-2.5 py-1 rounded-lg border border-white/20 font-semibold transition-colors"
            title="Reset filter"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Main Content: Left Legend + Right Half Donut */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center flex-1">
        {/* Left Column: Legend with Matching Texture Dots (sm:col-span-5) */}
        <div className="sm:col-span-5 space-y-2.5 pr-1">
          {segments.map((item) => {
            const isSelected = activeFilter === item.statusKey;
            const textureFill = getTextureForStatus(item.statusKey);

            return (
              <button
                key={item.statusKey}
                onClick={() => handleSegmentClick(item)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all group ${
                  isSelected
                    ? 'bg-black/30 ring-2 ring-white shadow-sm'
                    : 'bg-black/10 hover:bg-black/20'
                }`}
                title={`Click to filter product list by ${item.name}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Texture dot */}
                  <div className="w-4 h-4 rounded-full overflow-hidden border border-white/50 flex-shrink-0 shadow-inner">
                    <svg className="w-full h-full">
                      <rect width="100%" height="100%" fill={textureFill} />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate leading-tight">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-white/75">{item.percentage}%</p>
                  </div>
                </div>

                <span className="text-xs font-extrabold text-white ml-2 flex-shrink-0">
                  {item.value.toLocaleString('en-IN')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Large Half Donut + Centered Dark Total Pill (sm:col-span-7) */}
        <div className="sm:col-span-7 relative h-48 sm:h-52 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={totalItems === 0 ? [{ name: 'No Data', value: 1, percentage: 0, statusKey: 'in_stock' as const }] : segments}
                cx="50%"
                cy="85%"
                startAngle={180}
                endAngle={0}
                innerRadius={68}
                outerRadius={100}
                paddingAngle={totalItems === 0 ? 0 : 4}
                dataKey="value"
                onClick={totalItems === 0 ? undefined : handleSegmentClick}
                className={totalItems === 0 ? 'pointer-events-none' : 'cursor-pointer focus:outline-none'}
              >
                {totalItems === 0 ? (
                  <Cell fill="rgba(255, 255, 255, 0.15)" stroke="rgba(255, 255, 255, 0.25)" strokeWidth={1} />
                ) : (
                  segments.map((entry, index) => {
                    const isSelected = activeFilter === entry.statusKey;
                    const isDimmed = activeFilter !== 'all' && !isSelected;
                    const fillTexture = getTextureForStatus(entry.statusKey);

                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={fillTexture}
                        opacity={isDimmed ? 0.35 : 1}
                        stroke={isSelected ? '#FFFFFF' : '#FF6B35'}
                        strokeWidth={isSelected ? 3 : 1.5}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="transition-all duration-150 hover:brightness-110"
                      />
                    );
                  })
                )}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as StockDonutSegment;
                    return (
                      <div className="bg-[#0B0D14] text-white text-xs px-3 py-2 rounded-xl shadow-2xl border border-white/20">
                        <p className="font-bold">{data.name}</p>
                        <p className="text-slate-300">
                          {data.value.toLocaleString('en-IN')} items ({data.percentage}%)
                        </p>
                        <p className="text-[10px] text-brand-orange mt-0.5 font-semibold">
                          Click to filter products
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Dark Pill with White Outline inside the donut arch */}
          <div className="absolute bottom-4 flex flex-col items-center pointer-events-none">
            <div className="px-3.5 py-1 rounded-full bg-[#0B0D14] border-2 border-white text-white font-extrabold text-sm sm:text-base shadow-lg tracking-wide">
              {totalItems.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-1">
              TOTAL ITEMS
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
