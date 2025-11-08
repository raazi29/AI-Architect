import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle,
  Clock,
  Users,
  Award,
  Send,
  X
} from "lucide-react";
import type { Professional } from "@/lib/types/professionals";

interface ContactModalProps {
  professional: Professional | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  professional,
  isOpen,
  onClose,
}) => {
  const [contactMethod, setContactMethod] = useState<"phone" | "message">("phone");
  const [message, setMessage] = useState("");

  if (!professional) return null;

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

  const handlePhoneCall = () => {
    window.open(`tel:${professional.phone}`, '_self');
  };

  const handleSendMessage = () => {
    const phoneNumber = professional.phone;
    const encodedMessage = encodeURIComponent(message || "Hi, I'm interested in your services.");
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="text-white font-semibold text-lg">
                  {professional.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <DialogTitle className="text-xl">{professional.name}</DialogTitle>
                <DialogDescription className="text-base">
                  {professional.businessName}
                </DialogDescription>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={`${getTypeColor(professional.type)} text-white`}
                  >
                    {getTypeLabel(professional.type)}
                  </Badge>
                  {professional.verified && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating and Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                {professional.rating.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
                ({professional.reviewCount} reviews)
              </div>
            </div>

            {professional.yearsOfExperience && (
              <div className="text-center">
                <div className="text-lg font-semibold">{professional.yearsOfExperience}</div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
            )}

            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm text-muted-foreground">{professional.area}</div>
            </div>

            {professional.verified && (
              <div className="text-center">
                <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                <div className="text-sm text-muted-foreground">Verified</div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-semibold">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{professional.phone}</span>
                {professional.alternatePhone && (
                  <span className="text-muted-foreground">
                    (Alt: {professional.alternatePhone})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {professional.address}, {professional.area}, {professional.city} - {professional.pincode}
                </span>
              </div>

              {professional.website && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={professional.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}

              {professional.workingHours && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{professional.workingHours}</span>
                </div>
              )}
            </div>
          </div>

          {/* Specializations */}
          {professional.specializations && professional.specializations.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {professional.specializations.map((spec, index) => (
                  <Badge key={index} variant="secondary">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {professional.services && professional.services.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Services Offered</h3>
              <div className="flex flex-wrap gap-2">
                {professional.services.map((service, index) => (
                  <Badge key={index} variant="outline">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {professional.description && (
            <div className="space-y-3">
              <h3 className="font-semibold">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {professional.description}
              </p>
            </div>
          )}

          {/* Contact Options */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact Options</h3>

            <div className="flex gap-2">
              <Button
                variant={contactMethod === "phone" ? "default" : "outline"}
                onClick={() => setContactMethod("phone")}
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
              <Button
                variant={contactMethod === "message" ? "default" : "outline"}
                onClick={() => setContactMethod("message")}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>

            {contactMethod === "phone" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Call {professional.name} directly to discuss your project requirements.
                </p>
                <Button onClick={handlePhoneCall} className="w-full" size="lg">
                  <Phone className="h-5 w-5 mr-2" />
                  Call {professional.phone}
                </Button>
              </div>
            )}

            {contactMethod === "message" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Send a message via WhatsApp to start a conversation.
                </p>
                <Textarea
                  placeholder={`Hi ${professional.name}, I'm interested in your services for my project...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleSendMessage} className="w-full" size="lg">
                  <Send className="h-5 w-5 mr-2" />
                  Send via WhatsApp
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
