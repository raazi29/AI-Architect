'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  Sparkles, 
  Eye, 
  Copy,
  AlertTriangle, 
  Info,
  Lightbulb,
  RefreshCw,
  Download,
  Share2,
  Sun,
  Moon,
  Heart,
  Zap,
  CheckCircle,
  Droplets
} from 'lucide-react';

interface RoomType {
  value: string;
  label: string;
}

interface DesignStyle {
  value: string;
  label: string;
}

interface ColorInfo {
  name: string;
  hex: string;
  rgb: string;
  usage: string;
  psychology: string;
}

interface ColorPalette {
  primary_palette?: {
    dominant_color: ColorInfo;
    secondary_color: ColorInfo;
    accent_color: ColorInfo;
  };
  alternative_palettes?: Array<{
    theme: string;
    colors: Array<{
      name: string;
      hex: string;
    }>;
  }>;
  room_specific_recommendations?: any;
  lighting_considerations?: any;
  cultural_context?: any;
  maintenance_tips?: string[];
  mood_achievement?: string;
  summary?: string;
  error?: boolean;
  message?: string;
  raw_response?: string;
  color_analysis?: {
    dominant_temperature: string;
    secondary_temperature: string;
    accent_temperature: string;
    contrast_ratios: {
      dominant_to_secondary: number;
      dominant_to_accent: number;
    };
  };
  accessibility?: {
    contrast_ratios?: {
      wcag_aa_compliant?: boolean;
      wcag_aaa_compliant?: boolean;
    };
    color_blind_friendly?: boolean;
    recommendations?: string[];
  };
  cost_estimate?: {
    paint_cost_per_sqft?: string;
    labor_cost?: string;
    total_estimate_range?: string;
  };
  paint_brands_india?: {
    asian_paints?: string[];
    berger_paints?: string[];
    nerolac?: string[];
  };
  seasonal_variations?: {
    summer?: string[];
    winter?: string[];
    monsoon?: string[];
  };
}

