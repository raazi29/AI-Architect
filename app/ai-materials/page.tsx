'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  Palette, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Lightbulb,
  Leaf,
  IndianRupee,
  Clock,
  Shield,
  RefreshCw,
  Download,
  Share2
} from 'lucide-react';

interface RoomType {
  value: string;
  label: string;
}

interface DesignStyle {
  value: string;
  label: string;
}

interface MaterialSuggestion {
  flooring?: any;
  walls?: any;
  ceiling?: any;
  fixtures?: any;
  sustainability?: any;
  indian_context?: any;
  summary?: string;
  error?: boolean;
  message?: string;
  raw_response?: string;
}

const AIMaterialsPage = () => {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [designStyles, setDesignStyles] = useState<DesignStyle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<MaterialSuggestion | null>(null);

  // Form state
  const [roomType, setRoomType] = useState('');
  const [style, setStyle] = useState('');
  const [roomSize, setRoomSize] = useState('');
  const [durabilityNeeds, setDurabilityNeeds] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');

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

  const getMaterialSuggestions = async () => {
    if (!roomType || !style || !roomSize || !durabilityNeeds || !budgetRange) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8001/ai/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_type: roomType,
          style: style,
          room_size: parseFloat(roomSize),
          durability_needs: durabilityNeeds,
          budget_range: budgetRange,
          special_requirements: specialRequirements || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get material suggestions');
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      setError('Failed to get material suggestions. Please try again.');
      console.error('Error getting material suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMaterialOption = (material: any, index: number) => (
    <Card key={index} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-lg">{material.material}</h4>
          <Badge variant="outline" className="ml-2">
            Score: {material.durability_score}/10
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{material.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <h5 className="font-medium text-green-700 mb-1 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Pros
            </h5>
            <ul className="text-xs space-y-1">
              {material.pros?.map((pro: string, i: number) => (
                <li key={i} className="flex items-start">
                  <span className="w-1 h-1 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-red-700 mb-1 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Cons
            </h5>
            <ul className="text-xs space-y-1">
              {material.cons?.map((con: string, i: number) => (
                <li key={i} className="flex items-start">
                  <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <IndianRupee className="h-4 w-4 mr-1" />
            <span className="font-medium">{material.cost_range}</span>
          </div>
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-1" />
            <span>Maintenance: {material.maintenance}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Material Suggestions
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Get AI-powered material recommendations based on room function, style, and durability needs
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
            <Sparkles className="h-5 w-5 text-blue-500" />
            Material Requirements
          </CardTitle>
          <CardDescription>
            Provide details about your space to get personalized material recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <Label htmlFor="room-size">Room Size (sq meters) *</Label>
              <Input
                id="room-size"
                type="number"
                placeholder="e.g., 25"
                value={roomSize}
                onChange={(e) => setRoomSize(e.target.value)}
                min="1"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durability">Durability Needs *</Label>
              <Select value={durabilityNeeds} onValueChange={setDurabilityNeeds}>
                <SelectTrigger>
                  <SelectValue placeholder="Select durability level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High - Heavy usage, long-term</SelectItem>
                  <SelectItem value="medium">Medium - Regular usage</SelectItem>
                  <SelectItem value="low">Low - Light usage, decorative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget Range *</Label>
              <Select value={budgetRange} onValueChange={setBudgetRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Budget-friendly options</SelectItem>
                  <SelectItem value="medium">Medium - Balanced quality & cost</SelectItem>
                  <SelectItem value="high">High - Premium materials</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special-requirements">Special Requirements (Optional)</Label>
            <Textarea
              id="special-requirements"
              placeholder="e.g., pet-friendly, water-resistant, eco-friendly materials..."
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={getMaterialSuggestions} 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Getting AI Suggestions...' : 'Get Material Suggestions'}
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
      {suggestions && (
        <div className="space-y-6">
          {suggestions.error ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{suggestions.message}</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Summary */}
              {suggestions.summary && (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-6 w-6 text-blue-500 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">AI Recommendation Summary</h3>
                        <p className="text-muted-foreground">{suggestions.summary}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Flooring */}
              {suggestions.flooring && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-orange-500" />
                      Flooring Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {suggestions.flooring.primary_options?.map((material: any, index: number) => 
                        renderMaterialOption(material, index)
                      )}
                      
                      {suggestions.flooring.alternative_options && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-3">Alternative Options</h4>
                          <div className="flex flex-wrap gap-2">
                            {suggestions.flooring.alternative_options.map((alt: string, index: number) => (
                              <Badge key={index} variant="secondary">{alt}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Walls */}
              {suggestions.walls && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-green-500" />
                      Wall Treatment Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {suggestions.walls.paint && (
                        <div className="space-y-3">
                          <h4 className="font-medium">Paint Options</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium">Recommended Types:</p>
                              <ul className="text-sm text-muted-foreground">
                                {suggestions.walls.paint.recommended_types?.map((type: string, i: number) => (
                                  <li key={i}>• {type}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Finishes:</p>
                              <ul className="text-sm text-muted-foreground">
                                {suggestions.walls.paint.finishes?.map((finish: string, i: number) => (
                                  <li key={i}>• {finish}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {suggestions.walls.wallpaper && (
                        <div className="space-y-3">
                          <h4 className="font-medium">Wallpaper Options</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium">Patterns:</p>
                              <ul className="text-sm text-muted-foreground">
                                {suggestions.walls.wallpaper.patterns?.map((pattern: string, i: number) => (
                                  <li key={i}>• {pattern}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Materials:</p>
                              <ul className="text-sm text-muted-foreground">
                                {suggestions.walls.wallpaper.materials?.map((material: string, i: number) => (
                                  <li key={i}>• {material}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {suggestions.walls.tiles && (
                        <div className="space-y-3">
                          <h4 className="font-medium">Tile Options</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium">Recommended For:</p>
                              <ul className="text-sm text-muted-foreground">
                                {suggestions.walls.tiles.recommended_for?.map((area: string, i: number) => (
                                  <li key={i}>• {area}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Types:</p>
                              <ul className="text-sm text-muted-foreground">
                                {suggestions.walls.tiles.types?.map((type: string, i: number) => (
                                  <li key={i}>• {type}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sustainability */}
              {suggestions.sustainability && (
                <Card className="border-0 shadow-lg bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-green-600" />
                      Sustainability Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium mb-2">Eco-Friendly Options</h4>
                        <ul className="space-y-1">
                          {suggestions.sustainability.eco_friendly_options?.map((option: string, i: number) => (
                            <li key={i} className="flex items-start text-sm">
                              <Leaf className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              {option}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Certifications</h4>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.sustainability.certifications?.map((cert: string, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-green-100 text-green-800">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Indian Context */}
              {suggestions.indian_context && (
                <Card className="border-0 shadow-lg bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-orange-600" />
                      Indian Context & Climate Considerations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <h4 className="font-medium mb-2">Climate Considerations</h4>
                        <ul className="space-y-1 text-sm">
                          {suggestions.indian_context.climate_considerations?.map((consideration: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <span className="w-1 h-1 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {consideration}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Local Materials</h4>
                        <ul className="space-y-1 text-sm">
                          {suggestions.indian_context.local_materials?.map((material: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <span className="w-1 h-1 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {material}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Cultural Elements</h4>
                        <ul className="space-y-1 text-sm">
                          {suggestions.indian_context.cultural_elements?.map((element: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <span className="w-1 h-1 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {element}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Raw Response Fallback */}
              {suggestions.raw_response && !suggestions.flooring && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>AI Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                        {suggestions.raw_response}
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

export default AIMaterialsPage;
