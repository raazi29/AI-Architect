export interface FloorPlanTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: string;
  subcategory: string;
  dimensions: string;
  features: string[];
  icon: string;
  estimatedSize?: string;
}

export const floorPlanTemplates: FloorPlanTemplate[] = [
  // APARTMENTS
  {
    id: "apt-studio-modern",
    name: "Modern Studio Apartment",
    description: "Compact yet stylish studio with efficient space utilization",
    prompt: "Modern studio apartment floor plan: open living/sleeping area, compact kitchen with island, full bathroom, large windows for natural light, minimalist design, 400 sq ft",
    category: "Apartments",
    subcategory: "Studio",
    dimensions: "Small (400 sq ft)",
    features: ["Open Concept", "Natural Light", "Minimalist"],
    icon: "🏠",
    estimatedSize: "400 sq ft"
  },
  {
    id: "apt-1br-urban",
    name: "Urban 1-Bedroom",
    description: "Efficient one-bedroom apartment perfect for city living",
    prompt: "Urban one-bedroom apartment floor plan: bedroom with walk-in closet, combined living/dining area, galley kitchen, full bathroom, city view balcony, modern appliances, 650 sq ft",
    category: "Apartments",
    subcategory: "1 Bedroom",
    dimensions: "Medium (650 sq ft)",
    features: ["Balcony", "Walk-in Closet", "Modern Kitchen"],
    icon: "🏢",
    estimatedSize: "650 sq ft"
  },
  {
    id: "apt-2br-family",
    name: "Family 2-Bedroom",
    description: "Comfortable two-bedroom apartment for small families",
    prompt: "Two-bedroom apartment floor plan: master bedroom with en-suite, second bedroom, open living/dining, modern kitchen with breakfast bar, family bathroom, storage, balcony, 900 sq ft",
    category: "Apartments",
    subcategory: "2 Bedroom",
    dimensions: "Medium (900 sq ft)",
    features: ["En-suite Bathroom", "Breakfast Bar", "Storage"],
    icon: "👨‍👩‍👧‍👦",
    estimatedSize: "900 sq ft"
  },
  {
    id: "apt-3br-luxury",
    name: "Luxury 3-Bedroom",
    description: "Spacious three-bedroom apartment with premium finishes",
    prompt: "Luxury three-bedroom apartment: master suite with walk-in closet and spa bathroom, two additional bedrooms, formal living and dining, gourmet kitchen, powder room, laundry, private terrace, 1400 sq ft",
    category: "Apartments",
    subcategory: "3 Bedroom",
    dimensions: "Large (1400 sq ft)",
    features: ["Master Suite", "Gourmet Kitchen", "Private Terrace"],
    icon: "✨",
    estimatedSize: "1400 sq ft"
  },
  {
    id: "apt-loft-industrial",
    name: "Industrial Loft",
    description: "Converted warehouse loft with high ceilings and exposed brick",
    prompt: "Industrial loft apartment: open floor plan, exposed brick walls, high ceilings, concrete floors, modern kitchen with island, bedroom with walk-in closet, bathroom with rainfall shower, large windows, 1200 sq ft",
    category: "Apartments",
    subcategory: "Loft",
    dimensions: "Large (1200 sq ft)",
    features: ["High Ceilings", "Exposed Brick", "Open Plan"],
    icon: "🏭",
    estimatedSize: "1200 sq ft"
  },

  // HOUSES
  {
    id: "house-3br-suburban",
    name: "Suburban Family Home",
    description: "Traditional suburban house with attached garage",
    prompt: "Three-bedroom suburban house: master bedroom with en-suite, two kids' rooms, family bathroom, living room with fireplace, dining room, kitchen with island, laundry room, attached two-car garage, backyard patio, 1800 sq ft",
    category: "Houses",
    subcategory: "3 Bedroom",
    dimensions: "Large (1800 sq ft)",
    features: ["Attached Garage", "Fireplace", "Backyard Patio"],
    icon: "🏘️",
    estimatedSize: "1800 sq ft"
  },
  {
    id: "house-4br-colonial",
    name: "Colonial Style Home",
    description: "Classic colonial with formal rooms and traditional layout",
    prompt: "Four-bedroom colonial house: formal living and dining rooms, family room, eat-in kitchen, master suite with walk-in closet, three additional bedrooms, three bathrooms, attached garage, front porch, backyard deck, 2200 sq ft",
    category: "Houses",
    subcategory: "4 Bedroom",
    dimensions: "Large (2200 sq ft)",
    features: ["Formal Dining", "Front Porch", "Master Suite"],
    icon: "🏛️",
    estimatedSize: "2200 sq ft"
  },
  {
    id: "house-2br-bungalow",
    name: "Modern Bungalow",
    description: "Single-story home with open floor plan",
    prompt: "Two-bedroom modern bungalow: open living/dining/kitchen, master bedroom with en-suite, guest bedroom, full bathroom, laundry room, attached garage, covered patio, garden space, 1400 sq ft",
    category: "Houses",
    subcategory: "2 Bedroom",
    dimensions: "Medium (1400 sq ft)",
    features: ["Open Floor Plan", "Covered Patio", "Garden Space"],
    icon: "🏠",
    estimatedSize: "1400 sq ft"
  },
  {
    id: "house-5br-mansion",
    name: "Executive Mansion",
    description: "Luxurious multi-story home with premium amenities",
    prompt: "Five-bedroom executive home: master suite with sitting area and luxury bath, four additional bedrooms each with bathroom, formal living and dining, great room, gourmet kitchen, home office, gym, three-car garage, swimming pool, outdoor kitchen, 4000 sq ft",
    category: "Houses",
    subcategory: "5+ Bedroom",
    dimensions: "Extra Large (4000 sq ft)",
    features: ["Home Office", "Swimming Pool", "Outdoor Kitchen"],
    icon: "🏰",
    estimatedSize: "4000 sq ft"
  },

  // VILLAS & LUXURY
  {
    id: "villa-beachfront",
    name: "Beachfront Villa",
    description: "Luxurious oceanfront villa with infinity pool",
    prompt: "Beachfront luxury villa: five bedrooms each with ocean view and en-suite bath, open great room with floor-to-ceiling windows, gourmet kitchen, formal dining, media room, gym, infinity pool, outdoor dining, private beach access, 3500 sq ft",
    category: "Villas",
    subcategory: "Beachfront",
    dimensions: "Large (3500 sq ft)",
    features: ["Ocean Views", "Infinity Pool", "Media Room"],
    icon: "🏖️",
    estimatedSize: "3500 sq ft"
  },
  {
    id: "villa-mountain",
    name: "Mountain Retreat",
    description: "Rustic luxury villa with mountain views",
    prompt: "Mountain luxury villa: four bedrooms with mountain views, great room with stone fireplace, gourmet kitchen, dining room, home office, wine cellar, hot tub, wrap-around deck, three-car garage, hiking trails access, 2800 sq ft",
    category: "Villas",
    subcategory: "Mountain",
    dimensions: "Large (2800 sq ft)",
    features: ["Mountain Views", "Stone Fireplace", "Wine Cellar"],
    icon: "⛰️",
    estimatedSize: "2800 sq ft"
  },
  {
    id: "villa-golf-course",
    name: "Golf Course Villa",
    description: "Elegant villa overlooking championship golf course",
    prompt: "Golf course luxury villa: master suite with golf course view, three guest bedrooms, living room with wet bar, formal dining, chef's kitchen, study, three-car garage, swimming pool, outdoor entertaining area, golf cart storage, 3200 sq ft",
    category: "Villas",
    subcategory: "Golf Course",
    dimensions: "Large (3200 sq ft)",
    features: ["Golf Views", "Swimming Pool", "Wet Bar"],
    icon: "⛳",
    estimatedSize: "3200 sq ft"
  },

  // COMMERCIAL & SPECIALTY
  {
    id: "office-modern",
    name: "Modern Office Space",
    description: "Contemporary office with collaborative workspaces",
    prompt: "Modern office floor plan: reception area, open workspace for 20 people, private offices, conference room, break room with kitchenette, two bathrooms, storage, modern glass partitions, 2000 sq ft",
    category: "Commercial",
    subcategory: "Office",
    dimensions: "Medium (2000 sq ft)",
    features: ["Open Workspace", "Conference Room", "Modern Design"],
    icon: "🏢",
    estimatedSize: "2000 sq ft"
  },
  {
    id: "restaurant-upscale",
    name: "Upscale Restaurant",
    description: "Elegant restaurant with bar and private dining",
    prompt: "Upscale restaurant floor plan: main dining room seating 80, bar area with 20 seats, private dining room for 16, commercial kitchen, prep area, walk-in cooler, office, staff changing room, restrooms, 3000 sq ft",
    category: "Commercial",
    subcategory: "Restaurant",
    dimensions: "Large (3000 sq ft)",
    features: ["Private Dining", "Commercial Kitchen", "Bar Area"],
    icon: "🍽️",
    estimatedSize: "3000 sq ft"
  },
  {
    id: "retail-boutique",
    name: "Boutique Retail Store",
    description: "Chic retail space with fitting rooms and storage",
    prompt: "Boutique retail store: sales floor with display areas, fitting rooms, storage room, small office, employee break area, customer restroom, modern lighting, glass storefront, 1500 sq ft",
    category: "Commercial",
    subcategory: "Retail",
    dimensions: "Medium (1500 sq ft)",
    features: ["Fitting Rooms", "Display Areas", "Modern Lighting"],
    icon: "🛍️",
    estimatedSize: "1500 sq ft"
  },
  {
    id: "gym-fitness",
    name: "Fitness Center",
    description: "Modern gym with various workout areas",
    prompt: "Modern fitness center: cardio area, weight training zone, group fitness studio, locker rooms with showers, smoothie bar, reception, office, storage, modern equipment layout, 4000 sq ft",
    category: "Commercial",
    subcategory: "Gym",
    dimensions: "Large (4000 sq ft)",
    features: ["Cardio Area", "Weight Training", "Group Studio"],
    icon: "💪",
    estimatedSize: "4000 sq ft"
  },

  // SPECIALTY & UNIQUE
  {
    id: "tiny-house",
    name: "Tiny House",
    description: "Ultra-compact living space maximizing efficiency",
    prompt: "Tiny house floor plan: multi-functional living/sleeping area, compact kitchen with fold-down table, bathroom with shower, built-in storage throughout, convertible furniture, sleeping loft, outdoor deck, 250 sq ft",
    category: "Specialty",
    subcategory: "Tiny House",
    dimensions: "Small (250 sq ft)",
    features: ["Multi-functional", "Convertible Furniture", "Storage"],
    icon: "🏠",
    estimatedSize: "250 sq ft"
  },
  {
    id: "treehouse-luxury",
    name: "Luxury Treehouse",
    description: "Elevated eco-friendly retreat with nature views",
    prompt: "Luxury treehouse: elevated bedroom with panoramic views, living area with fireplace, kitchenette, bathroom with composting toilet, wrap-around deck, suspension bridge access, sustainable materials, 600 sq ft",
    category: "Specialty",
    subcategory: "Treehouse",
    dimensions: "Small (600 sq ft)",
    features: ["Elevated Design", "Nature Views", "Sustainable"],
    icon: "🌳",
    estimatedSize: "600 sq ft"
  },
  {
    id: "container-home",
    name: "Shipping Container Home",
    description: "Modern sustainable home built from shipping containers",
    prompt: "Two-container modern home: master bedroom in one container, living/kitchen in second container, bathroom, outdoor living space, solar panels, rainwater collection, modern industrial design, 640 sq ft",
    category: "Specialty",
    subcategory: "Container Home",
    dimensions: "Small (640 sq ft)",
    features: ["Sustainable", "Industrial Design", "Solar Power"],
    icon: "📦",
    estimatedSize: "640 sq ft"
  },
  {
    id: "underground-home",
    name: "Underground Earth Home",
    description: "Energy-efficient home built into hillside",
    prompt: "Underground earth-sheltered home: three bedrooms, living room with south-facing windows, kitchen with greenhouse window, two bathrooms, workshop, root cellar, passive solar design, natural insulation, 1600 sq ft",
    category: "Specialty",
    subcategory: "Earth Home",
    dimensions: "Medium (1600 sq ft)",
    features: ["Energy Efficient", "Passive Solar", "Natural Insulation"],
    icon: "🌍",
    estimatedSize: "1600 sq ft"
  },

  // NEW TEMPLATES BASED ON SITE SIZES
  {
    id: "small-site-modern-home",
    name: "Modern Home for Small Site",
    description: "Efficient design for compact urban lots",
    prompt: "Modern single-story home for small site: 30x40 ft lot, open living/dining/kitchen, two bedrooms, bathroom, laundry, covered porch, modern design, 1200 sq ft",
    category: "Houses",
    subcategory: "Small Site",
    dimensions: "Small (1200 sq ft)",
    features: ["Space Efficient", "Single Story", "Covered Porch"],
    icon: "🏡",
    estimatedSize: "1200 sq ft"
  },
  {
    id: "medium-site-family-home",
    name: "Spacious Family Home",
    description: "Comfortable family home for medium-sized lots",
    prompt: "Spacious two-story family home for medium site: 50x60 ft lot, four bedrooms, three bathrooms, open living/dining/kitchen, family room, laundry, garage, backyard, 2400 sq ft",
    category: "Houses",
    subcategory: "Medium Site",
    dimensions: "Large (2400 sq ft)",
    features: ["Two Story", "Four Bedrooms", "Backyard"],
    icon: "🏘️",
    estimatedSize: "2400 sq ft"
  },
  {
    id: "large-site-luxury-home",
    name: "Luxury Estate Home",
    description: "Grand luxury home for large estates",
    prompt: "Luxury estate home for large site: 100x120 ft lot, six bedrooms, six bathrooms, grand foyer, formal living/dining, gourmet kitchen, home theater, gym, wine cellar, three-car garage, swimming pool, outdoor kitchen, 5000 sq ft",
    category: "Houses",
    subcategory: "Large Site",
    dimensions: "Extra Large (5000 sq ft)",
    features: ["Six Bedrooms", "Swimming Pool", "Home Theater"],
    icon: "🏰",
    estimatedSize: "5000 sq ft"
  },

  // TEMPLATES FOR SPECIFIC SITE DIMENSIONS
  {
    id: "20x30-site",
    name: "Compact Home Design",
    description: "Efficient layout for 20×30 site",
    prompt: "Compact home design for 20x30 site (600 sq ft): single-story layout, open living/dining/kitchen, one bedroom, bathroom, small utility area, front porch, modern design",
    category: "Houses",
    subcategory: "20×30 Site",
    dimensions: "Small (600 sq ft)",
    features: ["Space Efficient", "Single Story", "Modern Design"],
    icon: "🏠",
    estimatedSize: "600 sq ft"
  },
  {
    id: "20x40-site",
    name: "Narrow Lot Home",
    description: "Smart design for 20×40 narrow site",
    prompt: "Narrow lot home design for 20x40 site (800 sq ft): two-story layout, ground floor living/dining/kitchen, first floor bedrooms and bathroom, small balcony, contemporary design",
    category: "Houses",
    subcategory: "20×40 Site",
    dimensions: "Small (800 sq ft)",
    features: ["Two Story", "Narrow Design", "Balcony"],
    icon: "🏢",
    estimatedSize: "800 sq ft"
  },
  {
    id: "25x30-site",
    name: "Efficient Family Home",
    description: "Well-planned home for 25×30 site",
    prompt: "Efficient family home design for 25x30 site (750 sq ft): single-story layout, open living/dining/kitchen, two bedrooms, bathroom, utility area, covered patio, practical design",
    category: "Houses",
    subcategory: "25×30 Site",
    dimensions: "Small (750 sq ft)",
    features: ["Space Efficient", "Two Bedrooms", "Covered Patio"],
    icon: "🏡",
    estimatedSize: "750 sq ft"
  },
  {
    id: "25x40-site",
    name: "Comfortable Residence",
    description: "Comfortable layout for 25×40 site",
    prompt: "Comfortable residence design for 25x40 site (1000 sq ft): single-story layout, separate living and bedroom wings, open kitchen/dining, two bedrooms, bathroom, utility, carport, functional design",
    category: "Houses",
    subcategory: "25×40 Site",
    dimensions: "Small (1000 sq ft)",
    features: ["Separate Wings", "Two Bedrooms", "Carport"],
    icon: "🏘️",
    estimatedSize: "1000 sq ft"
  },
  {
    id: "30x40-site",
    name: "Spacious Single-Story",
    description: "Spacious layout for 30×40 site",
    prompt: "Spacious single-story design for 30x40 site (1200 sq ft): open floor plan, living/dining/kitchen, three bedrooms, two bathrooms, walk-in closets, laundry room, garage, covered patio, modern design",
    category: "Houses",
    subcategory: "30×40 Site",
    dimensions: "Medium (1200 sq ft)",
    features: ["Three Bedrooms", "Walk-in Closets", "Garage"],
    icon: "🏠",
    estimatedSize: "1200 sq ft"
  },
  {
    id: "30x50-site",
    name: "Large Family Home",
    description: "Large family home for 30×50 site",
    prompt: "Large family home design for 30x50 site (1500 sq ft): two-story layout, ground floor living/dining/kitchen and guest bedroom, first floor master suite and two additional bedrooms, three bathrooms, study, laundry, garage, backyard, traditional design",
    category: "Houses",
    subcategory: "30×50 Site",
    dimensions: "Medium (1500 sq ft)",
    features: ["Two Story", "Master Suite", "Study Room"],
    icon: "🏘️",
    estimatedSize: "1500 sq ft"
  },
  {
    id: "30x60-site",
    name: "Expansive Residence",
    description: "Expansive residence for 30×60 site",
    prompt: "Expansive residence design for 30x60 site (1800 sq ft): two-story layout, ground floor living/dining/kitchen, formal dining, first floor master suite and three additional bedrooms, four bathrooms, family room, study, laundry, garage, backyard with patio, contemporary design",
    category: "Houses",
    subcategory: "30×60 Site",
    dimensions: "Large (1800 sq ft)",
    features: ["Four Bedrooms", "Formal Dining", "Family Room"],
    icon: "🏛️",
    estimatedSize: "1800 sq ft"
  },
  {
    id: "30x70-site",
    name: "Grand Family Home",
    description: "Grand family home for 30×70 site",
    prompt: "Grand family home design for 30x70 site (2100 sq ft): two-story layout, grand entrance, ground floor living/dining/kitchen, formal living and dining, first floor master suite and four additional bedrooms, five bathrooms, home office, entertainment room, laundry, garage, landscaped backyard, elegant design",
    category: "Houses",
    subcategory: "30×70 Site",
    dimensions: "Large (2100 sq ft)",
    features: ["Five Bedrooms", "Home Office", "Entertainment Room"],
    icon: "🏰",
    estimatedSize: "2100 sq ft"
  },
  {
    id: "30x80-site",
    name: "Luxury Estate",
    description: "Luxury estate for 30×80 site",
    prompt: "Luxury estate design for 30x80 site (2400 sq ft): two-story layout, grand foyer, ground floor living/dining/kitchen, formal living and dining, first floor master suite and five additional bedrooms, six bathrooms, home theater, gym, wine cellar, study, laundry, garage, swimming pool, outdoor kitchen, premium design",
    category: "Houses",
    subcategory: "30×80 Site",
    dimensions: "Large (2400 sq ft)",
    features: ["Six Bedrooms", "Home Theater", "Swimming Pool"],
    icon: "✨",
    estimatedSize: "2400 sq ft"
  },
  {
    id: "40x50-site",
    name: "Premium Family Residence",
    description: "Premium family residence for 40×50 site",
    prompt: "Premium family residence design for 40x50 site (2000 sq ft): two-story layout, spacious entrance, ground floor living/dining/kitchen, formal living and dining, first floor master suite and four bedrooms, five bathrooms, study, family room, laundry, garage, backyard with patio, modern design",
    category: "Houses",
    subcategory: "40×50 Site",
    dimensions: "Large (2000 sq ft)",
    features: ["Five Bedrooms", "Study Room", "Family Room"],
    icon: "🏘️",
    estimatedSize: "2000 sq ft"
  },
  {
    id: "40x60-site",
    name: "Spacious Luxury Home",
    description: "Spacious luxury home for 40×60 site",
    prompt: "Spacious luxury home design for 40x60 site (2400 sq ft): two-story layout, grand entrance, ground floor living/dining/kitchen, formal living and dining, first floor master suite and five bedrooms, six bathrooms, home office, entertainment room, gym, laundry, garage, backyard with patio, premium design",
    category: "Houses",
    subcategory: "40×60 Site",
    dimensions: "Large (2400 sq ft)",
    features: ["Six Bedrooms", "Home Office", "Entertainment Room"],
    icon: "🏰",
    estimatedSize: "2400 sq ft"
  },
  {
    id: "40x70-site",
    name: "Magnificent Estate",
    description: "Magnificent estate for 40×70 site",
    prompt: "Magnificent estate design for 40x70 site (2800 sq ft): two-story layout, impressive entrance, ground floor living/dining/kitchen, formal living and dining, first floor master suite and six bedrooms, seven bathrooms, home theater, gym, wine cellar, study, library, laundry, garage, swimming pool, outdoor kitchen, landscaped garden, elegant design",
    category: "Houses",
    subcategory: "40×70 Site",
    dimensions: "Extra Large (2800 sq ft)",
    features: ["Seven Bedrooms", "Home Theater", "Library"],
    icon: "✨",
    estimatedSize: "2800 sq ft"
  },
  {
    id: "40x80-site",
    name: "Grand Luxury Estate",
    description: "Grand luxury estate for 40×80 site",
    prompt: "Grand luxury estate design for 40x80 site (3200 sq ft): two-story layout, magnificent entrance, ground floor living/dining/kitchen, formal living and dining, first floor master suite and seven bedrooms, eight bathrooms, home theater, gym, spa, wine cellar, study, library, laundry, garage, swimming pool, outdoor kitchen, tennis court, landscaped garden, opulent design",
    category: "Houses",
    subcategory: "40×80 Site",
    dimensions: "Extra Large (3200 sq ft)",
    features: ["Eight Bedrooms", "Spa", "Tennis Court"],
    icon: "🏰",
    estimatedSize: "3200 sq ft"
  },
  {
    id: "50x60-site",
    name: "Palatial Residence",
    description: "Palatial residence for 50×60 site",
    prompt: "Palatial residence design for 50x60 site (3000 sq ft): two-story layout, grand entrance, ground floor living/dining/kitchen, formal living and dining, first floor master suite and seven bedrooms, eight bathrooms, home theater, gym, spa, wine cellar, study, library, laundry, garage, swimming pool, outdoor kitchen, landscaped garden, luxurious design",
    category: "Houses",
    subcategory: "50×60 Site",
    dimensions: "Extra Large (3000 sq ft)",
    features: ["Eight Bedrooms", "Home Theater", "Spa"],
    icon: "✨",
    estimatedSize: "3000 sq ft"
  },
  {
    id: "50x70-site",
    name: "Majestic Estate",
    description: "Majestic estate for 50×70 site",
    prompt: "Majestic estate design for 50x70 site (3500 sq ft): two-story layout, impressive entrance, ground floor living/dining/kitchen, formal living and dining, first floor master suite and eight bedrooms, nine bathrooms, home theater, gym, spa, wine cellar, study, library, billiards room, laundry, garage, swimming pool, outdoor kitchen, tennis court, landscaped garden, majestic design",
    category: "Houses",
    subcategory: "50×70 Site",
    dimensions: "Extra Large (3500 sq ft)",
    features: ["Nine Bedrooms", "Billiards Room", "Tennis Court"],
    icon: "🏰",
    estimatedSize: "3500 sq ft"
  },
  {
    id: "50x80-site",
    name: "Ultimate Luxury Estate",
    description: "Ultimate luxury estate for 50×80 site",
    prompt: "Ultimate luxury estate design for 50x80 site (4000 sq ft): two-story layout, magnificent entrance, ground floor living/dining/kitchen, formal living and dining, first floor master suite and ten bedrooms, twelve bathrooms, home theater, gym, spa, wine cellar, study, library, billiards room, game room, laundry, garage, swimming pool, outdoor kitchen, tennis court, basketball court, landscaped garden, ultimate luxury design",
    category: "Houses",
    subcategory: "50×80 Site",
    dimensions: "Extra Large (4000 sq ft)",
    features: ["Ten Bedrooms", "Game Room", "Basketball Court"],
    icon: "✨",
    estimatedSize: "4000 sq ft"
  }
];

// Helper functions to organize templates
export const getCategories = () => {
  const categories = [...new Set(floorPlanTemplates.map(t => t.category))];
  return categories;
};

export const getSubcategories = (category: string) => {
  const subcategories = [...new Set(floorPlanTemplates
    .filter(t => t.category === category)
    .map(t => t.subcategory))];
  return subcategories;
};

export const getTemplatesByCategory = (category: string) => {
  return floorPlanTemplates.filter(t => t.category === category);
};

export const getTemplatesBySubcategory = (subcategory: string) => {
  return floorPlanTemplates.filter(t => t.subcategory === subcategory);
};

export const searchTemplates = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return floorPlanTemplates.filter(template =>
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.features.some(f => f.toLowerCase().includes(lowercaseQuery)) ||
    template.category.toLowerCase().includes(lowercaseQuery)
  );
};
