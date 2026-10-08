import { InventoryItem, MaterialCategory, UnitOfMeasurement } from '../types/inventory';
import { MOCK_SUPPLIERS } from './suppliers';

// Seeded pseudo-random generator for 100% deterministic, reproducible mock data
function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

interface CategoryConfig {
  category: MaterialCategory;
  count: number;
  subtypes: string[];
  units: UnitOfMeasurement[];
  hsnList: string[];
  gstRate: number;
  prefix: string;
  names: { base: string; grades: string[]; specs: string[] };
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    category: 'wood',
    count: 1248, // Exactly 1,248 Wood items as strictly required
    subtypes: [
      'Hardwood',
      'Softwood',
      'Plywood',
      'MDF & Particle Board',
      'Veneers & Laminates',
    ],
    units: ['sheets', 'pieces', 'bundles'],
    hsnList: ['441233', '440711', '441011', '440810', '441820'],
    gstRate: 18,
    prefix: 'WD',
    names: {
      base: 'Wood',
      grades: ['Gurjan BWP Marine', 'Commercial MR Grade', 'Calibrated BWR', 'Action TESA Pre-lam', 'Merino Natural', 'Century Club Prime', 'Green Club Plus'],
      specs: ['18mm (8x4 ft)', '19mm (8x4 ft)', '12mm (8x4 ft)', '6mm (8x4 ft)', '25mm (7x4 ft)', '4mm (8x4 ft)', '15mm (8x3 ft)']
    }
  },
  {
    category: 'metal',
    count: 450,
    subtypes: ['Structural Steel', 'Aluminium Extrusions', 'Copper & Brass', 'Galvanised Sheets', 'Stainless Steel 304/316'],
    units: ['pieces', 'kg', 'bundles'],
    hsnList: ['721420', '760410', '740710', '721049', '721933'],
    gstRate: 18,
    prefix: 'MT',
    names: {
      base: 'Metal',
      grades: ['Tata Tiscon TMT Fe550D', 'Jindal SS 304 Mirror', 'Hindalco 6063-T6 Architectural', 'JSW Colouron+ GI', 'Birla Copper Electrolytic'],
      specs: ['12mm Dia (12m)', '16mm Dia (12m)', '2mm Sheet (8x4 ft)', '50x50x5mm Angle', '25mm Square Tube (6m)']
    }
  },
  {
    category: 'plastic',
    count: 380,
    subtypes: ['HDPE & LDPE', 'Acrylic Sheets', 'PVC & CPVC', 'Polycarbonate', 'Polypropylene'],
    units: ['sheets', 'rolls', 'pieces', 'boxes'],
    hsnList: ['390120', '392051', '391723', '392061', '390210'],
    gstRate: 18,
    prefix: 'PL',
    names: {
      base: 'Polymer',
      grades: ['Supreme Schedule 80 Industrial', 'Cast Acrylic High-Gloss', 'Lexan Multiwall Polycarb', 'Astral CPVC Heavy Duty', 'Reliance Repol Virgin'],
      specs: ['3mm (8x4 ft)', '5mm (8x4 ft)', '110mm OD (6m)', '63mm OD (6m)', '10mm Multiwall Sheet']
    }
  },
  {
    category: 'glass',
    count: 290,
    subtypes: ['Toughened Architectural', 'Float Glass (Clear/Tinted)', 'Laminated Safety Glass', 'Frosted & Decorative', 'Insulated Glass Units'],
    units: ['sheets', 'boxes', 'pieces'],
    hsnList: ['700529', '700719', '700729', '700800', '700991'],
    gstRate: 18,
    prefix: 'GL',
    names: {
      base: 'Glass',
      grades: ['Saint-Gobain Planilaque', 'Asahi Float Clear HD', 'Modiguard Toughened Safety', 'Goldplus Acoustic Laminated', 'Glaverbel Solar Reflective'],
      specs: ['12mm Extra Clear (10x7 ft)', '8mm Tinted Euro Grey', '5+5mm PVB Laminated', '6mm Clear Float (8x6 ft)', '10mm Satin Frosted']
    }
  },
  {
    category: 'fabric',
    count: 280,
    subtypes: ['Cotton Canvas & Duck', 'Heavy Duty Tarpaulin', 'Geotextiles & Filter Cloth', 'Upholstery Linens', 'Nylon & Polyester Webbing'],
    units: ['rolls', 'meters'],
    hsnList: ['520842', '630612', '591190', '540720', '580632'],
    gstRate: 12,
    prefix: 'FB',
    names: {
      base: 'Fabric',
      grades: ['SRF TechTex Heavy Duck 18oz', 'Silpaulin Multi-layer Cross-Lam', 'Tuflex Non-Woven Geotextile', 'Vardhman Industrial Poly-Cotton', 'Reliance High-Tenacity Webbing'],
      specs: ['50m Roll (1.5m Width)', '100m Reel (2.0m Width)', '250 GSM (50x2m)', '400 GSM Heavy Roll', '50mm Heavy Strapping (100m)']
    }
  },
  {
    category: 'rubber',
    count: 260,
    subtypes: ['Neoprene & SBR Sheets', 'Conveyor Belting', 'Nitrile & EPDM Gaskets', 'Silicone Elastomers', 'Natural Rubber Sheeting'],
    units: ['rolls', 'sheets', 'meters'],
    hsnList: ['400821', '401012', '401693', '400811', '400122'],
    gstRate: 18,
    prefix: 'RB',
    names: {
      base: 'Rubber',
      grades: ['MRF Endura Conveyor 3-Ply', 'Dunlop High-Abrasion SBR', 'Parker Chomerics Silicone', 'Fenner Heavy Industrial Belt', 'Bhor Nitrile Commercial Grade'],
      specs: ['6mm Thick (10x1.2m)', '10mm Heavy Conveyor (15m)', '3mm Oil-Resistant Sheet', '12mm Natural Para (5x1m)', '8mm Neoprene Insertion Sheet']
    }
  },
  {
    category: 'paper',
    count: 270,
    subtypes: ['Virgin Kraft Paper', 'Duplex Packaging Boards', 'Corrugated Fluting Medium', 'Grey Board & Bookbinding', 'Honeycomb Core Sheets'],
    units: ['rolls', 'sheets', 'bundles'],
    hsnList: ['480411', '481092', '480810', '480519', '482390'],
    gstRate: 12,
    prefix: 'PP',
    names: {
      base: 'Paper',
      grades: ['ITC CyberXL Pac Duplex', 'Century Star Liner Kraft 180BF', 'West Coast Premium Fluting', 'TNPL High-Burst Greyboard', 'Bilt Graphic Board Calibrated'],
      specs: ['300 GSM (40x30 inch)', '150 GSM Reel (1.2m Width)', '450 GSM Heavy Rigid Board', '200 BF High Burst Kraft (Reel)', '25mm Core Honeycomb Sheet']
    }
  },
  {
    category: 'ceramic',
    count: 242,
    subtypes: ['Vitrified Floor Tiles', 'Refractory Fire Bricks', 'Engineered Quartz Slabs', 'Ceramic Wall Panels', 'High Alumina Insulators'],
    units: ['boxes', 'pieces'],
    hsnList: ['690721', '690220', '681019', '690722', '854620'],
    gstRate: 18,
    prefix: 'CR',
    names: {
      base: 'Ceramic',
      grades: ['Kajaria Ultima Full Body Vitrified', 'Somany Slip-Shield Heavy Duty', 'Cera Glazed Porcelain Slab', 'Orientbell Cool Tiles SRM', 'Tata Refractories Alumina 60%'],
      specs: ['1200x600mm (Box of 2 Pcs)', '800x800mm (Box of 3 Pcs)', 'High-Duty Standard Fire Brick', '3200x1600x15mm Slab', '600x600mm Matte Vitrified (Box of 4)']
    }
  },
];

