import { MaterialCategoryInfo, ProductCategory } from '../types/inventory';

/**
 * StockVista Official Product Categories
 * 
 * Expanded Catalog Categories:
 * Hook, Badge, Button bag, Die, Metal cap, Card holder, Ribbon,
 * Satin roll, Tube roll, Tape roll, Nickle fitting, Yoyo, Folder,
 * Machine, Zipper, Clip, and Lanyard.
 */
export const PRODUCT_CATEGORIES: MaterialCategoryInfo[] = [
  {
    id: 'hook' as any,
    name: 'Hook',
    description: 'Metal swivel snap hooks, alligator clips, lobster clasps, and keyrings.',
    subtypes: ['Fish Hook / Lobster', 'Dog Hook', 'Alligator Clip', 'Trigger Hook', 'Swivel Clasp'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Boxes',
    imageUrl: '/products/hook.svg',
  },
  {
    id: 'badge' as any,
    name: 'Badge',
    description: 'Pin badges, magnetic badge holders, button badges, and name tags.',
    subtypes: ['Pin Badge', 'Magnetic Badge', 'Button Badge', 'Name Tag', 'Acrylic Badge'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Shield',
    imageUrl: '/products/card-holder.svg',
  },
  {
    id: 'button_bag' as any,
    name: 'Button Bag',
    description: 'Snap-button pouches, clear document envelopes, and transparent organizers.',
    subtypes: ['Snap Button Pouch', 'Zipper Pouch', 'Gusset Pouch', 'Document Sleeve', 'Clear Envelope'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Shield',
    imageUrl: '/products/button-bag.svg',
  },
  {
    id: 'die' as any,
    name: 'Die',
    description: 'Cutting dies, punching tools, embossing dies, and stamping molds.',
    subtypes: ['Cutting Die', 'Punching Die', 'Embossing Die', 'Standard Mold'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Boxes',
    imageUrl: '/products/hook.svg',
  },
  {
    id: 'metal_cap' as any,
    name: 'Metal Cap',
    description: 'Crimp caps, metal end fittings, cord clips, and clamp tips.',
    subtypes: ['Crimp Cap', 'Metal End Fitting', 'Cord Clip', 'Clamp Tip'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Layers',
    imageUrl: '/products/hook.svg',
  },
  {
    id: 'card_holder' as any,
    name: 'Card Holder',
    description: 'Durable ID card holders, clear badge cases, protective sleeves, and clip attachments.',
    subtypes: ['Standard Sleeve', 'Heavy Duty Case', 'Dual Pocket', 'Rigid Plastic', 'Soft Vinyl'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Layers',
    imageUrl: '/products/card-holder.svg',
  },
  {
    id: 'ribbon' as any,
    name: 'Ribbon',
    description: 'Decorative ribbons, printed branding ribbons, grosgrain and satin ribbons.',
    subtypes: ['Printed Ribbon', 'Plain Ribbon', 'Grosgrain Ribbon', 'Decorative Ribbon'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Shirt',
    imageUrl: '/products/lanyard.svg',
  },
  {
    id: 'satin_roll' as any,
    name: 'Satin Roll',
    description: 'Silky satin fabric rolls for lanyards, printing, gift packing, and trimming.',
    subtypes: ['Single Side Satin', 'Double Side Satin', 'Heat Transfer Roll', 'Woven Edge Roll'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Shirt',
    imageUrl: '/products/lanyard.svg',
  },
  {
    id: 'tube_roll' as any,
    name: 'Tube Roll',
    description: 'Tubular fabric rolls, hollow woven straps, and protective sleeve tubing.',
    subtypes: ['Tubular Polyester', 'Braided Tube', 'Heat Shrink Tube', 'Protective Sleeve'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Layers',
    imageUrl: '/products/button-bag.svg',
  },
  {
    id: 'tape_roll' as any,
    name: 'Tape Roll',
    description: 'Adhesive tape rolls, packaging tapes, binding tapes, and double-sided tapes.',
    subtypes: ['BOPP Packing Tape', 'Double-Sided Tape', 'Masking Tape', 'Thermal Tape'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Layers',
    imageUrl: '/products/button-bag.svg',
  },
  {
    id: 'nickle_fitting' as any,
    name: 'Nickle Fitting',
    description: 'Nickel-plated hardware, split rings, rivets, eyelets, and metal fasteners.',
    subtypes: ['Split Ring', 'Metal Rivet', 'Eyelet Fitting', 'Swivel Buckle'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Boxes',
    imageUrl: '/products/hook.svg',
  },
  {
    id: 'yoyo' as any,
    name: 'Yoyo',
    description: 'Retractable badge reels (yoyos), pull cords, and ski pass holders.',
    subtypes: ['Standard Retractable Reel', 'Heavy Duty Steel Wire', 'Carabiner Reel', 'Custom Printed Yoyo'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Boxes',
    imageUrl: '/products/card-holder.svg',
  },
  {
    id: 'folder' as any,
    name: 'Folder',
    description: 'Office folders, presentation files, document envelopes, and certificate holders.',
    subtypes: ['L-Folder', 'Ring Binder File', 'Clip Folder', 'Certificate Holder'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'FileText',
    imageUrl: '/products/button-bag.svg',
  },
  {
    id: 'machine' as any,
    name: 'Machine',
    description: 'Heat press machines, button badge makers, cutting machines, and eyelet punchers.',
    subtypes: ['Badge Making Machine', 'Lanyard Heat Press', 'Eyelet Machine', 'Cutting Plotter'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'SlidersHorizontal',
    imageUrl: '/products/hook.svg',
  },
  {
    id: 'zipper' as any,
    name: 'Zipper',
    description: 'Nylon and metallic zippers, zip pullers, continuous rolls, and sliders.',
    subtypes: ['Nylon Coil Zipper', 'Metal Zipper', 'Plastic Slider', 'Zip Puller'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Layers',
    imageUrl: '/products/button-bag.svg',
  },
  {
    id: 'clip' as any,
    name: 'Clip',
    description: 'Badge clips, crocodile clips, bulldog clips, and spring clamps.',
    subtypes: ['Crocodile Clip', 'Bulldog Clip', 'Suspender Clip', 'Plastic Grip Clip'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Boxes',
    imageUrl: '/products/hook.svg',
  },
  {
    id: 'lanyard' as any,
    name: 'Lanyard',
    description: 'Custom and plain woven neck lanyards, safety breakaway straps, and badge ribbons.',
    subtypes: ['Standard Polyester', 'Satin Finish', 'Safety Breakaway', 'Double Ended'],
    defaultHsn: '',
    defaultGstRate: 0,
    iconName: 'Shirt',
    imageUrl: '/products/lanyard.svg',
  },
];

export const CUSTOM_CATEGORIES_STORAGE_KEY = 'stockvista_custom_product_categories';

export function getCustomCategories(): MaterialCategoryInfo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomCategory(category: MaterialCategoryInfo): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getCustomCategories();
    const existingIndex = list.findIndex((c) => c.id === category.id);
    if (existingIndex >= 0) {
      list[existingIndex] = category;
    } else {
      list.push(category);
    }
    localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('categories_updated'));
  } catch (err) {
    console.warn('Failed to save custom category:', err);
  }
}

export function removeCustomCategory(categoryId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getCustomCategories().filter((c) => c.id !== categoryId);
    localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('categories_updated'));
  } catch (err) {
    console.warn('Failed to remove custom category:', err);
  }
}

export function getAllCategories(): MaterialCategoryInfo[] {
  const custom = getCustomCategories();
  const existingIds = new Set(PRODUCT_CATEGORIES.map((c) => c.id));
  const filteredCustom = custom.filter((c) => !existingIds.has(c.id));
  return [...PRODUCT_CATEGORIES, ...filteredCustom];
}

// Alias for backwards-compatibility with services
export const MATERIAL_CATEGORIES: MaterialCategoryInfo[] = PRODUCT_CATEGORIES;

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  hook: 'Hook',
  badge: 'Badge',
  button_bag: 'Button Bag',
  die: 'Die',
  metal_cap: 'Metal Cap',
  card_holder: 'Card Holder',
  ribbon: 'Ribbon',
  satin_roll: 'Satin Roll',
  tube_roll: 'Tube Roll',
  tape_roll: 'Tape Roll',
  nickle_fitting: 'Nickle Fitting',
  yoyo: 'Yoyo',
  folder: 'Folder',
  machine: 'Machine',
  zipper: 'Zipper',
  clip: 'Clip',
  lanyard: 'Lanyard',
};

/**
 * Returns clean human-readable name for a product category
 */
export function formatCategoryName(category: string): string {
  if (!category) return '';
  if (CATEGORY_DISPLAY_NAMES[category]) {
    return CATEGORY_DISPLAY_NAMES[category];
  }
  const customList = getCustomCategories();
  const customMatch = customList.find((c) => c.id === category);
  if (customMatch) return customMatch.name;

  return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
}

/**
 * Safely maps any item category string to one of the approved categories
 */
export function migrateProductCategory(category: string, name?: string, sku?: string): ProductCategory {
  const c = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();
  const s = (sku || '').toLowerCase();

  if (c === 'card_holder' || n.includes('card holder') || s.startsWith('ch-')) return 'card_holder';
  if (c === 'lanyard' || n.includes('lanyard') || s.startsWith('lan-')) return 'lanyard';
  if (c === 'hook' || n.includes('hook') || s.startsWith('hk-')) return 'hook';
  if (c === 'button_bag' || n.includes('button bag') || s.startsWith('bb-')) return 'button_bag';

  return 'card_holder';
}
