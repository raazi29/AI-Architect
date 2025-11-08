// Test file to verify materials database
import IndiaLocalizationService from './indiaLocalizationService';

export function testMaterialsDatabase() {
  const totalCount = IndiaLocalizationService.getTotalMaterialsCount();
  console.log(`Total materials in database: ${totalCount}`);
  
  const categories = IndiaLocalizationService.getMaterialCategories();
  console.log(`Total categories: ${categories.length}`);
  console.log('Categories:', categories);
  
  const tropicalMaterials = IndiaLocalizationService.getMaterialsByClimateZone('tropical');
  console.log(`Materials for tropical climate: ${tropicalMaterials.length}`);
  
  const cementMaterials = IndiaLocalizationService.getMaterialsByCategory('cement');
  console.log(`Cement materials: ${cementMaterials.length}`);
  
  const steelMaterials = IndiaLocalizationService.getMaterialsByCategory('steel');
  console.log(`Steel materials: ${steelMaterials.length}`);
  
  const searchResults = IndiaLocalizationService.searchMaterials('TMT');
  console.log(`Search results for 'TMT': ${searchResults.length}`);
  
  return {
    totalCount,
    categories: categories.length,
    tropicalMaterials: tropicalMaterials.length,
    cementMaterials: cementMaterials.length,
    steelMaterials: steelMaterials.length,
    searchResults: searchResults.length
  };
}
