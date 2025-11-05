/**
 * Indian Construction Materials Database
 * Climate-zone specific materials with pricing and specifications
 */

import { ClimateZone } from '../services/indiaLocalizationService';

export interface MaterialData {
  id: string;
  name: string;
  category: string;
  unit: string;
  basePrice: number; // Base price in INR
  gstRate: number;
  climateZones: ClimateZone[];
  specifications?: string;
  localAvailability: string[]; // States where commonly available
  qualityGrades?: string[];
  suppliers?: string[];
}

export const INDIAN_MATERIALS: MaterialData[] = [
  // Cement
  {
    id: 'cement-opc-43',
    name: 'OPC 43 Grade Cement',
    category: 'cement',
    unit: 'bag (50kg)',
    basePrice: 380,
    gstRate: 28,
    climateZones: ['tropical', 'subtropical', 'arid', 'mountain'],
    specifications: 'Ordinary Portland Cement, 43 Grade',
    localAvailability: ['MH', 'KA', 'TN', 'DL', 'GJ', 'UP'],
    qualityGrades: ['43 Grade'],
    suppliers: ['UltraTech', 'ACC', 'Ambuja', 'Shree Cement'],
  },
  {
    id: 'cement-opc-53',
    name: 'OPC 53 Grade Cement',
    category: 'cement',
    unit: 'bag (50kg)',
    basePrice: 420,
    gstRate: 28,
    climateZones: ['tropical', 'subtropical', 'arid', 'mountain'],
    specifications: 'Ordinary Portland Cement, 53 Grade - High strength',
    localAvailability: ['MH', 'KA', 'TN', 'DL', 'GJ'],
    qualityGrades: ['53 Grade'],
    suppliers: ['UltraTech', 'ACC', 'Ambuja'],
  },
  {
    id: 'cement-ppc',
    name: 'PPC Cement',
    category: 'cement',
    unit: 'bag (50kg)',
    basePrice: 360,
    gstRate: 28,
    climateZones: ['tropical', 'subtropical'],
    specifications: 'Portland Pozzolana Cement - Better for coastal areas',
    localAvailability: ['MH', 'KA', 'TN', 'KL', 'AP'],
    qualityGrades: ['PPC'],
    suppliers: ['UltraTech', 'ACC', 'Ambuja'],
  },

  // Steel & TMT Bars
  {
    id: 'tmt-8mm',
    name: 'TMT Bar 8mm',
    category: 'steel',
    unit: 'kg',
    basePrice: 55,
    gstRate: 18,
    climateZones: ['tropical', 'subtropical', 'arid', 'mountain'],
    specifications: 'Fe 500D Grade, Corrosion resistant',
    localAvailability: ['MH', 'KA', 'TN', 'DL', 'GJ', 'UP', 'WB'],
    qualityGrades: ['Fe 500', 'Fe 500D', 'Fe 550'],
    suppliers: ['TATA Steel', 'JSW', 'SAIL', 'Jindal'],
  },
  {
    id: 'tmt-12mm',
    name: 'TMT Bar 12mm',
    category: 'steel',
    unit: 'kg',
    basePrice: 54,
    gstRate: 18,
    climateZones: ['tropical', 'subtropical', 'arid', 'mountain'],
    specifications: 'Fe 500D Grade, Corrosion resistant',
    localAvailability: ['MH', 'KA', 'TN', 'DL', 'GJ', 'UP', 'WB'],
    qualityGrades: ['Fe 500', 'Fe 500D', 'Fe 550'],
    suppliers: ['TATA Steel', 'JSW', 'SAIL', 'Jindal'],
  },
  {
    id: 'tmt-16mm',
    name: 'TMT Bar 16mm',
    category: 'steel',
    unit: 'kg',
    basePrice: 53,
    gstRate: 18,
    climateZones: ['tropical', 'subtropical', 'arid', 'mountain'],
    specifications: 'Fe 500D Grade, Corrosion resistant',
    localAvailability: ['MH', 'KA', 'TN', 'DL', 'GJ', 'UP', 'WB'],
    qualityGrades: ['Fe 500', 'Fe 500D', 'Fe 550'],
    suppliers: ['TATA Steel', 'JSW', 'SAIL', 'Jindal'],
  },

  // Bricks
  {
    id: 'red-brick',
    name: 'Red Clay Brick',
    category: 'bricks',
    unit: 'piece',
    basePrice: 8,
    gstRate: 12,
    climateZones: ['tropical', 'subtropical', 'arid'],
    specifications: 'Standard size: 230x110x75mm',
    localAvailability: ['MH', 'KA', 'TN', 'UP', 'WB', 'PB', 'HR'],
    qualityGrades: ['First Class', 'Second Class'],
  },
  {
    id: 'fly-ash-brick',
    name: 'Fly Ash Brick',
    category: 'bricks',
    unit: 'piece',
    basePrice: 6,
    gstRate: 12,
    climateZones: ['tropical', 'subtropical', 'arid'],
    specifications: 'Eco-friendly, lightweight, 230x110x75mm',
    localAvailability: ['MH', 'KA', 'TN', 'DL', 'GJ'],
    qualityGrades: ['Standard'],
  },
  {
    id: 'concrete-block',
    name: 'Concrete Block',
    category: 'bricks',
    unit: 'piece',
    basePrice: 35,
    gstRate: 12,
    climateZones: ['tropical', 'subtropical', 'arid', 'mountain'],
    specifications: 'Hollow block, 400x200x200mm',
    localAvailability: ['MH', 'KA', 'TN', 'DL', 'GJ', 'KL'],
    qualityGrades: ['Standard', 'Load Bearing'],
  },

  // Sand
  {
    id: 'river-sand',
    name: 'River Sand',
    category: 'sand',
    unit: 'cubic feet',
    basePrice: 45,
    gstRate: 5,
    climateZones: ['tropical', 'subtropical', 'arid', 'mountain'],
    specifications: 'Natural river sand, washed',
    localAvailability: ['MH', 'KA', 'TN', 'UP', 'WB'],
  },
  {
    id: 'm-sand',
    name: 'M-Sand (Manufactured Sand)',
    category: 'sand',
    unit: 'cubic feet',
    basePrice: 40,
    gstRate: 5,
    climateZones: ['tropical', 'subtropical', 'arid', 'mountain'],
    specifications: 'Crushed granite, eco-friendly alternative',
    localAvailability: ['MH', 'KA', 'TN', 'DL', 'GJ', 'KL'],
  },

  // Aggregates
  {
    id: 'aggregate-20mm',
    name: '20mm Aggregate',
    category: 'aggregate',
    unit: 'cubic feet',
    basePrice: 50,
    gstRate: 5,
    climateZones: ['tropical', 'subtropical', 'arid', 'mountain'],
    specifications: 'Crushed stone, 20mm size',
    localAvailability: ['MH', 'KA', 'TN', 'DL', 'GJ', 'UP', 'WB'],
  },
  {
    id: 'aggregate-40mm',
    name: '40mm Aggregate',
    category: 'aggregate',
    unit: 'cubic feet',
    basePrice: 48,
    gstRate: 5,
    climateZones: ['tropical', 'subtropical', 'arid', 'mountain'],
    specifications: 'Crushed stone, 40mm size',
    localAvailability: ['MH', 'KA', 'TN', 'DL', 'GJ', 'UP', 'WB'],
  },

  // Tiles
  {
    id: 'vitrified-tiles',
    name: 'Vitrified Floor Tiles',
    category: 'tiles',
    unit: 'sq ft',
    basePrice: 45,
    gstRate: 28,
    climateZones: ['tropical', 'subtropical', 'arid'],
    specifications: '600x600mm, polished finish',
    localAvailability: ['MH', 'KA', 'TN', 'DL', 'GJ'],
    suppliers: ['Kajaria', 'Somany', 'Nitco'],
  },
  {
    id: 'ceramic-tiles',
    name: 'Ceramic Wall Tiles',
    category: 'tiles',
    unit: 'sq ft',
    basePrice: 35,
    gstRate: 28,
    climateZones: ['tropical', 'subtropical', 'arid', 'mountain'],
    specifications: '300x450mm, glossy finish',
    localAvailability: ['MH', 'KA', 'TN', 'DL', 'GJ', 'UP'],
    suppliers: ['Kajaria', 'Somany', 'Cera'],
  },
  {
    id: 'mangalore-tiles',
    name: 'Mangalore Roof Tiles',
    category: 'tiles',
    unit: 'piece',
    basePrice: 25,
    gstRate: 28,
    climateZones: ['tropical'],
    specifications: 'Clay roof tiles, traditional design',
    localAvailability: ['KA', 'KL', 'TN', 'MH'],
  },

  // Wood
  {
    id: 'teak-wood',
    name: 'Teak Wood',
    category: 'wood',
    unit: 'cubic feet',
    basePrice: 2500,
    gstRate: 18,
    climateZones: ['tropical', 'subtropical'],
    specifications: 'Premium quality, termite resistant',
    localAvailability: ['KA', 'KL', 'TN', 'MH'],
  },
  {
    id: 'sal-wood',
    name: 'Sal Wood',
    category: 'wood',
    unit: 'cubic feet',
    basePrice: 1800,
    gstRate: 18,
    climateZones: ['subtropical', 'mountain'],
    specifications: 'Durable hardwood',
    localAvailability: ['UP', 'WB', 'JK', 'HP'],
  },
  {
    id: 'deodar-wood',
    name: 'Deodar Wood',
    category: 'wood',
    unit: 'cubic feet',
    basePrice: 2200,
    gstRate: 18,
    climateZones: ['mountain'],
    specifications: 'Himalayan cedar, cold resistant',
    localAvailability: ['HP', 'UK', 'JK'],
  },

  // Paint
  {
    id: 'exterior-paint',
    name: 'Weather-proof Exterior Paint',
    category: 'paint',
    unit: 'liter',
    basePrice: 450,
    gstRate: 28,
    climateZones: ['tropical', 'subtropical', 'arid', 'mountain'],
    specifications: 'Acrylic emulsion, weather resistant',
    localAvailability: ['MH', 'KA', 'TN', 'DL', 'GJ', 'UP', 'WB'],
    suppliers: ['Asian Paints', 'Berger', 'Nerolac'],
  },
  {
    id: 'interior-paint',
    name: 'Interior Emulsion Paint',
    category: 'paint',
    unit: 'liter',
    basePrice: 380,
    gstRate: 28,
    climateZones: ['tropical', 'subtropical', 'arid', 'mountain'],
    specifications: 'Washable, low VOC',
    localAvailability: ['MH', 'KA', 'TN', 'DL', 'GJ', 'UP', 'WB'],
    suppliers: ['Asian Paints', 'Berger', 'Nerolac'],
  },

  // Stone
  {
    id: 'granite',
    name: 'Granite Slab',
    category: 'stone',
    unit: 'sq ft',
    basePrice: 120,
    gstRate: 28,
    climateZones: ['tropical', 'subtropical', 'arid', 'mountain'],
    specifications: 'Polished finish, 18mm thickness',
    localAvailability: ['KA', 'TN', 'AP', 'TG', 'RJ'],
  },
  {
    id: 'marble',
    name: 'Marble Slab',
    category: 'stone',
    unit: 'sq ft',
    basePrice: 180,
    gstRate: 28,
    climateZones: ['subtropical', 'arid'],
    specifications: 'Italian marble, polished',
    localAvailability: ['RJ', 'GJ', 'DL', 'UP'],
  },
  {
    id: 'sandstone',
    name: 'Sandstone',
    category: 'stone',
    unit: 'sq ft',
    basePrice: 90,
    gstRate: 28,
    climateZones: ['arid', 'subtropical'],
    specifications: 'Natural finish, heat resistant',
    localAvailability: ['RJ', 'GJ', 'MP'],
  },
  {
    id: 'laterite-stone',
    name: 'Laterite Stone',
    category: 'stone',
    unit: 'cubic feet',
    basePrice: 65,
    gstRate: 28,
    climateZones: ['tropical'],
    specifications: 'Porous, moisture resistant',
    localAvailability: ['KL', 'KA', 'MH', 'GOA'],
  },
];

