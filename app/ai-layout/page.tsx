'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import InteractiveLayoutDesigner from '@/components/layout/interactive-layout-designer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Layout, 
  Move3D, 
  Compass, 
  Home,
  AlertTriangle, 
  Info,
  Lightbulb,
  RefreshCw,
  Download,
  Share2,
  Maximize,
  Navigation,
  Target,
  Zap,
  Eye,
  CheckCircle,
  ArrowRight,
  Grid3X3,
  Ruler,
  Image as ImageIcon,
  FileText,
  Sparkles
} from 'lucide-react';

interface RoomType {
  value: string;
  label: string;
}

interface FurnitureItem {
  item: string;
  position: {
    x: number;
    y: number;
    rotation: number;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  reasoning: string;
}

interface TrafficPath {
  from: string;
  to: string;
  width: number;
  description: string;
}

interface FocalPoint {
  type: string;
  position: {
    x: number;
    y: number;
  };
  description: string;
}

interface FunctionalZone {
  name: string;
  area: number;
  furniture: string[];
  purpose: string;
}

interface LayoutOptimization {
  optimal_layout?: {
    furniture_placement: FurnitureItem[];
    traffic_paths: TrafficPath[];
    focal_points: FocalPoint[];
  };
  space_utilization?: {
    total_area: number;
    usable_area: number;
    circulation_area: number;
    efficiency_score: number;
  };
  functional_zones?: FunctionalZone[];
  design_principles?: any;
  lighting_plan?: any;
  storage_solutions?: any[];
  flexibility_features?: string[];
  indian_context?: any;
  improvement_suggestions?: string[];
  error?: boolean;
  message?: string;
  raw_response?: string;
}

interface ImageLayoutResponse {
  success: boolean;
  image_data?: string;
  model_used?: string;
  prompt_used?: string;
  image_dimensions?: {
    width: number;
    height: number;
  };
  layout_analysis?: {
    room_analysis: {
      type: string;
      dimensions: string;
      total_area: string;
      primary_function: string;
      style: string;
    };
    design_features: {
      traffic_flow: string;
      furniture_consideration: number;
      special_requirements: string;
    };
    optimization_notes: string[];
    prompt_engineering: {
      original_prompt: string;
      optimization_applied: string;
    };
  };
  error?: string;
  message?: string;
  fallback_suggestions?: string[];
}

const AILayoutPage = () => {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimization, setOptimization] = useState<LayoutOptimization | null>(null);
  const [imageResponse, setImageResponse] = useState<ImageLayoutResponse | null>(null);

