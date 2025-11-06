/**
 * India Localization Service
 * Provides India-specific formatting, calculations, and utilities
 */

// GST rates for different material categories (as of 2024)
export const GST_RATES: Record<string, number> = {
  cement: 28,
  steel: 18,
  'tmt-bars': 18,
  sand: 5,
  bricks: 12,
  tiles: 28,
  paint: 28,
  wood: 18,
  glass: 28,
  electrical: 18,
  plumbing: 18,
  hardware: 18,
  labor: 18,
  professional: 18,
  permits: 18,
  default: 18,
};

// Indian states with their codes
export const INDIAN_STATES = [
  { code: 'MH', name: 'Maharashtra', zone: 'tropical' },
  { code: 'KA', name: 'Karnataka', zone: 'tropical' },
  { code: 'TN', name: 'Tamil Nadu', zone: 'tropical' },
  { code: 'DL', name: 'Delhi', zone: 'subtropical' },
  { code: 'GJ', name: 'Gujarat', zone: 'arid' },
  { code: 'RJ', name: 'Rajasthan', zone: 'arid' },
  { code: 'UP', name: 'Uttar Pradesh', zone: 'subtropical' },
  { code: 'WB', name: 'West Bengal', zone: 'tropical' },
  { code: 'KL', name: 'Kerala', zone: 'tropical' },
  { code: 'AP', name: 'Andhra Pradesh', zone: 'tropical' },
  { code: 'TG', name: 'Telangana', zone: 'tropical' },
  { code: 'PB', name: 'Punjab', zone: 'subtropical' },
  { code: 'HR', name: 'Haryana', zone: 'subtropical' },
  { code: 'HP', name: 'Himachal Pradesh', zone: 'mountain' },
  { code: 'UK', name: 'Uttarakhand', zone: 'mountain' },
  { code: 'JK', name: 'Jammu and Kashmir', zone: 'mountain' },
];

export type ClimateZone = 'tropical' | 'subtropical' | 'mountain' | 'arid';

export interface GSTCalculation {
  baseAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  breakdown: {
    cgst: number;
    sgst: number;
  };
}

export interface ClimateRecommendation {
  zone: ClimateZone;
  materials: string[];
  considerations: string[];
  monsoonMonths: number[];
}

export interface MaterialData {
  name: string;
  category: string;
  unit: string;
  estimatedCost: number;
  gstRate: number;
  climateZones: ClimateZone[];
  isLocal: boolean;
  description: string;
}

