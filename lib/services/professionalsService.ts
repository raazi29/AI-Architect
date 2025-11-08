import type { Professional, ProfessionalsData, ProfessionalType, ProfessionalFilters } from '@/lib/types/professionals';

export class ProfessionalsService {
  private static data: ProfessionalsData | null = null;

  static async loadProfessionals(): Promise<Professional[]> {
    try {
      if (!this.data) {
        const response = await fetch('/data/professionals/bengaluru-contractors.json');
        if (!response.ok) {
          throw new Error('Failed to load professionals data');
        }
        this.data = await response.json();
      }
      return this.data.professionals;
    } catch (error) {
      console.error('Error loading professionals:', error);
      throw error;
    }
  }

  static async searchProfessionals(
    query: string,
    filters: ProfessionalFilters = {}
  ): Promise<Professional[]> {
    const professionals = await this.loadProfessionals();
    
    return professionals.filter(prof => {
      const matchesQuery = !query || 
        prof.name.toLowerCase().includes(query.toLowerCase()) ||
        prof.businessName.toLowerCase().includes(query.toLowerCase()) ||
        prof.specializations.some(s => s.toLowerCase().includes(query.toLowerCase()));
      
      const matchesType = !filters.type || prof.type === filters.type;
      const matchesArea = !filters.area || prof.area === filters.area;
      const matchesRating = !filters.minRating || prof.rating >= filters.minRating;
      const matchesVerified = filters.verified === undefined || prof.verified === filters.verified;
      
      return matchesQuery && matchesType && matchesArea && matchesRating && matchesVerified;
    });
  }

  static async getUniqueAreas(): Promise<string[]> {
    const professionals = await this.loadProfessionals();
    return [...new Set(professionals.map(p => p.area))].sort();
  }

  static async getProfessionalsByType(type: ProfessionalType): Promise<Professional[]> {
    const professionals = await this.loadProfessionals();
    return professionals.filter(p => p.type === type);
  }

  static clearCache(): void {
    this.data = null;
  }
}
