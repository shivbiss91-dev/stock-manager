import { MaterialCategoryInfo, ProductCategory } from '../types/inventory';

/**
 * StockVista Official Product Categories
 * 
 * Catalogue restricted strictly to:
 * 1. Card Holder
 * 2. Lanyard
 * 3. Hook
 * 4. Button Bag
 * 
 * Constraint: Do not fabricate prices, HSN, GST rates or stock quantities.
 */
export const PRODUCT_CATEGORIES: MaterialCategoryInfo[] = [
  {
    id: 'card_holder' as any,
    name: 'Card Holder',
    description: 'Durable ID card holders, clear badge cases, protective sleeves, and clip attachments.',
    subtypes: [
      'Standard Sleeve',
      'Heavy Duty Case',
      'Dual Pocket',
      'Rigid Plastic',
    ],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Layers',
    imageUrl: '/products/card-holder.svg',
  },
  {
    id: 'lanyard' as any,
    name: 'Lanyard',
    description: 'Custom and plain woven neck lanyards, safety breakaway straps, and badge ribbons.',
    subtypes: [
      'Standard Polyester',
      'Satin Finish',
      'Safety Breakaway',
      'Double Ended',
    ],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Shirt',
    imageUrl: '/products/lanyard.svg',
  },
  {
    id: 'hook' as any,
    name: 'Hook',
    description: 'Metal swivel snap hooks, alligator clips, lobster clasps, and keyrings.',
    subtypes: [
      'Fish Hook / Lobster',
      'Dog Hook',
      'Alligator Clip',
      'Trigger Hook',
    ],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Boxes',
    imageUrl: '/products/hook.svg',
  },
  {
    id: 'button_bag' as any,
    name: 'Button Bag',
    description: 'Snap-button pouches, clear document envelopes, and transparent organizers.',
    subtypes: [
      'Snap Button Pouch',
      'Zipper Pouch',
      'Gusset Pouch',
      'Document Sleeve',
    ],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Shield',
    imageUrl: '/products/button-bag.svg',
  },
];

// Alias for backwards-compatibility with services
export const MATERIAL_CATEGORIES: MaterialCategoryInfo[] = PRODUCT_CATEGORIES;

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  card_holder: 'Card Holder',
  lanyard: 'Lanyard',
  hook: 'Hook',
  button_bag: 'Button Bag',
};

/**
 * Returns clean human-readable name for a product category
 */
export function formatCategoryName(category: string): string {
  if (!category) return '';
  if (CATEGORY_DISPLAY_NAMES[category]) {
    return CATEGORY_DISPLAY_NAMES[category];
  }
  // Safe mapping for legacy category names
  const lower = category.toLowerCase();
  if (lower.includes('card') || lower.includes('holder')) return 'Card Holder';
  if (lower.includes('lanyard') || lower.includes('strap')) return 'Lanyard';
  if (lower.includes('hook') || lower.includes('clasp')) return 'Hook';
  if (lower.includes('button') || lower.includes('bag') || lower.includes('pouch')) return 'Button Bag';

  return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
}

/**
 * Safely maps any item category string to one of the 4 approved categories
 */
export function migrateProductCategory(category: string, name?: string, sku?: string): ProductCategory {
  const c = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();
  const s = (sku || '').toLowerCase();

  if (c === 'card_holder' || n.includes('card holder') || s.startsWith('ch-')) {
    return 'card_holder';
  }
  if (c === 'lanyard' || n.includes('lanyard') || s.startsWith('lan-')) {
    return 'lanyard';
  }
  if (c === 'hook' || n.includes('hook') || s.startsWith('hk-')) {
    return 'hook';
  }
  if (c === 'button_bag' || n.includes('button bag') || s.startsWith('bb-')) {
    return 'button_bag';
  }

  // Legacy fallback based on keywords
  if (n.includes('card') || c === 'plastic') return 'card_holder';
  if (n.includes('lanyard') || c === 'fabric') return 'lanyard';
  if (n.includes('hook') || c === 'metal') return 'hook';
  if (n.includes('bag')) return 'button_bag';

  return 'card_holder';
}
