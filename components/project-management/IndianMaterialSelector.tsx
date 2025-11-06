'use client';

import { useState, useEffect } from 'react';
import { ClimateZone, IndiaLocalizationService } from '@/lib/services/indiaLocalizationService';
import {
  INDIAN_MATERIALS,
  MaterialData,
  getMaterialsByClimateZone,
  getMaterialsByCategory,
  getMaterialsByZoneAndCategory,
  getMaterialCategories,
  searchMaterials,
} from '@/lib/data/indianMaterials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, TrendingUp, MapPin, Leaf } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface IndianMaterialSelectorProps {
  climateZone?: ClimateZone;
  stateCode?: string;
  onMaterialSelect: (material: MaterialData) => void;
  selectedCategory?: string;
}

export function IndianMaterialSelector({
  climateZone,
  stateCode,
  onMaterialSelect,
  selectedCategory,
}: IndianMaterialSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(selectedCategory || 'all');
  const [filteredMaterials, setFilteredMaterials] = useState<MaterialData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    setCategories(getMaterialCategories());
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [searchQuery, categoryFilter, climateZone, stateCode]);

  const filterMaterials = () => {
    let materials = INDIAN_MATERIALS;

    // Apply search
    if (searchQuery) {
      materials = searchMaterials(searchQuery);
    }

    // Apply climate zone filter
    if (climateZone && categoryFilter === 'all') {
      materials = materials.filter((m) => m.climateZones.includes(climateZone));
    } else if (climateZone && categoryFilter !== 'all') {
      materials = getMaterialsByZoneAndCategory(climateZone, categoryFilter);
    } else if (categoryFilter !== 'all') {
      materials = getMaterialsByCategory(categoryFilter);
    }

    // Apply state filter
    if (stateCode) {
      materials = materials.filter((m) => m.localAvailability.includes(stateCode.toUpperCase()));
    }

    setFilteredMaterials(materials);
  };

  const handleMaterialClick = (material: MaterialData) => {
    onMaterialSelect(material);
  };

  const getClimateZoneBadgeColor = (zone: ClimateZone): string => {
    switch (zone) {
      case 'tropical':
        return 'bg-green-100 text-green-800';
      case 'subtropical':
        return 'bg-yellow-100 text-yellow-800';
      case 'mountain':
        return 'bg-blue-100 text-blue-800';
      case 'arid':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-600" />
          Indian Construction Materials
        </CardTitle>
        <CardDescription>
          Climate-optimized materials with GST rates and local availability
          {climateZone && (
            <Badge className={`ml-2 ${getClimateZoneBadgeColor(climateZone)}`}>
              {climateZone} zone
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
          {filteredMaterials.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              <p>No materials found matching your criteria</p>
              <p className="text-sm mt-2">Try adjusting your filters or search query</p>
            </div>
          ) : (
            filteredMaterials.map((material) => {
              const gstCalc = IndiaLocalizationService.calculateGST(
                material.basePrice,
                material.category
              );

              return (
                <Card
                  key={material.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleMaterialClick(material)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{material.name}</h4>
                          <p className="text-xs text-muted-foreground capitalize">
                            {material.category}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          GST {material.gstRate}%
                        </Badge>
                      </div>

                      {material.specifications && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {material.specifications}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Base Price</p>
                          <p className="font-semibold">
                            {IndiaLocalizationService.formatCurrency(material.basePrice)}
                            <span className="text-xs text-muted-foreground ml-1">
                              /{material.unit}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">With GST</p>
                          <p className="font-semibold text-primary">
                            {IndiaLocalizationService.formatCurrency(gstCalc.totalAmount)}
                          </p>
                        </div>
                      </div>

                      {/* Climate zones */}
                      <div className="flex flex-wrap gap-1">
                        {material.climateZones.map((zone) => (
                          <Badge
                            key={zone}
                            variant="secondary"
                            className={`text-xs ${getClimateZoneBadgeColor(zone)}`}
                          >
                            {zone}
                          </Badge>
                        ))}
                      </div>

                      {/* Local availability indicator */}
                      {stateCode && material.localAvailability.includes(stateCode.toUpperCase()) && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <MapPin className="h-3 w-3" />
                          <span>Available locally</span>
                        </div>
                      )}

                      {/* Suppliers */}
                      {material.suppliers && material.suppliers.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Suppliers:</span>{' '}
                          {material.suppliers.slice(0, 2).join(', ')}
                          {material.suppliers.length > 2 && ` +${material.suppliers.length - 2}`}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Summary */}
        {filteredMaterials.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
            <span>Showing {filteredMaterials.length} materials</span>
            {climateZone && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Optimized for {climateZone} climate
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
