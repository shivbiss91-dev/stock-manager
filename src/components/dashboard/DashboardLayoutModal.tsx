import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { UserDashboardLayout } from '../../services/dashboardService';
import { ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw, GripVertical } from 'lucide-react';

interface DashboardLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLayout: UserDashboardLayout;
  onSave: (layout: UserDashboardLayout) => void;
}

const CARD_LABELS: Record<string, string> = {
  orders_card: 'Orders Pipeline Overview (Textured Bars)',
  stock_donut_card: 'Warehouse Stock Donut & Thresholds',
  order_history_card: 'Recent Order History (Stacked Carousel)',
  logistics_map_card: 'India Logistics Map & Highway Delay Tags',
  product_table_card: 'Product List & Inventory Master Table',
};

export const DashboardLayoutModal: React.FC<DashboardLayoutModalProps> = ({
  isOpen,
  onClose,
  currentLayout,
  onSave,
}) => {
  const [order, setOrder] = useState<string[]>([...currentLayout.cardOrder]);
  const [hidden, setHidden] = useState<string[]>([...currentLayout.hiddenCards]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...order];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setOrder(next);
  };

  const moveDown = (index: number) => {
    if (index === order.length - 1) return;
    const next = [...order];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setOrder(next);
  };

  const toggleHide = (cardId: string) => {
    if (hidden.includes(cardId)) {
      setHidden(hidden.filter((id) => id !== cardId));
    } else {
      setHidden([...hidden, cardId]);
    }
  };

  const handleReset = () => {
    const defaultOrder = [
      'orders_card',
      'stock_donut_card',
      'order_history_card',
      'logistics_map_card',
      'product_table_card',
    ];
    setOrder(defaultOrder);
    setHidden([]);
  };

  const handleApply = () => {
    onSave({
      cardOrder: order,
      hiddenCards: hidden,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Dashboard Layout"
      subtitle="Reorder or hide cards to tailor your wholesale workflow. Saved per user profile."
      size="md"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          {order.map((cardId, index) => {
            const isCardHidden = hidden.includes(cardId);
            return (
              <div
                key={cardId}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  isCardHidden
                    ? 'bg-slate-100/60 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.04] opacity-50'
                    : 'template-card border-slate-200 dark:border-white/[0.06] shadow-soft'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    <GripVertical className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {CARD_LABELS[cardId] || cardId}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Position #{index + 1} {isCardHidden ? '• Currently Hidden' : '• Visible'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveUp(index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                    title="Move card up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={index === order.length - 1}
                    onClick={() => moveDown(index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                    title="Move card down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleHide(cardId)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isCardHidden
                        ? 'text-accent-orange hover:bg-accent-orange/10'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                    title={isCardHidden ? 'Show card' : 'Hide card'}
                  >
                    {isCardHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06] text-xs">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-slate-500 hover:text-accent-orange transition-colors font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleApply}>
              Save Layout
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
