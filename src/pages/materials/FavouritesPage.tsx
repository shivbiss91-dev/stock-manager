import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { inventoryService } from '../../services/inventoryService';
import { ComputedInventoryItem } from '../../types/inventory';
import { ItemCard } from '../../components/materials/ItemCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Heart, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const FavouritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { favourites } = useUIStore();
  const [favouriteItems, setFavouriteItems] = useState<ComputedInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFavs = async () => {
      setIsLoading(true);
      try {
        const { items } = await inventoryService.getItems({ pageSize: 5000 });
        const filtered = items.filter((i) => favourites.includes(i.id));
        setFavouriteItems(filtered);
      } finally {
        setIsLoading(false);
      }
    };
    loadFavs();
  }, [favourites]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 template-card p-6 rounded-[20px] border border-slate-200 dark:border-white/[0.06] shadow-soft">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              to="/materials"
              className="text-xs font-semibold text-accent-orange hover:underline uppercase tracking-wider"
            >
              ← Back to Materials
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Pinned Favourites
            </h1>
            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 font-mono font-extrabold text-sm border border-rose-500/20">
              {favouriteItems.length} Saved
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quick-access bookmark list for frequently ordered wholesale commodities and high-velocity SKUs
          </p>
        </div>
      </div>

      {/* Grid of Favourited Items */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-[20px] template-card animate-pulse border border-slate-200 dark:border-white/[0.06]"
            />
          ))}
        </div>
      ) : favouriteItems.length === 0 ? (
        <EmptyState
          title="No favourite items pinned yet"
          description="Click the heart icon on any product in the catalog or warehouse tables to add it to your quick-access favorites list."
          icon={<Heart className="w-8 h-8 text-rose-500" />}
          actionText="Browse Wood & Materials"
          onAction={() => navigate('/materials/wood')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favouriteItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              viewMode="grid"
              isSelected={false}
              onToggleSelect={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
};
