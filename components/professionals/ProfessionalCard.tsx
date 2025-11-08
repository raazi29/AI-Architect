import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MapPin,
  Phone,
  Star,
  CheckCircle,
  Clock,
  Users,
  Award
} from "lucide-react";
import type { Professional } from "@/lib/types/professionals";

interface ProfessionalCardProps {
  professional: Professional;
  onContact: (professional: Professional) => void;
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  professional,
  onContact,
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "architect":
        return "bg-blue-500";
      case "interior_designer":
        return "bg-purple-500";
      case "building_contractor":
        return "bg-green-500";
      case "civil_contractor":
        return "bg-orange-500";
      case "renovation_specialist":
        return "bg-red-500";
      case "furniture_designer":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="text-white font-semibold">
              {professional.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg line-clamp-1">{professional.name}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {professional.businessName}
                </CardDescription>
              </div>
              {professional.verified && (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              )}
            </div>

            <Badge
              variant="secondary"
              className={`${getTypeColor(professional.type)} text-white`}
            >
              {getTypeLabel(professional.type)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rating and Reviews */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{professional.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({professional.reviewCount})
            </span>
          </div>
          {professional.yearsOfExperience && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>{professional.yearsOfExperience} years</span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{professional.area}, {professional.city}</span>
        </div>

        {/* Specializations */}
        {professional.specializations && professional.specializations.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Specializations:</div>
            <div className="flex flex-wrap gap-1">
              {professional.specializations.slice(0, 3).map((spec, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {spec}
                </Badge>
              ))}
              {professional.specializations.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{professional.specializations.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Services */}
        {professional.services && professional.services.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Services:</div>
            <div className="flex flex-wrap gap-1">
              {professional.services.slice(0, 2).map((service, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
              {professional.services.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{professional.services.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Contact Button */}
        <Button
          onClick={() => onContact(professional)}
          className="w-full"
          size="sm"
        >
          <Phone className="h-4 w-4 mr-2" />
          Contact Professional
        </Button>
      </CardContent>
    </Card>
  );
};
