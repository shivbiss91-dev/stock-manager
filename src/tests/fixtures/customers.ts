import { Customer } from '../../types/sales';

const BASE_CITIES_STATES = [
  { state: 'Maharashtra', stateCode: '27', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'] },
  { state: 'Gujarat', stateCode: '24', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Morbi'] },
  { state: 'Karnataka', stateCode: '29', cities: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi'] },
  { state: 'Delhi', stateCode: '07', cities: ['New Delhi', 'North Delhi', 'South Delhi', 'Dwarka'] },
  { state: 'Tamil Nadu', stateCode: '33', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'] },
  { state: 'Telangana', stateCode: '36', cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam'] },
  { state: 'Rajasthan', stateCode: '08', cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'] },
  { state: 'Uttar Pradesh', stateCode: '09', cities: ['Lucknow', 'Kanpur', 'Noida', 'Agra', 'Varanasi'] },
  { state: 'West Bengal', stateCode: '19', cities: ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur'] },
  { state: 'Madhya Pradesh', stateCode: '23', cities: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior'] },
  { state: 'Kerala', stateCode: '32', cities: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'] },
  { state: 'Punjab', stateCode: '03', cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Mohali'] },
  { state: 'Haryana', stateCode: '06', cities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala'] },
  { state: 'Andhra Pradesh', stateCode: '37', cities: ['Visakhapatnam', 'Vijayawada', 'Guntur'] },
  { state: 'Odisha', stateCode: '21', cities: ['Bhubaneswar', 'Cuttack', 'Rourkela'] },
];

const COMPANY_PREFIXES = [
  'Rajdhani', 'Royal', 'Shree Ram', 'Balaji', 'Navkar', 'Kalyan', 'Apex', 'Premier',
  'National', 'Vardhman', 'Maruti', 'Galaxy', 'Krishna', 'Surya', 'Bharat', 'Mahalaxmi',
  'Classic', 'Deccan', 'Karnataka', 'Hindustan', 'Ambika', 'Shanti', 'Metro', 'Crown'
];

const BUSINESS_TYPES = [
  'Timber & Plywood Mart', 'Interiors & Furnishings Pvt Ltd', 'Hardware & Building Solutions',
  'Commercial Infrastructure Ltd', 'Industrial Supplies Corp', 'Design & Fabricators',
  'Contractors & Wholesale Hub', 'Glass & Glazing Works', 'Packaging Systems LLP',
  'Builders & Material Depot'
];

const TIERS: ('Wholesale Standard' | 'Distributor Platinum' | 'Retail Partner')[] = [
  'Wholesale Standard', 'Distributor Platinum', 'Retail Partner'
];

export const MOCK_CUSTOMERS: Customer[] = Array.from({ length: 155 }, (_, i) => {
  const locIndex = i % BASE_CITIES_STATES.length;
  const loc = BASE_CITIES_STATES[locIndex];
  const city = loc.cities[i % loc.cities.length];
  const prefix = COMPANY_PREFIXES[i % COMPANY_PREFIXES.length];
  const bType = BUSINESS_TYPES[i % BUSINESS_TYPES.length];
  const companyName = `${prefix} ${bType}`;
  const pad = String(i + 1).padStart(4, '0');
  const panChar = String.fromCharCode(65 + (i % 26));

  // Valid 15-character GSTIN format: StateCode (2) + 5 Alpha + 4 Digit + 1 Alpha + 1 Char + Z + 1 Char
  const gstin = `${loc.stateCode}AAAC${panChar}${1000 + i}${panChar}1Z${(i % 9) + 1}`;

  const creditLimit = [1000000, 2500000, 5000000, 7500000, 10000000][i % 5]; // ₹10L - ₹1Cr
  const outstandingRatio = [0, 0.15, 0.35, 0.6, 0.85, 1.05][i % 6];
  const outstanding = Math.round(creditLimit * outstandingRatio);

  return {
    id: `cust-${pad}`,
    name: `${prefix} Wholesale (${city})`,
    companyName,
    gstin,
    stateCode: loc.stateCode,
    state: loc.state,
    city,
    billingAddress: `Plot No. ${40 + (i % 80)}, Wholesale Timber Market, Ring Road, ${city}`,
    shippingAddress: `Warehouse Gate ${((i % 4) + 1)}, Logistics Park, ${city}, ${loc.state}`,
    pincode: `${loc.stateCode}00${String((i % 89) + 10).padStart(2, '0')}`,
    contactPerson: `Mr. ${['Ramesh', 'Sanjay', 'Mahesh', 'Girish', 'Kamlesh', 'Deepak', 'Anand', 'Praveen'][i % 8]} ${['Jain', 'Agarwal', 'Shah', 'Gupta', 'Patel', 'Reddy', 'Sharma', 'Verma'][i % 8]}`,
    phone: `+91 ${98200 + (i % 900)} ${String(10000 + (i * 37) % 89999).padStart(5, '0')}`,
    email: `accounts@${prefix.toLowerCase().replace(/\s+/g, '')}${city.toLowerCase().slice(0, 3)}.in`,
    creditLimitINR: creditLimit,
    outstandingBalanceINR: outstanding,
    paymentTermsDays: [15, 30, 45, 60][i % 4],
    tier: TIERS[i % TIERS.length],
  };
});