/**
 * Get materials filtered by climate zone
 */
export function getMaterialsByClimateZone(zone: ClimateZone): MaterialData[] {
  return INDIAN_MATERIALS.filter((material) => material.climateZones.includes(zone));
}

/**
 * Get materials filtered by category
 */
export function getMaterialsByCategory(category: string): MaterialData[] {
  return INDIAN_MATERIALS.filter(
    (material) => material.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get materials filtered by climate zone and category
 */
export function getMaterialsByZoneAndCategory(zone: ClimateZone, category: string): MaterialData[] {
  return INDIAN_MATERIALS.filter(
    (material) =>
      material.climateZones.includes(zone) &&
      material.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get materials available in a specific state
 */
export function getMaterialsByState(stateCode: string): MaterialData[] {
  return INDIAN_MATERIALS.filter((material) =>
    material.localAvailability.includes(stateCode.toUpperCase())
  );
}

/**
 * Search materials by name
 */
export function searchMaterials(query: string): MaterialData[] {
  const lowerQuery = query.toLowerCase();
  return INDIAN_MATERIALS.filter(
    (material) =>
      material.name.toLowerCase().includes(lowerQuery) ||
      material.category.toLowerCase().includes(lowerQuery) ||
      material.specifications?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all unique material categories
 */
export function getMaterialCategories(): string[] {
  const categories = new Set(INDIAN_MATERIALS.map((m) => m.category));
  return Array.from(categories).sort();
}