  // Form state
  const [roomType, setRoomType] = useState('');
  const [roomLength, setRoomLength] = useState('');
  const [roomWidth, setRoomWidth] = useState('');
  const [roomHeight, setRoomHeight] = useState('');
  const [existingFurniture, setExistingFurniture] = useState<string[]>([]);
  const [primaryFunction, setPrimaryFunction] = useState('');
  const [trafficFlowRequirements, setTrafficFlowRequirements] = useState('');
  const [furnitureInput, setFurnitureInput] = useState('');
  const [outputMode, setOutputMode] = useState<'text' | 'image'>('text');
  const [designStyle, setDesignStyle] = useState('modern');
  const [specialRequirements, setSpecialRequirements] = useState('');

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/room-types`);
      const data = await response.json();
      setRoomTypes(data.room_types);
    } catch (error) {
      console.error('Error fetching room types:', error);
    }
  };

  const addFurniture = () => {
    if (furnitureInput.trim() && !existingFurniture.includes(furnitureInput.trim())) {
      setExistingFurniture([...existingFurniture, furnitureInput.trim()]);
      setFurnitureInput('');
    }
  };

  const removeFurniture = (furniture: string) => {
    setExistingFurniture(existingFurniture.filter(f => f !== furniture));
  };

  const optimizeLayout = async () => {
    if (!roomType || !roomLength || !roomWidth || !primaryFunction || !trafficFlowRequirements) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setOptimization(null);
    setImageResponse(null);

    try {
      if (outputMode === 'text') {
        const response = await fetch(`${API_BASE_URL}/ai/layout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_type: roomType,
            room_dimensions: {
              length: parseFloat(roomLength),
              width: parseFloat(roomWidth),
              height: roomHeight ? parseFloat(roomHeight) : 3.0
            },
            existing_furniture: existingFurniture.length > 0 ? existingFurniture : null,
            primary_function: primaryFunction,
            traffic_flow_requirements: trafficFlowRequirements
          })
        });

        if (!response.ok) {
          throw new Error('Failed to optimize room layout');
        }

        const data = await response.json();
        setOptimization(data);
      } else {
        // Image-based layout generation
        const response = await fetch(`${API_BASE_URL}/ai/layout-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_type: roomType,
            room_dimensions: {
              length: parseFloat(roomLength),
              width: parseFloat(roomWidth),
              height: roomHeight ? parseFloat(roomHeight) : 3.0
            },
            existing_furniture: existingFurniture.length > 0 ? existingFurniture : null,
            primary_function: primaryFunction,
            traffic_flow_requirements: trafficFlowRequirements,
            style: designStyle,
            special_requirements: specialRequirements || null
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate layout image');
        }

        const data = await response.json();
        setImageResponse(data);
      }
    } catch (error) {
      setError(`Failed to ${outputMode === 'text' ? 'optimize room layout' : 'generate layout image'}. Please try again.`);
      console.error('Error optimizing layout:', error);
    } finally {
      setLoading(false);
    }
  };

  const FurnitureCard = ({ furniture }: { furniture: FurnitureItem }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-lg">{furniture.item}</h4>
          <Badge variant="outline">
            {furniture.dimensions.length}×{furniture.dimensions.width}m
          </Badge>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Navigation className="h-4 w-4 text-blue-500" />
              <span>Position: ({furniture.position.x}, {furniture.position.y})</span>
            </div>
            <div className="flex items-center gap-1">
              <Compass className="h-4 w-4 text-green-500" />
              <span>Rotation: {furniture.position.rotation}°</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <strong>Dimensions:</strong> {furniture.dimensions.length}L × {furniture.dimensions.width}W × {furniture.dimensions.height}H meters
          </div>
        </div>
        
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Reasoning:</strong> {furniture.reasoning}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const TrafficPathCard = ({ path }: { path: TrafficPath }) => (
    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
      <ArrowRight className="h-5 w-5 text-green-600" />
      <div className="flex-1">
        <p className="font-medium text-sm">{path.from} → {path.to}</p>
        <p className="text-xs text-muted-foreground">{path.description}</p>
      </div>
      <Badge variant="secondary">{path.width}m wide</Badge>
    </div>
  );

  const ZoneCard = ({ zone }: { zone: FunctionalZone }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold">{zone.name}</h4>
          <Badge variant="outline">{zone.area}m²</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{zone.purpose}</p>
        <div className="space-y-2">
          <p className="text-xs font-medium">Furniture:</p>
          <div className="flex flex-wrap gap-1">
            {zone.furniture.map((item, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gradient-to-br from-indigo-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
            AI Layout Optimizer
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Get optimal furniture arrangements based on room dimensions, traffic flow, and functionality
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

      {/* Output Mode Toggle */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose Your Tool</h3>
              <p className="text-sm text-muted-foreground">
                Select between AI optimization or the interactive designer.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant={outputMode === 'text' ? 'default' : 'outline'}
                onClick={() => setOutputMode('text')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                AI Suggestions
              </Button>
              <Button
                variant={outputMode === 'image' ? 'default' : 'outline'}
                onClick={() => setOutputMode('image')}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <ImageIcon className="h-4 w-4" />
                <Sparkles className="h-4 w-4" />
                Interactive Designer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Tabs defaultValue="specifications" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
          </TabsList>
          <TabsContent value="specifications">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5 text-indigo-500" />
                  Room Specifications
                </CardTitle>
                <CardDescription>
                  Provide your room details to get AI-powered layout optimization
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
                    <Label htmlFor="room-length">Length (meters) *</Label>
                    <Input
                      id="room-length"
                      type="number"
                      placeholder="e.g., 4.5"
                      value={roomLength}
                      onChange={(e) => setRoomLength(e.target.value)}
                      min="1"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room-width">Width (meters) *</Label>
                    <Input
                      id="room-width"
                      type="number"
                      placeholder="e.g., 3.5"
                      value={roomWidth}
                      onChange={(e) => setRoomWidth(e.target.value)}
                      min="1"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room-height">Height (meters)</Label>
                    <Input
                      id="room-height"
                      type="number"
                      placeholder="e.g., 3.0 (optional)"
                      value={roomHeight}
                      onChange={(e) => setRoomHeight(e.target.value)}
                      min="2"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primary-function">Primary Function *</Label>
                    <Textarea
                      id="primary-function"
                      placeholder="e.g., Family entertainment and relaxation, Work and study, Formal dining..."
                      value={primaryFunction}
                      onChange={(e) => setPrimaryFunction(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="traffic-flow">Traffic Flow Requirements *</Label>
                    <Textarea
                      id="traffic-flow"
                      placeholder="e.g., Easy access from entrance to seating, Clear path to balcony, Wheelchair accessible..."
                      value={trafficFlowRequirements}
                      onChange={(e) => setTrafficFlowRequirements(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Existing Furniture */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="existing-furniture">Existing Furniture (Optional)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Add furniture you already have (e.g., 3-seater sofa, dining table, bookshelf)
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter furniture item"
                        value={furnitureInput}
                        onChange={(e) => setFurnitureInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addFurniture()}
                      />
                      <Button type="button" onClick={addFurniture} variant="outline">
                        Add
                      </Button>
                    </div>
                  </div>

                  {existingFurniture.length > 0 && (
                    <div className="space-y-2">
                      <Label>Existing Furniture ({existingFurniture.length})</Label>
                      <div className="flex flex-wrap gap-2">
                        {existingFurniture.map((furniture, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-red-100"
                            onClick={() => removeFurniture(furniture)}
                          >
                            {furniture} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={optimizeLayout} 
                  className='bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600'
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Layout className="mr-2 h-4 w-4" />
                  )}
                  {loading 
                    ? 'Optimizing Layout...'
                    : 'Optimize Room Layout'
                  }
                </Button>

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="suggestions">
            {/* Text Results */}
            {optimization && (
              <div className="space-y-6">
                {optimization.error ? (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{optimization.message}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    {/* Space Utilization */}
                    {optimization.space_utilization && (
                      <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-500/10 to-cyan-500/10">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Grid3X3 className="h-6 w-6 text-indigo-600" />
                            Space Utilization Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 md:grid-cols-4">
                            <div className="text-center p-4 bg-white rounded-lg">
                              <Ruler className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground mb-1">Total Area</p>
                              <p className="text-2xl font-bold text-indigo-600">
                                {optimization.space_utilization.total_area}m²
                              </p>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg">
                              <Home className="h-8 w-8 text-green-500 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground mb-1">Usable Area</p>
                              <p className="text-2xl font-bold text-green-600">
                                {optimization.space_utilization.usable_area}%
                              </p>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg">
                              <Navigation className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground mb-1">Circulation</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {optimization.space_utilization.circulation_area}%
                              </p>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg border-2 border-indigo-200">
                              <Target className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground mb-1">Efficiency Score</p>
                              <p className="text-3xl font-bold text-indigo-700">
                                {optimization.space_utilization.efficiency_score}/10
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        {/* Furniture Placement */}
                        {optimization.optimal_layout?.furniture_placement && (
                          <Card className="border-0 shadow-lg">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Move3D className="h-5 w-5 text-purple-500" />
                                Optimal Furniture Placement
                              </CardTitle>
                              <CardDescription>
                                AI-recommended positions for maximum functionality and flow
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid gap-4">
                                {optimization.optimal_layout.furniture_placement.map((furniture, index) => (
                                  <FurnitureCard key={index} furniture={furniture} />
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Traffic Paths */}
                        {optimization.optimal_layout?.traffic_paths && (
                          <Card className="border-0 shadow-lg">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Navigation className="h-5 w-5 text-green-500" />
                                Traffic Flow Paths
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {optimization.optimal_layout.traffic_paths.map((path, index) => (
                                  <TrafficPathCard key={index} path={path} />
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Focal Points */}
                        {optimization.optimal_layout?.focal_points && (
                          <Card className="border-0 shadow-lg">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5 text-orange-500" />
                                Visual Focal Points
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid gap-4">
                                {optimization.optimal_layout.focal_points.map((focal, index) => (
                                  <div key={index} className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                                    <Target className="h-8 w-8 text-orange-500" />
                                    <div className="flex-1">
                                      <h4 className="font-medium">{focal.type}</h4>
                                      <p className="text-sm text-muted-foreground">{focal.description}</p>
                                      <p className="text-xs text-orange-600">
                                        Position: ({focal.position.x}, {focal.position.y})
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Functional Zones */}
                        {optimization.functional_zones && (
                          <Card className="border-0 shadow-lg">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Grid3X3 className="h-5 w-5 text-blue-500" />
                                Functional Zones
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid gap-4">
                                {optimization.functional_zones.map((zone, index) => (
                                  <ZoneCard key={index} zone={zone} />
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      <div className="space-y-6">
                        {/* Design Principles */}
                        {optimization.design_principles && (
                          <Card className="border-0 shadow-lg bg-purple-50">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Compass className="h-5 w-5 text-purple-600" />
                                Design Principles Applied
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid gap-4">
                                {Object.entries(optimization.design_principles).map(([principle, description]: [string, any]) => (
                                  <div key={principle} className="p-4 bg-white rounded-lg border border-purple-200">
                                    <h4 className="font-medium capitalize mb-2">{principle}</h4>
                                    <p className="text-sm text-muted-foreground">{description}</p>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Lighting Plan */}
                        {optimization.lighting_plan && (
                          <Card className="border-0 shadow-lg bg-yellow-50">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-yellow-600" />
                                Lighting Plan
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {Object.entries(optimization.lighting_plan).map(([lightingType, lights]: [string, any]) => (
                                  <div key={lightingType} className="space-y-3">
                                    <h4 className="font-medium capitalize">{lightingType.replace('_', ' ')}</h4>
                                    <div className="grid gap-3">
                                      {Array.isArray(lights) && lights.map((light: any, index: number) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-200">
                                          <Lightbulb className="h-5 w-5 text-yellow-500" />
                                          <div>
                                            <p className="font-medium text-sm">{light.type}</p>
                                            <p className="text-xs text-muted-foreground">{light.position}</p>
                                            <p className="text-xs text-yellow-700">{light.purpose}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Storage Solutions */}
                        {optimization.storage_solutions && (
                          <Card className="border-0 shadow-lg bg-green-50">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Home className="h-5 w-5 text-green-600" />
                                Storage Solutions
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid gap-4">
                                {optimization.storage_solutions.map((solution: any, index: number) => (
                                  <div key={index} className="p-4 bg-white rounded-lg border border-green-200">
                                    <h4 className="font-medium mb-2">{solution.type}</h4>
                                    <div className="space-y-1 text-sm">
                                      <p><strong>Location:</strong> {solution.location}</p>
                                      <p><strong>Capacity:</strong> {solution.capacity}</p>
                                      <p><strong>Accessibility:</strong> {solution.accessibility}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Flexibility Features */}
                        {optimization.flexibility_features && (
                          <Card className="border-0 shadow-lg bg-blue-50">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-blue-600" />
                                Flexibility Features
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-3">
                                {optimization.flexibility_features.map((feature: string, index: number) => (
                                  <li key={index} className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm">{feature}</p>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {/* Indian Context */}
                        {optimization.indian_context && (
                          <Card className="border-0 shadow-lg bg-orange-50">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-orange-600" />
                                Indian Context Considerations
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {Object.entries(optimization.indian_context).map(([aspect, description]: [string, any]) => (
                                  <div key={aspect} className="p-4 bg-white rounded-lg border border-orange-200">
                                    <h4 className="font-medium capitalize mb-2">{aspect.replace('_', ' ')}</h4>
                                    <p className="text-sm text-muted-foreground">{description}</p>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Improvement Suggestions */}
                        {optimization.improvement_suggestions && (
                          <Card className="border-0 shadow-lg bg-indigo-50">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-indigo-600" />
                                Additional Improvement Suggestions
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-3">
                                {optimization.improvement_suggestions.map((suggestion: string, index: number) => (
                                  <li key={index} className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                      {index + 1}
                                    </div>
                                    <p className="text-sm">{suggestion}</p>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>

                    {/* Raw Response Fallback */}
                    {optimization.raw_response && !optimization.optimal_layout && (
                      <Card className="border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle>AI Layout Optimization</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="prose max-w-none">
                            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                              {optimization.raw_response}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
        <div> {/* Removed conditional class */}
          <InteractiveLayoutDesigner />
        </div>
      </div>

      {/* Image Results */}
      {imageResponse && (
        <div className="space-y-6">
          {!imageResponse.success ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {imageResponse.message}
                {imageResponse.fallback_suggestions && (
                  <div className="mt-3">
                    <p className="font-medium mb-2">Suggestions:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {imageResponse.fallback_suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Generated Floor Plan Image */}
              <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-6 w-6 text-purple-600" />
                    Generated Floor Plan
                  </CardTitle>
                  <CardDescription>
                    AI-generated floor plan using {imageResponse.model_used}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Image Display */}
                    <div className="relative bg-white rounded-lg border-2 border-purple-200 p-4">
                      <img 
                        src={imageResponse.image_data} 
                        alt="Generated floor plan"
                        className="w-full h-auto max-w-2xl mx-auto rounded-lg shadow-md"
                        style={{ maxHeight: '600px', objectFit: 'contain' }}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button size="sm" variant="outline" className="bg-white/80">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="bg-white/80">
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Image Details */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                        <ImageIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">Dimensions</p>
                        <p className="font-semibold text-purple-600">
                          {imageResponse.image_dimensions?.width} × {imageResponse.image_dimensions?.height}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                        <Sparkles className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">Model Used</p>
                        <p className="font-semibold text-purple-600 text-xs">
                          {imageResponse.model_used?.split('/').pop()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                        <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <p className="font-semibold text-green-600">Generated</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Layout Analysis */}
              {imageResponse.layout_analysis && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Grid3X3 className="h-5 w-5 text-indigo-500" />
                      Layout Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Room Analysis */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <Home className="h-4 w-4 text-blue-500" />
                            Room Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Type:</strong> {imageResponse.layout_analysis.room_analysis.type}</p>
                            <p><strong>Dimensions:</strong> {imageResponse.layout_analysis.room_analysis.dimensions}</p>
                            <p><strong>Total Area:</strong> {imageResponse.layout_analysis.room_analysis.total_area}</p>
                            <p><strong>Style:</strong> {imageResponse.layout_analysis.room_analysis.style}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-green-500" />
                            Design Features
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Primary Function:</strong> {imageResponse.layout_analysis.room_analysis.primary_function}</p>
                            <p><strong>Traffic Flow:</strong> {imageResponse.layout_analysis.design_features.traffic_flow}</p>
                            <p><strong>Furniture Items:</strong> {imageResponse.layout_analysis.design_features.furniture_consideration}</p>
                            <p><strong>Special Requirements:</strong> {imageResponse.layout_analysis.design_features.special_requirements}</p>
                          </div>
                        </div>
                      </div>

                      {/* Optimization Notes */}
                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-3">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          Optimization Notes
                        </h4>
                        <ul className="space-y-2">
                          {imageResponse.layout_analysis.optimization_notes.map((note, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {note}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Prompt Engineering */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 mb-3">
                          <Info className="h-4 w-4 text-blue-500" />
                          Generation Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Original Prompt:</strong></p>
                          <p className="text-muted-foreground bg-white p-2 rounded border text-xs">
                            {imageResponse.prompt_used}
                          </p>
                          <p><strong>Optimization Applied:</strong> {imageResponse.layout_analysis.prompt_engineering.optimization_applied}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Text Results */}
      {optimization && (
        <div className="space-y-6">
          {optimization.error ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{optimization.message}</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Space Utilization */}
              {optimization.space_utilization && (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-500/10 to-cyan-500/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Grid3X3 className="h-6 w-6 text-indigo-600" />
                      Space Utilization Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-center p-4 bg-white rounded-lg">
                        <Ruler className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">Total Area</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {optimization.space_utilization.total_area}m²
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <Home className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">Usable Area</p>
                        <p className="text-2xl font-bold text-green-600">
                          {optimization.space_utilization.usable_area}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <Navigation className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">Circulation</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {optimization.space_utilization.circulation_area}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border-2 border-indigo-200">
                        <Target className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">Efficiency Score</p>
                        <p className="text-3xl font-bold text-indigo-700">
                          {optimization.space_utilization.efficiency_score}/10
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Furniture Placement */}
              {optimization.optimal_layout?.furniture_placement && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Move3D className="h-5 w-5 text-purple-500" />
                      Optimal Furniture Placement
                    </CardTitle>
                    <CardDescription>
                      AI-recommended positions for maximum functionality and flow
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {optimization.optimal_layout.furniture_placement.map((furniture, index) => (
                        <FurnitureCard key={index} furniture={furniture} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Traffic Paths */}
              {optimization.optimal_layout?.traffic_paths && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-green-500" />
                      Traffic Flow Paths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {optimization.optimal_layout.traffic_paths.map((path, index) => (
                        <TrafficPathCard key={index} path={path} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Focal Points */}
              {optimization.optimal_layout?.focal_points && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-orange-500" />
                      Visual Focal Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {optimization.optimal_layout.focal_points.map((focal, index) => (
                        <div key={index} className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                          <Target className="h-8 w-8 text-orange-500" />
                          <div className="flex-1">
                            <h4 className="font-medium">{focal.type}</h4>
                            <p className="text-sm text-muted-foreground">{focal.description}</p>
                            <p className="text-xs text-orange-600">
                              Position: ({focal.position.x}, {focal.position.y})
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Functional Zones */}
              {optimization.functional_zones && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Grid3X3 className="h-5 w-5 text-blue-500" />
                      Functional Zones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {optimization.functional_zones.map((zone, index) => (
                        <ZoneCard key={index} zone={zone} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Design Principles */}
              {optimization.design_principles && (
                <Card className="border-0 shadow-lg bg-purple-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Compass className="h-5 w-5 text-purple-600" />
                      Design Principles Applied
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.entries(optimization.design_principles).map(([principle, description]: [string, any]) => (
                        <div key={principle} className="p-4 bg-white rounded-lg border border-purple-200">
                          <h4 className="font-medium capitalize mb-2">{principle}</h4>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lighting Plan */}
              {optimization.lighting_plan && (
                <Card className="border-0 shadow-lg bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      Lighting Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(optimization.lighting_plan).map(([lightingType, lights]: [string, any]) => (
                        <div key={lightingType} className="space-y-3">
                          <h4 className="font-medium capitalize">{lightingType.replace('_', ' ')}</h4>
                          <div className="grid gap-3 md:grid-cols-2">
                            {Array.isArray(lights) && lights.map((light: any, index: number) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-200">
                                <Lightbulb className="h-5 w-5 text-yellow-500" />
                                <div>
                                  <p className="font-medium text-sm">{light.type}</p>
                                  <p className="text-xs text-muted-foreground">{light.position}</p>
                                  <p className="text-xs text-yellow-700">{light.purpose}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Storage Solutions */}
              {optimization.storage_solutions && (
                <Card className="border-0 shadow-lg bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-green-600" />
                      Storage Solutions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {optimization.storage_solutions.map((solution: any, index: number) => (
                        <div key={index} className="p-4 bg-white rounded-lg border border-green-200">
                          <h4 className="font-medium mb-2">{solution.type}</h4>
                          <div className="space-y-1 text-sm">
                            <p><strong>Location:</strong> {solution.location}</p>
                            <p><strong>Capacity:</strong> {solution.capacity}</p>
                            <p><strong>Accessibility:</strong> {solution.accessibility}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Flexibility Features */}
              {optimization.flexibility_features && (
                <Card className="border-0 shadow-lg bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      Flexibility Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {optimization.flexibility_features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{feature}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Indian Context */}
              {optimization.indian_context && (
                <Card className="border-0 shadow-lg bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-orange-600" />
                      Indian Context Considerations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(optimization.indian_context).map(([aspect, description]: [string, any]) => (
                        <div key={aspect} className="p-4 bg-white rounded-lg border border-orange-200">
                          <h4 className="font-medium capitalize mb-2">{aspect.replace('_', ' ')}</h4>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Improvement Suggestions */}
              {optimization.improvement_suggestions && (
                <Card className="border-0 shadow-lg bg-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-indigo-600" />
                      Additional Improvement Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {optimization.improvement_suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                            {index + 1}
                          </div>
                          <p className="text-sm">{suggestion}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Raw Response Fallback */}
              {optimization.raw_response && !optimization.optimal_layout && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>AI Layout Optimization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                        {optimization.raw_response}
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

export default AILayoutPage;
