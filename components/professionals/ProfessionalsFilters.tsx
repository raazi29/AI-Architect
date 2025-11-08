import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
import type { ProfessionalType } from "@/lib/types/professionals";

interface ProfessionalsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedArea: string;
  onAreaChange: (value: string) => void;
  selectedRating: string;
  onRatingChange: (value: string) => void;
  verifiedOnly: boolean;
  onVerifiedChange: (value: boolean) => void;
  areas: string[];
  onClearFilters: () => void;
}

export const ProfessionalsFilters: React.FC<ProfessionalsFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedArea,
  onAreaChange,
  selectedRating,
  onRatingChange,
  verifiedOnly,
  onVerifiedChange,
  areas,
  onClearFilters,
}) => {
  const professionalTypes: { value: ProfessionalType | "all"; label: string }[] = [
    { value: "all", label: "All Types" },
    { value: "architect", label: "Architect" },
    { value: "interior_designer", label: "Interior Designer" },
    { value: "building_contractor", label: "Building Contractor" },
    { value: "civil_contractor", label: "Civil Contractor" },
    { value: "renovation_specialist", label: "Renovation Specialist" },
    { value: "furniture_designer", label: "Furniture Designer" },
  ];

  const ratingOptions = [
    { value: "all", label: "Any Rating" },
    { value: "4.5", label: "4.5+ Stars" },
    { value: "4.0", label: "4.0+ Stars" },
    { value: "3.5", label: "3.5+ Stars" },
    { value: "3.0", label: "3.0+ Stars" },
  ];

  const hasActiveFilters =
    searchQuery ||
    selectedType !== "all" ||
    selectedArea !== "all" ||
    selectedRating !== "all" ||
    verifiedOnly;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Professionals
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name, business, or specialization..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Professional Type */}
          <div className="space-y-2">
            <Label>Professional Type</Label>
            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {professionalTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Area */}
          <div className="space-y-2">
            <Label>Area</Label>
            <Select value={selectedArea} onValueChange={onAreaChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Minimum Rating</Label>
            <Select value={selectedRating} onValueChange={onRatingChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map((rating) => (
                  <SelectItem key={rating.value} value={rating.value}>
                    {rating.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Verified Only */}
          <div className="space-y-2">
            <Label className="text-sm font-normal">Verification Status</Label>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="verified-only"
                checked={verifiedOnly}
                onCheckedChange={(checked) => onVerifiedChange(checked as boolean)}
              />
              <Label
                htmlFor="verified-only"
                className="text-sm font-normal cursor-pointer"
              >
                Verified professionals only
              </Label>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground mb-2">Active filters:</div>
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchQuery}"
                </Badge>
              )}
              {selectedType !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Type: {professionalTypes.find(t => t.value === selectedType)?.label}
                </Badge>
              )}
              {selectedArea !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Area: {selectedArea}
                </Badge>
              )}
              {selectedRating !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Rating: {ratingOptions.find(r => r.value === selectedRating)?.label}
                </Badge>
              )}
              {verifiedOnly && (
                <Badge variant="secondary" className="text-xs">
                  Verified Only
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