// Comprehensive material database for Indian construction
export const INDIAN_MATERIALS: MaterialData[] = [
  // Cement & Concrete
  { name: 'OPC 53 Grade Cement', category: 'cement', unit: 'bag', estimatedCost: 400, gstRate: 28, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'High strength cement for all construction' },
  { name: 'OPC 43 Grade Cement', category: 'cement', unit: 'bag', estimatedCost: 350, gstRate: 28, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Standard cement for general construction' },
  { name: 'PPC Cement', category: 'cement', unit: 'bag', estimatedCost: 380, gstRate: 28, climateZones: ['tropical', 'subtropical', 'arid'], isLocal: true, description: 'Portland Pozzolana Cement, eco-friendly' },
  { name: 'Ready Mix Concrete M20', category: 'concrete', unit: 'cubic meter', estimatedCost: 4500, gstRate: 28, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Standard grade concrete' },
  { name: 'Ready Mix Concrete M25', category: 'concrete', unit: 'cubic meter', estimatedCost: 5000, gstRate: 28, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'High strength concrete' },
  
  // Steel & Metal
  { name: 'TMT Steel Bars Fe 500', category: 'steel', unit: 'kg', estimatedCost: 75, gstRate: 18, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Thermo-mechanically treated steel bars' },
  { name: 'TMT Steel Bars Fe 550', category: 'steel', unit: 'kg', estimatedCost: 80, gstRate: 18, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'High strength TMT bars' },
  { name: 'MS Angles', category: 'steel', unit: 'kg', estimatedCost: 70, gstRate: 18, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Mild steel angles for structural work' },
  { name: 'Steel Mesh', category: 'steel', unit: 'sq meter', estimatedCost: 150, gstRate: 18, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Welded steel mesh for reinforcement' },
  
  // Bricks & Blocks
  { name: 'Red Clay Bricks', category: 'bricks', unit: 'piece', estimatedCost: 8, gstRate: 12, climateZones: ['tropical', 'subtropical'], isLocal: true, description: 'Traditional clay bricks' },
  { name: 'Fly Ash Bricks', category: 'bricks', unit: 'piece', estimatedCost: 6, gstRate: 12, climateZones: ['tropical', 'subtropical', 'arid'], isLocal: true, description: 'Eco-friendly lightweight bricks' },
  { name: 'AAC Blocks', category: 'blocks', unit: 'cubic meter', estimatedCost: 3500, gstRate: 12, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Autoclaved Aerated Concrete blocks' },
  { name: 'Concrete Blocks', category: 'blocks', unit: 'piece', estimatedCost: 35, gstRate: 12, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Hollow concrete blocks' },
  
  // Aggregates
  { name: 'River Sand', category: 'sand', unit: 'cubic meter', estimatedCost: 1500, gstRate: 5, climateZones: ['tropical', 'subtropical'], isLocal: true, description: 'Natural river sand' },
  { name: 'M-Sand (Manufactured Sand)', category: 'sand', unit: 'cubic meter', estimatedCost: 1200, gstRate: 5, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Crushed stone sand' },
  { name: '20mm Aggregate', category: 'aggregate', unit: 'cubic meter', estimatedCost: 1800, gstRate: 5, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Coarse aggregate for concrete' },
  { name: '10mm Aggregate', category: 'aggregate', unit: 'cubic meter', estimatedCost: 1900, gstRate: 5, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Fine aggregate for concrete' },
  
  // Stone & Masonry
  { name: 'Laterite Stone', category: 'stone', unit: 'cubic meter', estimatedCost: 2500, gstRate: 5, climateZones: ['tropical'], isLocal: true, description: 'Porous stone ideal for tropical climate' },
  { name: 'Granite Stone', category: 'stone', unit: 'sq meter', estimatedCost: 350, gstRate: 28, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Durable granite for flooring' },
  { name: 'Marble', category: 'stone', unit: 'sq meter', estimatedCost: 500, gstRate: 28, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Premium marble for flooring' },
  { name: 'Kota Stone', category: 'stone', unit: 'sq meter', estimatedCost: 180, gstRate: 28, climateZones: ['subtropical', 'arid'], isLocal: true, description: 'Limestone from Rajasthan' },
  { name: 'Sandstone', category: 'stone', unit: 'sq meter', estimatedCost: 250, gstRate: 28, climateZones: ['arid', 'subtropical'], isLocal: true, description: 'Natural sandstone for walls' },
  
  // Wood & Timber
  { name: 'Teak Wood', category: 'wood', unit: 'cubic feet', estimatedCost: 2500, gstRate: 18, climateZones: ['tropical', 'subtropical'], isLocal: true, description: 'Premium hardwood, termite resistant' },
  { name: 'Sal Wood', category: 'wood', unit: 'cubic feet', estimatedCost: 1800, gstRate: 18, climateZones: ['subtropical'], isLocal: true, description: 'Durable hardwood' },
  { name: 'Deodar Wood', category: 'wood', unit: 'cubic feet', estimatedCost: 1500, gstRate: 18, climateZones: ['mountain'], isLocal: true, description: 'Himalayan cedar, good for cold climates' },
  { name: 'Pine Wood', category: 'wood', unit: 'cubic feet', estimatedCost: 1200, gstRate: 18, climateZones: ['mountain'], isLocal: true, description: 'Softwood for mountain regions' },
  { name: 'Plywood (BWP)', category: 'wood', unit: 'sheet', estimatedCost: 1800, gstRate: 18, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Boiling Water Proof plywood' },
  
  // Tiles & Flooring
  { name: 'Vitrified Tiles', category: 'tiles', unit: 'sq meter', estimatedCost: 450, gstRate: 28, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Glazed ceramic tiles' },
  { name: 'Ceramic Tiles', category: 'tiles', unit: 'sq meter', estimatedCost: 300, gstRate: 28, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Standard ceramic tiles' },
  { name: 'Mangalore Tiles', category: 'tiles', unit: 'piece', estimatedCost: 35, gstRate: 28, climateZones: ['tropical'], isLocal: true, description: 'Clay roof tiles for tropical climate' },
  { name: 'Slate Tiles', category: 'tiles', unit: 'sq meter', estimatedCost: 600, gstRate: 28, climateZones: ['mountain'], isLocal: true, description: 'Natural slate for roofing' },
  
  // Paint & Coating
  { name: 'Exterior Emulsion Paint', category: 'paint', unit: 'liter', estimatedCost: 350, gstRate: 28, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Weather-resistant exterior paint' },
  { name: 'Interior Emulsion Paint', category: 'paint', unit: 'liter', estimatedCost: 280, gstRate: 28, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Interior wall paint' },
  { name: 'Waterproofing Compound', category: 'paint', unit: 'kg', estimatedCost: 150, gstRate: 28, climateZones: ['tropical', 'subtropical', 'mountain'], isLocal: true, description: 'Waterproofing for monsoon protection' },
  { name: 'Anti-fungal Coating', category: 'paint', unit: 'liter', estimatedCost: 400, gstRate: 28, climateZones: ['tropical'], isLocal: true, description: 'Prevents fungal growth in humid climate' },
  
  // Electrical
  { name: 'Copper Wire (2.5 sq mm)', category: 'electrical', unit: 'meter', estimatedCost: 35, gstRate: 18, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Standard electrical wire' },
  { name: 'PVC Conduit Pipe', category: 'electrical', unit: 'meter', estimatedCost: 25, gstRate: 18, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Electrical conduit' },
  { name: 'MCB (Circuit Breaker)', category: 'electrical', unit: 'piece', estimatedCost: 250, gstRate: 18, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Miniature circuit breaker' },
  
  // Plumbing
  { name: 'CPVC Pipes', category: 'plumbing', unit: 'meter', estimatedCost: 80, gstRate: 18, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Hot and cold water pipes' },
  { name: 'PVC Pipes (4 inch)', category: 'plumbing', unit: 'meter', estimatedCost: 120, gstRate: 18, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Drainage pipes' },
  { name: 'Water Tank (1000L)', category: 'plumbing', unit: 'piece', estimatedCost: 8000, gstRate: 18, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: true, description: 'Overhead water storage' },
  
  // Insulation & Specialty
  { name: 'Thermal Insulation', category: 'insulation', unit: 'sq meter', estimatedCost: 200, gstRate: 18, climateZones: ['mountain', 'arid'], isLocal: false, description: 'Temperature control insulation' },
  { name: 'Acoustic Insulation', category: 'insulation', unit: 'sq meter', estimatedCost: 250, gstRate: 18, climateZones: ['tropical', 'subtropical', 'mountain', 'arid'], isLocal: false, description: 'Sound insulation' },
  { name: 'Double Glazed Windows', category: 'glass', unit: 'sq meter', estimatedCost: 1500, gstRate: 28, climateZones: ['mountain'], isLocal: false, description: 'Insulated windows for cold climate' },
];

export class IndiaLocalizationService {
  /**
   * Format currency in Indian format (lakhs/crores)
   */
  static formatCurrency(amount: number, options?: { compact?: boolean; showSymbol?: boolean }): string {
    const { compact = false, showSymbol = true } = options || {};
    const symbol = showSymbol ? '₹' : '';

    if (compact) {
      if (amount >= 10000000) {
        return `${symbol}${(amount / 10000000).toFixed(2)} Cr`;
      } else if (amount >= 100000) {
        return `${symbol}${(amount / 100000).toFixed(2)} L`;
      } else if (amount >= 1000) {
        return `${symbol}${(amount / 1000).toFixed(2)} K`;
      }
    }

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format number in Indian numbering system
   */
  static formatNumber(num: number): string {
    return new Intl.NumberFormat('en-IN').format(num);
  }

  /**
   * Calculate GST for a given amount and material category
   */
  static calculateGST(amount: number, category: string): GSTCalculation {
    const gstRate = GST_RATES[category.toLowerCase()] || GST_RATES.default;
    const gstAmount = (amount * gstRate) / 100;
    const totalAmount = amount + gstAmount;

    return {
      baseAmount: amount,
      gstRate,
      gstAmount,
      totalAmount,
      breakdown: {
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
      },
    };
  }

  /**
   * Get GST rate for a material category
   */
  static getGSTRate(category: string): number {
    return GST_RATES[category.toLowerCase()] || GST_RATES.default;
  }

  /**
   * Format date in Indian format (DD/MM/YYYY)
   */
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Format date and time in Indian format
   */
  static formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const dateStr = this.formatDate(d);
    const time = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} ${time}`;
  }

  /**
   * Get climate zone for a state
   */
  static getClimateZone(state: string): ClimateZone {
    const stateData = INDIAN_STATES.find(
      (s) => s.name.toLowerCase() === state.toLowerCase() || s.code === state.toUpperCase()
    );
    return (stateData?.zone as ClimateZone) || 'tropical';
  }

  /**
   * Get climate-specific recommendations
   */
  static getClimateRecommendations(zone: ClimateZone): ClimateRecommendation {
    const recommendations: Record<ClimateZone, ClimateRecommendation> = {
      tropical: {
        zone: 'tropical',
        materials: [
          'Laterite stone',
          'Red bricks',
          'Mangalore tiles',
          'Teak wood',
          'Weather-resistant paint',
          'Anti-fungal coating',
        ],
        considerations: [
          'High humidity resistance required',
          'Monsoon-proof materials essential',
          'Ventilation is critical',
          'Termite protection needed',
          'Heat-reflective roofing recommended',
        ],
        monsoonMonths: [6, 7, 8, 9], // June to September
      },
      subtropical: {
        zone: 'subtropical',
        materials: [
          'Red bricks',
          'Concrete blocks',
          'Ceramic tiles',
          'Sal wood',
          'Weather-resistant cement',
        ],
        considerations: [
          'Moderate climate adaptability',
          'Seasonal temperature variation',
          'Monsoon preparation needed',
          'Good insulation recommended',
        ],
        monsoonMonths: [7, 8, 9], // July to September
      },
      mountain: {
        zone: 'mountain',
        materials: [
          'Stone masonry',
          'Deodar wood',
          'Slate roofing',
          'Thermal insulation',
          'Double-glazed windows',
        ],
        considerations: [
          'Cold weather resistance essential',
          'Snow load capacity required',
          'Thermal insulation critical',
          'Earthquake-resistant design',
          'Moisture protection from snow',
        ],
        monsoonMonths: [7, 8], // July to August
      },
      arid: {
        zone: 'arid',
        materials: [
          'Sandstone',
          'Lime plaster',
          'Clay tiles',
          'Heat-resistant paint',
          'Reflective roofing',
        ],
        considerations: [
          'Extreme heat resistance needed',
          'Dust protection required',
          'Water conservation critical',
          'Thermal mass for cooling',
          'Minimal monsoon impact',
        ],
        monsoonMonths: [7, 8], // July to August (minimal)
      },
    };

    return recommendations[zone];
  }

  /**
   * Validate GSTIN (GST Identification Number)
   */
  static validateGSTIN(gstin: string): boolean {
    // GSTIN format: 2 digits (state code) + 10 chars (PAN) + 1 char (entity number) + 1 char (Z) + 1 char (checksum)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  }

  /**
   * Get Indian holidays for a given year and state
   */
  static getHolidayCalendar(year: number, state?: string): Array<{ date: Date; name: string; type: string }> {
    // National holidays (common across India)
    const holidays = [
      { date: new Date(year, 0, 26), name: 'Republic Day', type: 'national' },
      { date: new Date(year, 7, 15), name: 'Independence Day', type: 'national' },
      { date: new Date(year, 9, 2), name: 'Gandhi Jayanti', type: 'national' },
      { date: new Date(year, 11, 25), name: 'Christmas', type: 'national' },
    ];

    // Add major festivals (dates vary by lunar calendar, these are approximate)
    holidays.push(
      { date: new Date(year, 2, 8), name: 'Holi', type: 'festival' },
      { date: new Date(year, 9, 24), name: 'Diwali', type: 'festival' },
      { date: new Date(year, 7, 19), name: 'Raksha Bandhan', type: 'festival' },
      { date: new Date(year, 8, 7), name: 'Ganesh Chaturthi', type: 'festival' }
    );

    return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Check if a date falls in monsoon season for a given climate zone
   */
  static isMonsoonSeason(date: Date, zone: ClimateZone): boolean {
    const month = date.getMonth() + 1; // 1-12
    const recommendations = this.getClimateRecommendations(zone);
    return recommendations.monsoonMonths.includes(month);
  }

  /**
   * Format Indian mobile number
   */
  static formatMobileNumber(number: string): string {
    // Remove all non-digits
    const cleaned = number.replace(/\D/g, '');

    // Check if it starts with country code
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }

    return number; // Return as-is if format is unclear
  }

  /**
   * Validate Indian mobile number
   */
  static validateMobileNumber(number: string): boolean {
    const cleaned = number.replace(/\D/g, '');
    // Indian mobile numbers: 10 digits starting with 6-9
    return /^[6-9]\d{9}$/.test(cleaned) || /^91[6-9]\d{9}$/.test(cleaned);
  }

  /**
   * Get material suggestions based on climate zone and location
   */
  static getMaterialSuggestions(zone: ClimateZone, category?: string): string[] {
    const recommendations = this.getClimateRecommendations(zone);

    if (!category) {
      return recommendations.materials;
    }

    // Filter by category if provided
    const categoryLower = category.toLowerCase();
    return recommendations.materials.filter((material) =>
      material.toLowerCase().includes(categoryLower)
    );
  }

  /**
   * Get detailed material data for a climate zone
   */
  static getMaterialsByClimateZone(zone: ClimateZone, category?: string): MaterialData[] {
    let materials = INDIAN_MATERIALS.filter((material) =>
      material.climateZones.includes(zone)
    );

    if (category) {
      const categoryLower = category.toLowerCase();
      materials = materials.filter((material) =>
        material.category.toLowerCase() === categoryLower
      );
    }

    return materials;
  }

  /**
   * Get all material categories
   */
  static getMaterialCategories(): string[] {
    const categories = new Set(INDIAN_MATERIALS.map((m) => m.category));
    return Array.from(categories).sort();
  }

  /**
   * Search materials by name or description
   */
  static searchMaterials(query: string, zone?: ClimateZone): MaterialData[] {
    const queryLower = query.toLowerCase();
    let materials = INDIAN_MATERIALS.filter(
      (material) =>
        material.name.toLowerCase().includes(queryLower) ||
        material.description.toLowerCase().includes(queryLower)
    );

    if (zone) {
      materials = materials.filter((material) =>
        material.climateZones.includes(zone)
      );
    }

    return materials;
  }

  /**
   * Get material by exact name
   */
  static getMaterialByName(name: string): MaterialData | undefined {
    return INDIAN_MATERIALS.find(
      (material) => material.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Get regional pricing adjustment factor
   */
  static getRegionalPricingFactor(state: string): number {
    // Pricing factors based on state (1.0 is baseline)
    const pricingFactors: Record<string, number> = {
      MH: 1.1, // Maharashtra (Mumbai premium)
      DL: 1.15, // Delhi (high cost)
      KA: 1.05, // Karnataka (Bangalore premium)
      TN: 1.0, // Tamil Nadu (baseline)
      KL: 1.05, // Kerala
      GJ: 0.95, // Gujarat
      RJ: 0.9, // Rajasthan
      UP: 0.85, // Uttar Pradesh
      WB: 0.95, // West Bengal
      AP: 0.9, // Andhra Pradesh
      TG: 1.0, // Telangana
      PB: 0.95, // Punjab
      HR: 1.0, // Haryana
      HP: 1.1, // Himachal Pradesh (transport costs)
      UK: 1.1, // Uttarakhand (transport costs)
      JK: 1.15, // Jammu & Kashmir (transport costs)
    };

    const stateData = INDIAN_STATES.find(
      (s) => s.name.toLowerCase() === state.toLowerCase() || s.code === state.toUpperCase()
    );

    return pricingFactors[stateData?.code || 'TN'] || 1.0;
  }

  /**
   * Calculate material cost with regional pricing
   */
  static calculateMaterialCost(
    materialName: string,
    quantity: number,
    state?: string
  ): { baseCost: number; regionalCost: number; gstAmount: number; totalCost: number } | null {
    const material = this.getMaterialByName(materialName);
    if (!material) return null;

    const baseCost = material.estimatedCost * quantity;
    const pricingFactor = state ? this.getRegionalPricingFactor(state) : 1.0;
    const regionalCost = baseCost * pricingFactor;
    const gstAmount = (regionalCost * material.gstRate) / 100;
    const totalCost = regionalCost + gstAmount;

    return {
      baseCost,
      regionalCost,
      gstAmount,
      totalCost,
    };
  }

  /**
   * Calculate project timeline considering monsoon season
   */
  static adjustTimelineForMonsoon(
    startDate: Date,
    durationDays: number,
    zone: ClimateZone
  ): { endDate: Date; monsoonDays: number; adjustedDuration: number } {
    const recommendations = this.getClimateRecommendations(zone);
    let currentDate = new Date(startDate);
    let workingDays = 0;
    let monsoonDays = 0;

    while (workingDays < durationDays) {
      const month = currentDate.getMonth() + 1;

      if (recommendations.monsoonMonths.includes(month)) {
        // Assume 50% productivity during monsoon
        workingDays += 0.5;
        monsoonDays += 1;
      } else {
        workingDays += 1;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      endDate: currentDate,
      monsoonDays,
      adjustedDuration: Math.ceil(workingDays),
    };
  }

  /**
   * Get expense categories for Indian construction projects
   */
  static getExpenseCategories(): Array<{ value: string; label: string; gstRate: number }> {
    return [
      { value: 'materials', label: 'Materials', gstRate: 18 },
      { value: 'labor', label: 'Labor', gstRate: 18 },
      { value: 'permits', label: 'Permits & Approvals', gstRate: 18 },
      { value: 'professional', label: 'Professional Fees', gstRate: 18 },
      { value: 'equipment', label: 'Equipment Rental', gstRate: 18 },
      { value: 'transportation', label: 'Transportation', gstRate: 5 },
      { value: 'utilities', label: 'Utilities', gstRate: 18 },
      { value: 'insurance', label: 'Insurance', gstRate: 18 },
      { value: 'miscellaneous', label: 'Miscellaneous', gstRate: 18 },
    ];
  }

  /**
   * Get task categories for Indian construction projects
   */
  static getTaskCategories(): Array<{ value: string; label: string; icon?: string }> {
    return [
      { value: 'foundation', label: 'Foundation Work', icon: '🏗️' },
      { value: 'structure', label: 'Structural Work', icon: '🏛️' },
      { value: 'masonry', label: 'Masonry', icon: '🧱' },
      { value: 'plumbing', label: 'Plumbing', icon: '🚰' },
      { value: 'electrical', label: 'Electrical', icon: '⚡' },
      { value: 'flooring', label: 'Flooring', icon: '📐' },
      { value: 'painting', label: 'Painting', icon: '🎨' },
      { value: 'carpentry', label: 'Carpentry', icon: '🪚' },
      { value: 'vastu', label: 'Vastu Compliance', icon: '🕉️' },
      { value: 'monsoon-prep', label: 'Monsoon Preparation', icon: '☔' },
      { value: 'permits', label: 'Permits & Approvals', icon: '📋' },
      { value: 'inspection', label: 'Inspection', icon: '🔍' },
    ];
  }
}

export default IndiaLocalizationService;
