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
  CheckCircle
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
  error?: boolean;
  message?: string;
  raw_response?: string;
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
      const data = await response.json();
      setRoomTypes(data.room_types);
    } catch (error) {
      console.error('Error fetching room types:', error);
    }
  };

  const fetchDesignStyles = async () => {
    try {
      const response = await fetch('http://localhost:8001/ai/design-styles');
      const data = await response.json();
      setDesignStyles(data.styles);
    } catch (error) {
      console.error('Error fetching design styles:', error);
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
        throw new Error('Failed to generate color palette');
      }

      const data = await response.json();
      setPalette(data);
    } catch (error) {
      setError('Failed to generate color palette. Please try again.');
      console.error('Error generating color palette:', error);
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div 
          className={`w-full ${size === 'large' ? 'h-24' : 'h-16'} rounded-lg mb-3 border-2 border-gray-200`}
          style={{ backgroundColor: color.hex }}
        />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{color.name}</h4>
            <Badge variant="outline" className="text-xs">{title}</Badge>
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">HEX:</span>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{color.hex}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
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
              <span className="text-muted-foreground">RGB:</span>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{color.rgb}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
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
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Usage: {color.usage}</p>
            <p className="text-xs text-muted-foreground">Psychology: {color.psychology}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SimpleColorCard = ({ color, theme }: { color: { name: string; hex: string }, theme: string }) => (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
      <div 
        className="w-12 h-12 rounded-lg border-2 border-gray-200 flex-shrink-0"
        style={{ backgroundColor: color.hex }}
      />
      <div className="flex-1">
        <p className="font-medium text-sm">{color.name}</p>
        <div className="flex items-center gap-2">
          <code className="bg-gray-100 px-2 py-1 rounded text-xs">{color.hex}</code>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => copyToClipboard(color.hex, `${theme}-${color.name}`)}
          >
            {copiedColor === `${theme}-${color.name}-${color.hex}` ? (
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
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Color Palette Generator
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
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
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-500" />
            Color Preferences
          </CardTitle>
          <CardDescription>
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
                  {roomTypes.map((room) => (
                    <SelectItem key={room.value} value={room.value}>
                      {room.label}
                    </SelectItem>
                  ))}
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
                  {designStyles.map((styleOption) => (
                    <SelectItem key={styleOption.value} value={styleOption.value}>
                      {styleOption.label}
                    </SelectItem>
                  ))}
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

              {/* Primary Palette */}
              {palette.primary_palette && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-500" />
                      Primary Color Palette
                    </CardTitle>
                    <CardDescription>
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
                          ) : (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border-2 border-gray-200"
                                style={{ backgroundColor: colors }}
                              />
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{colors}</code>
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
                          <p className="text-sm text-muted-foreground">{description}</p>
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
                          <p className="text-sm text-muted-foreground">{description}</p>
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
                    <CardTitle>AI Color Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                        {palette.raw_response}
                      </pre>
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
