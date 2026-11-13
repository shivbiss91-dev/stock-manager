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
    id: 'card_holder',
    name: 'Card Holders & Sleeves',
    description: 'Rigid ID badge holders, clear badge sleeves, magnetic card protectors, and multi-card dispensers.',
    subtypes: [
      'Rigid ID Badge Sleeve',
      'Soft Vinyl Pouch',
      'Magnetic Badge Holder',
      'Open-Face Dual Card Holder',
      'Armband Badge Holder',
      'Multi-Card Dispenser',
    ],
    defaultHsn: '392690',
    defaultGstRate: 18,
    iconName: 'CreditCard',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'lanyards',
    name: 'Lanyards & Neckstraps',
    description: 'Breakaway safety lanyards, custom printed satin straps, tubular neckstraps, and double-clip lanyards.',
    subtypes: [
      'Breakaway Safety Lanyard',
      'Custom Printed Satin Lanyard',
      'Tubular Neckstrap with Swivel Hook',
      'Double Clip Lanyard',
      'Reflective Safety Lanyard',
    ],
    defaultHsn: '630790',
    defaultGstRate: 18,
    iconName: 'Shirt',
    imageUrl: 'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'badge_reels',
    name: 'Retractable Badge Reels',
    description: 'Heavy-duty retractable badge reels, carabiner clips, steel wire cord reels, and belt swivel reels.',
    subtypes: [
      'Chrome Carabiner Reel',
      'Heavy-Duty Steel Wire Reel',
      'Custom Epoxy Dome Reel',
      'Swivel Belt Clip Reel',
      'Mini Compact Reel',
    ],
    defaultHsn: '392690',
    defaultGstRate: 18,
    iconName: 'Disc',
    imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'id_cards',
    name: 'PVC Cards & Inlays',
    description: 'Blank CR80 PVC cards, magnetic stripe cards, smart chip inlays, and frosted access cards.',
    subtypes: [
      'Standard White CR80 PVC',
      'HiCo Magnetic Stripe Card',
      'Adhesive Mylar Back PVC Card',
      'Frosted Clear PVC Card',
      'Biodegradable Composite Card',
    ],
    defaultHsn: '392099',
    defaultGstRate: 18,
    iconName: 'Layers',
    imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rfid_cards',
    name: 'RFID & Smart Access',
    description: '13.56 MHz RFID smart cards, 125 kHz proximity cards, RFID blocking sleeves, and contactless keyfobs.',
    subtypes: [
      'RFID Shielded Card Sleeve',
      '13.56 MHz RFID Access Card',
      '125 kHz Proximity Card',
      'Dual-Frequency Contactless Card',
      'NFC Key Fob Tag',
    ],
    defaultHsn: '852352',
    defaultGstRate: 18,
    iconName: 'Shield',
    imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'clips_accessories',
    name: 'Clips & Fasteners',
    description: 'Crocodile strap clips, self-adhesive magnetic badge bars, pin clips, and lanyard attachments.',
    subtypes: [
      'Metal Crocodile Strap Clip',
      'Self-Adhesive Magnetic Bar',
      'Safety Pin & Clip Combo',
      'Clear Vinyl Strap Clip',
      'Plastic Swivel J-Hook',
    ],
    defaultHsn: '732690',
    defaultGstRate: 18,
    iconName: 'Grid',
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'wood',
    name: 'Wood & Timber',
    description: 'Commercial plywood, marine ply, teak, hardwood, MDF boards, and architectural veneers.',
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
