export type ProfessionalType =
  | "interior_designer"
  | "building_contractor"
  | "civil_contractor"
  | "architect"
  | "renovation_specialist"
  | "furniture_designer";

export interface Professional {
  id: string;
  name: string;
  businessName: string;
  type: ProfessionalType;
  specializations: string[];
  phone: string;
  alternatePhone?: string;
  address: string;
  area: string;
  city: string;
  pincode: string;
  rating: number;
  reviewCount: number;
  services: string[];
  yearsOfExperience?: number;
  verified: boolean;
  description?: string;
  workingHours?: string;
  website?: string;
}

export interface ProfessionalsData {
  lastUpdated: string;
  city: string;
  professionals: Professional[];
}

export interface ProfessionalFilters {
  type?: ProfessionalType;
  area?: string;
  minRating?: number;
  verified?: boolean;
}