const WAREHOUSE_MAP = [
  { id: 'wh-001', name: 'Bhiwandi Central Hub (MH)', aislePrefix: 'BHW' },
  { id: 'wh-002', name: 'Panvel Logistics Depot (MH)', aislePrefix: 'PNV' },
  { id: 'wh-003', name: 'Okhla Industrial Depot (DL)', aislePrefix: 'OKH' },
  { id: 'wh-004', name: 'Peenya Hub (KA)', aislePrefix: 'PEE' },
];

// Product image placeholders per material category
const CATEGORY_IMAGES: Record<MaterialCategory, string[]> = {
  wood: [
    'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
  ],
  metal: [
    'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80',
  ],
  plastic: [
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=400&q=80',
  ],
  glass: [
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
  ],
  fabric: [
    'https://images.unsplash.com/photo-1528458876885-b77824987f25?auto=format&fit=crop&w=400&q=80',
  ],
  rubber: [
    'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=400&q=80',
  ],
  paper: [
    'https://images.unsplash.com/photo-1603484477859-abe6a73f9366?auto=format&fit=crop&w=400&q=80',
  ],
  ceramic: [
    'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=400&q=80',
  ],
};

// Generate master items list (Total: 3,420 items, with Wood = 1,248)
export function generateMasterInventory(): InventoryItem[] {
  const items: InventoryItem[] = [];
  let globalSeed = 42;

  CATEGORY_CONFIGS.forEach((config) => {
    for (let i = 0; i < config.count; i++) {
      globalSeed++;
      const rand1 = pseudoRandom(globalSeed * 1.1);
      const rand2 = pseudoRandom(globalSeed * 2.3);
      const rand3 = pseudoRandom(globalSeed * 3.7);
      const rand4 = pseudoRandom(globalSeed * 4.9);
      const rand5 = pseudoRandom(globalSeed * 5.2);

      const subtype = config.subtypes[Math.floor(rand1 * config.subtypes.length)];
      const unit = config.units[Math.floor(rand2 * config.units.length)];
      const hsn = config.hsnList[Math.floor(rand3 * config.hsnList.length)];
      
      const wh = WAREHOUSE_MAP[Math.floor(rand4 * WAREHOUSE_MAP.length)];
      const supplier = MOCK_SUPPLIERS[Math.floor(rand5 * MOCK_SUPPLIERS.length)];

      const grade = config.names.grades[i % config.names.grades.length];
      const spec = config.names.specs[Math.floor(rand2 * config.names.specs.length)];
      const name = `${grade} ${subtype} - ${spec}`;

      const padIndex = String(i + 1).padStart(4, '0');
      const id = `item-${config.prefix.toLowerCase()}-${padIndex}`;
      const sku = `${config.prefix}-${subtype.substring(0, 3).toUpperCase()}-${grade.substring(0, 3).toUpperCase()}-${padIndex}`;

      // Realistic wholesale pricing (Cost: ₹450 to ₹18,500; Margin 12% to 28%)
      const baseCost = Math.round(450 + rand3 * 6500);
      const margin = 0.14 + rand4 * 0.12;
      const sellingPrice = Math.round(baseCost * (1 + margin));

      // Reorder level between 15 and 80 units
      const reorderLevel = Math.round(15 + rand2 * 65);

      // Stock Distribution:
      // ~78% in stock, ~12% low stock, ~6% out of stock, ~4% dead stock (no sales in 90+ days)
      let currentStock: number;
      const stockRoll = rand1;
      let sales30Days: number;
      let lastSoldDate: string;

      if (stockRoll < 0.06) {
        // Out of Stock = 0
        currentStock = 0;
        sales30Days = Math.round(rand3 * 10);
        lastSoldDate = '2026-09-15';
      } else if (stockRoll < 0.18) {
        // Low Stock = 1 up to reorder level
        currentStock = Math.max(1, Math.round(rand2 * reorderLevel));
        sales30Days = Math.round(15 + rand3 * 40);
        lastSoldDate = '2026-10-07';
      } else if (stockRoll < 0.22) {
        // Dead Stock: Has stock, but zero sales in last 90 days
        currentStock = Math.round(reorderLevel + 10 + rand3 * 50);
        sales30Days = 0;
        lastSoldDate = '2026-06-10'; // > 90 days ago
      } else {
        // Regular In Stock: above reorder level
        currentStock = Math.round(reorderLevel + 10 + rand3 * 220);
        sales30Days = Math.round(25 + rand4 * 85);
        lastSoldDate = '2026-10-08';
      }

      const aisle = String.fromCharCode(65 + Math.floor(rand1 * 8));
      const rackNum = String(Math.floor(rand2 * 12) + 1).padStart(2, '0');
      const shelf = Math.floor(rand3 * 4) + 1;
      const rackLocation = `${wh.aislePrefix}-${aisle}${rackNum}-S${shelf}`;

      const barcode = `890${String(100000000 + i).slice(0, 9)}`;
      const images = CATEGORY_IMAGES[config.category];

      items.push({
        id,
        name,
        sku,
        materialCategory: config.category,
        materialSubtype: subtype,
        description: `Premium industrial grade ${name}. Manufactured to Indian wholesale standards (IS 303 / IS 710 compliant).`,
        currentStock,
        unit,
        reorderLevel,
        costPrice: baseCost,
        sellingPrice,
        gstRate: config.gstRate,
        hsnCode: hsn,
        warehouseId: wh.id,
        warehouseName: wh.name,
        rackLocation,
        supplierId: supplier.id,
        supplierName: supplier.companyName,
        images,
        barcode,
        sales30Days,
        lastSoldDate,
        isArchived: false,
        createdAt: '2025-04-01T00:00:00Z',
        updatedAt: '2026-10-08T10:00:00Z',
      });
    }
  });

  return items;
}

// Master seeded instance
export const MASTER_INVENTORY: InventoryItem[] = generateMasterInventory();