const AIColorsPage = () => {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [designStyles, setDesignStyles] = useState<DesignStyle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [palette, setPalette] = useState<ColorPalette | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Form state
  const [roomType, setRoomType] = useState('');
  const [style, setStyle] = useState('');
  const [lightingType, setLightingType] = useState('');
  const [mood, setMood] = useState('');
  const [existingColors, setExistingColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');

  useEffect(() => {
    fetchRoomTypes();
    fetchDesignStyles();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const response = await fetch('http://localhost:8001/ai/room-types');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRoomTypes(data.room_types || []);
    } catch (error) {
      console.error('Error fetching room types:', error);
      // Set default room types as fallback
      setRoomTypes([
        {"value": "living_room", "label": "Living Room"},
        {"value": "bedroom", "label": "Bedroom"},
        {"value": "kitchen", "label": "Kitchen"},
        {"value": "bathroom", "label": "Bathroom"},
        {"value": "dining_room", "label": "Dining Room"},
        {"value": "office", "label": "Office"},
        {"value": "hallway", "label": "Hallway"},
        {"value": "outdoor", "label": "Outdoor"}
      ]);
    }
  };

  const fetchDesignStyles = async () => {
    try {
      const response = await fetch('http://localhost:8001/ai/design-styles');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDesignStyles(data.styles || []);
    } catch (error) {
      console.error('Error fetching design styles:', error);
      // Set default styles as fallback
      setDesignStyles([
        {"value": "modern", "label": "Modern"},
        {"value": "traditional", "label": "Traditional"},
        {"value": "scandinavian", "label": "Scandinavian"},
        {"value": "industrial", "label": "Industrial"},
        {"value": "luxury", "label": "Luxury"},
        {"value": "minimalist", "label": "Minimalist"},
        {"value": "bohemian", "label": "Bohemian"},
        {"value": "rustic", "label": "Rustic"}
      ]);
    }
  };

  const addExistingColor = () => {
    if (colorInput.trim() && !existingColors.includes(colorInput.trim())) {
      setExistingColors([...existingColors, colorInput.trim()]);
      setColorInput('');
    }
  };

  const removeExistingColor = (color: string) => {
    setExistingColors(existingColors.filter(c => c !== color));
  };

  const generateColorPalette = async () => {
    if (!roomType || !style || !lightingType || !mood) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8001/ai/colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_type: roomType,
          style: style,
          lighting_type: lightingType,
          mood: mood,
          existing_colors: existingColors.length > 0 ? existingColors : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPalette(data);
    } catch (error) {
      console.error('Error generating color palette:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate color palette. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedColor(`${type}-${text}`);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const ColorCard = ({ color, title, size = 'large' }: { color: ColorInfo, title: string, size?: 'large' | 'small' }) => (
    <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        <div
          className={`w-full ${size === 'large' ? 'h-24' : 'h-16'} rounded-lg mb-3 border-2 border-gray-200 dark:border-gray-600`}
          style={{ backgroundColor: color.hex }}
        />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{color.name}</h4>
            <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{title}</Badge>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">HEX:</span>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-800 dark:text-gray-200">{color.hex}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => copyToClipboard(color.hex, 'hex')}
                >
                  {copiedColor === `hex-${color.hex}` ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">RGB:</span>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-800 dark:text-gray-200">{color.rgb}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => copyToClipboard(color.rgb, 'rgb')}
                >
                  {copiedColor === `rgb-${color.rgb}` ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Usage: {color.usage}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Psychology: {color.psychology}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SimpleColorCard = ({ color, theme }: { color: { name: string; hex: string }, theme: string }) => (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div
        className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-600 flex-shrink-0"
        style={{ backgroundColor: color.hex }}
      />
      <div className="flex-1">
        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{color.name}</p>
        <div className="flex items-center gap-2">
          <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-800 dark:text-gray-200">{color.hex}</code>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => copyToClipboard(color.hex, `${theme}-${color.name}`)}
          >
            {copiedColor === `${theme}-${color.name}` ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Color Palette Generator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            Generate harmonious color palettes based on room style, lighting, and mood preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Input Form */}
      <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Palette className="h-5 w-5 text-purple-500" />
            Color Preferences
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Tell us about your space and desired mood to generate perfect color combinations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="room-type">Room Type *</Label>
              <Select value={roomType} onValueChange={setRoomType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes && roomTypes.length > 0 ? roomTypes.map((room) => (
                    <SelectItem key={room.value} value={room.value}>
                      {room.label}
                    </SelectItem>
                  )) : (
                    <SelectItem value="loading" disabled>Loading room types...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Design Style *</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select design style" />
                </SelectTrigger>
                <SelectContent>
                  {designStyles && designStyles.length > 0 ? designStyles.map((styleOption) => (
                    <SelectItem key={styleOption.value} value={styleOption.value}>
                      {styleOption.label}
                    </SelectItem>
                  )) : (
                    <SelectItem value="loading" disabled>Loading styles...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lighting">Lighting Type *</Label>
              <Select value={lightingType} onValueChange={setLightingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lighting type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">Natural - Lots of sunlight</SelectItem>
                  <SelectItem value="artificial">Artificial - Mainly LED/bulbs</SelectItem>
                  <SelectItem value="mixed">Mixed - Natural + artificial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood">Desired Mood *</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="energetic">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Energetic - Vibrant & lively
                    </div>
                  </SelectItem>
                  <SelectItem value="calm">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Calm - Peaceful & relaxing
                    </div>
                  </SelectItem>
                  <SelectItem value="cozy">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Cozy - Warm & inviting
                    </div>
                  </SelectItem>
                  <SelectItem value="professional">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Professional - Clean & focused
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Existing Colors */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="existing-colors">Existing Colors (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Add colors you already have in the space (e.g., furniture, artwork)
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter color name or hex code"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addExistingColor()}
                />
                <Button type="button" onClick={addExistingColor} variant="outline">
                  Add
                </Button>
              </div>
            </div>

            {existingColors.length > 0 && (
              <div className="space-y-2">
                <Label>Existing Colors ({existingColors.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {existingColors.map((color, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => removeExistingColor(color)}
                    >
                      {color} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={generateColorPalette} 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Generating Palette...' : 'Generate Color Palette'}
          </Button>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {palette && (
        <div className="space-y-6">
          {palette.error ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{palette.message}</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Mood Achievement */}
              {palette.mood_achievement && (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-6 w-6 text-purple-500 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Color Psychology</h3>
                        <p className="text-muted-foreground">{palette.mood_achievement}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Color Analysis */}
              {palette.color_analysis && (
                <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Eye className="h-5 w-5 text-indigo-500" />
                      Color Analysis & Accessibility
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Technical analysis of your color palette
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg">
                        <h4 className="font-medium mb-2">Dominant Color</h4>
                        <Badge variant="outline" className="capitalize">
                          {palette.color_analysis.dominant_temperature}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                          Temperature: {palette.color_analysis.dominant_temperature}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                        <h4 className="font-medium mb-2">Secondary Color</h4>
                        <Badge variant="outline" className="capitalize">
                          {palette.color_analysis.secondary_temperature}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                          Temperature: {palette.color_analysis.secondary_temperature}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                        <h4 className="font-medium mb-2">Accent Color</h4>
                        <Badge variant="outline" className="capitalize">
                          {palette.color_analysis.accent_temperature}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                          Temperature: {palette.color_analysis.accent_temperature}
                        </p>
                      </div>
                    </div>
                    {palette.color_analysis.contrast_ratios && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-3">Contrast Ratios</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Dominant to Secondary:</span>
                            <Badge variant={palette.color_analysis.contrast_ratios.dominant_to_secondary >= 4.5 ? "default" : "secondary"}>
                              {palette.color_analysis.contrast_ratios.dominant_to_secondary}:1
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Dominant to Accent:</span>
                            <Badge variant={palette.color_analysis.contrast_ratios.dominant_to_accent >= 4.5 ? "default" : "secondary"}>
                              {palette.color_analysis.contrast_ratios.dominant_to_accent}:1
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Accessibility */}
              {palette.accessibility && (
                <Card className="border-0 shadow-lg bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      Accessibility Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="font-medium mb-2">WCAG Compliance</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">AA Standard:</span>
                            {palette.accessibility.contrast_ratios?.wcag_aa_compliant ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">AAA Standard:</span>
                            {palette.accessibility.contrast_ratios?.wcag_aaa_compliant ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Color Blind Friendly:</span>
                            {palette.accessibility.color_blind_friendly ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="font-medium mb-2">Recommendations</h4>
                        <ul className="space-y-2">
                          {palette.accessibility.recommendations?.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cost Estimate */}
              {palette.cost_estimate && (
                <Card className="border-0 shadow-lg bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-green-600" />
                      Cost Estimate (India)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="font-medium mb-2">Paint Cost</h4>
                        <p className="text-2xl font-bold text-green-600">{palette.cost_estimate.paint_cost_per_sqft}</p>
                        <p className="text-sm text-muted-foreground">per sq ft</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="font-medium mb-2">Labor Cost</h4>
                        <p className="text-2xl font-bold text-blue-600">{palette.cost_estimate.labor_cost}</p>
                        <p className="text-sm text-muted-foreground">per sq ft</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="font-medium mb-2">Total Estimate</h4>
                        <p className="text-2xl font-bold text-purple-600">{palette.cost_estimate.total_estimate_range}</p>
                        <p className="text-sm text-muted-foreground">for average room</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Paint Brands */}
              {palette.paint_brands_india && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-orange-500" />
                      Available in Indian Paint Brands
                    </CardTitle>
                    <CardDescription>
                      Find these colors at popular Indian paint retailers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {palette.paint_brands_india.asian_paints && (
                        <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg">
                          <h4 className="font-semibold mb-2">Asian Paints</h4>
                          <ul className="space-y-1">
                            {palette.paint_brands_india.asian_paints.map((shade: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">• {shade}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {palette.paint_brands_india.berger_paints && (
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                          <h4 className="font-semibold mb-2">Berger Paints</h4>
                          <ul className="space-y-1">
                            {palette.paint_brands_india.berger_paints.map((shade: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">• {shade}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {palette.paint_brands_india.nerolac && (
                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                          <h4 className="font-semibold mb-2">Nerolac</h4>
                          <ul className="space-y-1">
                            {palette.paint_brands_india.nerolac.map((shade: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">• {shade}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Seasonal Variations */}
              {palette.seasonal_variations && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sun className="h-5 w-5 text-yellow-500" />
                      Seasonal Considerations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {palette.seasonal_variations.summer && (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Summer
                          </h4>
                          <ul className="space-y-1">
                            {palette.seasonal_variations.summer.map((tip: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {palette.seasonal_variations.winter && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Winter
                          </h4>
                          <ul className="space-y-1">
                            {palette.seasonal_variations.winter.map((tip: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {palette.seasonal_variations.monsoon && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Droplets className="h-4 w-4" />
                            Monsoon
                          </h4>
                          <ul className="space-y-1">
                            {palette.seasonal_variations.monsoon.map((tip: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Primary Palette */}
              {palette.primary_palette && (
                <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Palette className="h-5 w-5 text-purple-500" />
                      Primary Color Palette
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Your main color scheme following the 60-30-10 rule
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <ColorCard 
                        color={palette.primary_palette.dominant_color} 
                        title="Dominant (60%)" 
                      />
                      <ColorCard 
                        color={palette.primary_palette.secondary_color} 
                        title="Secondary (30%)" 
                      />
                      <ColorCard 
                        color={palette.primary_palette.accent_color} 
                        title="Accent (10%)" 
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Alternative Palettes */}
              {palette.alternative_palettes && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-500" />
                      Alternative Color Schemes
                    </CardTitle>
                    <CardDescription>
                      Additional palette options for different looks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {palette.alternative_palettes.map((altPalette, index) => (
                        <div key={index} className="space-y-3">
                          <h4 className="font-medium text-lg">{altPalette.theme}</h4>
                          <div className="grid gap-3 md:grid-cols-3">
                            {altPalette.colors.map((color, colorIndex) => (
                              <SimpleColorCard 
                                key={colorIndex} 
                                color={color} 
                                theme={altPalette.theme}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Room-Specific Recommendations */}
              {palette.room_specific_recommendations && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sun className="h-5 w-5 text-orange-500" />
                      Room-Specific Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(palette.room_specific_recommendations).map(([area, colors]: [string, any]) => (
                        <div key={area} className="space-y-3">
                          <h4 className="font-medium capitalize">{area.replace('_', ' ')}</h4>
                          {Array.isArray(colors) ? (
                            <div className="space-y-2">
                              {colors.map((color: string, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div 
                                    className="w-6 h-6 rounded border-2 border-gray-200"
                                    style={{ backgroundColor: color }}
                                  />
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{color}</code>
                                </div>
                              ))}
                            </div>
                          ) : typeof colors === 'object' && colors !== null ? (
                            <div className="space-y-2">
                              {Object.entries(colors).map(([key, value]: [string, any]) => (
                                <div key={key} className="flex items-center gap-2">
                                  <div 
                                    className="w-6 h-6 rounded border-2 border-gray-200"
                                    style={{ backgroundColor: value }}
                                  />
                                  <div className="flex-1">
                                    <div className="text-xs font-medium capitalize">{key.replace('_', ' ')}</div>
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block">{value}</code>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border-2 border-gray-200"
                                style={{ backgroundColor: colors }}
                              />
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{String(colors)}</code>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lighting Considerations */}
              {palette.lighting_considerations && (
                <Card className="border-0 shadow-lg bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      Lighting Considerations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(palette.lighting_considerations).map(([type, description]: [string, any]) => (
                        <div key={type} className="p-4 bg-white rounded-lg border border-yellow-200">
                          <h4 className="font-medium capitalize mb-2">{type.replace('_', ' ')}</h4>
                          <p className="text-sm text-muted-foreground">
                            {typeof description === 'string' ? description : JSON.stringify(description, null, 2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Maintenance Tips */}
              {palette.maintenance_tips && (
                <Card className="border-0 shadow-lg bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Maintenance Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {palette.maintenance_tips.map((tip: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{tip}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Cultural Context */}
              {palette.cultural_context && (
                <Card className="border-0 shadow-lg bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-orange-600" />
                      Cultural Context
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(palette.cultural_context).map(([aspect, description]: [string, any]) => (
                        <div key={aspect} className="p-4 bg-white rounded-lg border border-orange-200">
                          <h4 className="font-medium capitalize mb-2">{aspect.replace('_', ' ')}</h4>
                          <p className="text-sm text-muted-foreground">
                            {typeof description === 'string' ? description : JSON.stringify(description, null, 2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Raw Response Fallback */}
              {palette.raw_response && !palette.primary_palette && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-500" />
                      AI Color Recommendations
                    </CardTitle>
                    <CardDescription>
                      {palette.summary || "Harmonious color palette suggestions from our AI color expert"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-l-4 border-purple-500">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                          {palette.raw_response}
                        </div>
                      </div>
                      {palette.message && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800">{palette.message}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIColorsPage;
