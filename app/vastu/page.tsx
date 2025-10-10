'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { 
  Compass, 
  Home, 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Calculator,
  Palette,
  Wind,
  Droplets,
  Flame,
  Mountain,
  Sun,
  Moon,
  Star,
  BookOpen,
  Plus,
  Trash2,
  RefreshCw,
  Award
} from 'lucide-react';

// Types for API responses
interface RoomType {
  value: string;
  label: string;
}

interface Direction {
  value: string;
  label: string;
}

interface VastuElement {
  name: string;
  direction: string;
  properties: string;
  color: string;
  benefits: string[];
  tips: string[];
}

interface RoomAnalysis {
  room_type: string;
  direction: string;
  status: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  score: number;
  ideal_directions: string[];
  avoid_directions: string[];
  recommendations: string[];
  benefits: string[];
  issues: string[];
  element?: VastuElement;
}

interface Room {
  id: string;
  type: string;
  direction: string;
}

const VastuPage = () => {
  const [activeTab, setActiveTab] = useState('analyzer');
  const [roomType, setRoomType] = useState('');
  const [direction, setDirection] = useState('');
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [detailedAnalysis, setDetailedAnalysis] = useState<any | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRemedies, setShowRemedies] = useState(false);

  // Load data on component mount
  useEffect(() => {
    fetchRoomTypes();
    fetchDirections();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const response = await fetch('http://localhost:8001/vastu/room-types');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRoomTypes(data.room_types || []);
    } catch (error) {
      console.error('Error fetching room types:', error);
      // Set default room types as fallback
      setRoomTypes([
        {"value": "main_entrance", "label": "Main Entrance"},
        {"value": "living_room", "label": "Living Room"},
        {"value": "master_bedroom", "label": "Master Bedroom"},
        {"value": "kitchen", "label": "Kitchen"},
        {"value": "bathroom", "label": "Bathroom"},
        {"value": "study_room", "label": "Study Room"},
        {"value": "dining_room", "label": "Dining Room"},
        {"value": "guest_room", "label": "Guest Room"},
        {"value": "pooja_room", "label": "Pooja Room"},
        {"value": "staircase", "label": "Staircase"}
      ]);
    }
  };

  const fetchDirections = async () => {
    try {
      const response = await fetch('http://localhost:8001/vastu/directions');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDirections(data.directions || []);
    } catch (error) {
      console.error('Error fetching directions:', error);
      // Set default directions as fallback
      setDirections([
        {"value": "north", "label": "North"},
        {"value": "north-east", "label": "North-East"},
        {"value": "east", "label": "East"},
        {"value": "south-east", "label": "South-East"},
        {"value": "south", "label": "South"},
        {"value": "south-west", "label": "South-West"},
        {"value": "west", "label": "West"},
        {"value": "north-west", "label": "North-West"},
        {"value": "center", "label": "Center"}
      ]);
    }
  };

  const analyzeRoom = async () => {
    if (!roomType || !direction) return;
    
    setLoading(true);
    setError(null);
    setShowRemedies(false);
    
    try {
      // Get basic analysis
      const response = await fetch('http://localhost:8001/vastu/analyze-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_type: roomType,
          direction: direction
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze room');
      }
      
      const data = await response.json();
      setAnalysis(data);
      
      // Get detailed analysis with remedies
      try {
        const detailedResponse = await fetch(
          `http://localhost:8001/vastu/analyze-room-detailed?room_type=${roomType}&direction=${direction}`,
          { method: 'POST' }
        );
        
        if (detailedResponse.ok) {
          const detailedData = await detailedResponse.json();
          setDetailedAnalysis(detailedData);
          setShowRemedies(detailedData.remedies !== null);
        }
      } catch (detailError) {
        console.log('Detailed analysis not available:', detailError);
        // Continue with basic analysis
      }
    } catch (error) {
      setError('Failed to analyze room. Please try again.');
      console.error('Error analyzing room:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'average': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      case 'critical': return 'text-red-800 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return CheckCircle;
      case 'good': return CheckCircle;
      case 'average': return Info;
      case 'poor': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return Info;
    }
  };

  // Vastu elements data
  const vastuElements = [
    {
      name: 'Earth (Prithvi)',
      icon: Mountain,
      color: 'text-yellow-600',
      direction: 'South-West',
      properties: 'Stability, strength, support',
      tips: 'Place heavy furniture and storage in SW direction'
    },
    {
      name: 'Water (Jal)',
      icon: Droplets,
      color: 'text-blue-600',
      direction: 'North-East',
      properties: 'Flow, purification, life',
      tips: 'Water features, bathrooms in NE bring prosperity'
    },
    {
      name: 'Fire (Agni)',
      icon: Flame,
      color: 'text-red-600',
      direction: 'South-East',
      properties: 'Energy, transformation, power',
      tips: 'Kitchen, electrical appliances in SE direction'
    },
    {
      name: 'Air (Vayu)',
      icon: Wind,
      color: 'text-green-600',
      direction: 'North-West',
      properties: 'Movement, circulation, freshness',
      tips: 'Windows, ventilation in NW for good airflow'
    },
    {
      name: 'Space (Akash)',
      icon: Star,
      color: 'text-purple-600',
      direction: 'Center',
      properties: 'Openness, freedom, expansion',
      tips: 'Keep center area open and clutter-free'
    }
  ];

  const roomGuidelines = [
    {
      room: 'Main Entrance',
      bestDirection: 'North, East, North-East',
      avoid: 'South-West corner',
      tips: 'Well-lit, obstacle-free, beautiful door',
      status: 'excellent'
    },
    {
      room: 'Living Room',
      bestDirection: 'North, East, North-East',
      avoid: 'South-West for seating',
      tips: 'Light colors, good ventilation, east-facing seating',
      status: 'good'
    },
    {
      room: 'Master Bedroom',
      bestDirection: 'South-West',
      avoid: 'North-East corner',
      tips: 'Bed in SW corner, head towards south/east',
      status: 'excellent'
    },
    {
      room: 'Kitchen',
      bestDirection: 'South-East',
      avoid: 'North-East, North-West',
      tips: 'Cook facing east, sink in NE corner',
      status: 'good'
    },
    {
      room: 'Bathroom',
      bestDirection: 'North-West, South-East',
      avoid: 'North-East, South-West',
      tips: 'Exhaust fan in east/north wall',
      status: 'warning'
    },
    {
      room: 'Study Room',
      bestDirection: 'North-East, West',
      avoid: 'Under staircase',
      tips: 'Face east/north while studying',
      status: 'excellent'
    }
  ];

  const vastuTipsData = [
    {
      category: 'Colors',
      icon: Palette,
      tips: [
        'Use light colors in north and east walls',
        'Avoid dark colors in north-east',
        'Yellow and orange in south-west bring stability',
        'Blue and green in north enhance prosperity'
      ]
    },
    {
      category: 'Lighting',
      icon: Lightbulb,
      tips: [
        'Maximum natural light from north and east',
        'Avoid heavy curtains on north/east windows',
        'Use bright lights in dark corners',
        'Place lamps in south-east corner'
      ]
    },
    {
      category: 'Furniture Placement',
      icon: Home,
      tips: [
        'Heavy furniture in south and west',
        'Keep north-east corner light and airy',
        'Avoid furniture in center of room',
        'Bed should not face north direction'
      ]
    }
  ];


  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Vastu Shastra
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Ancient wisdom for modern living - Create harmonious spaces with Vastu principles
          </p>
        </div>
        <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
          <BookOpen className="mr-2 h-5 w-5" />
          Learn Vastu
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="analyzer">Analyzer</TabsTrigger>
          <TabsTrigger value="elements">Elements</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
          <TabsTrigger value="tips">Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="analyzer" className="space-y-6">
          {/* Vastu Analyzer */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-orange-500" />
                Vastu Room Analyzer
              </CardTitle>
              <CardDescription>
                Analyze your room placement according to Vastu principles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="room-type">Room Type</Label>
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
                  <Label htmlFor="direction">Direction/Location</Label>
                  <Select value={direction} onValueChange={setDirection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      {directions && directions.length > 0 ? directions.map((dir) => (
                        <SelectItem key={dir.value} value={dir.value}>
                          {dir.label}
                        </SelectItem>
                      )) : (
                        <SelectItem value="loading" disabled>Loading directions...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={analyzeRoom} className="w-full" disabled={!roomType || !direction || loading}>
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Compass className="mr-2 h-4 w-4" />
                )}
                {loading ? 'Analyzing...' : 'Analyze Vastu Compliance'}
              </Button>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {analysis && (
                <Card className={`border-2 ${getStatusColor(analysis.status)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {(() => {
                        const StatusIcon = getStatusIcon(analysis.status);
                        return <StatusIcon className="h-6 w-6" />;
                      })()}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">
                          {roomTypes.find(rt => rt.value === analysis.room_type)?.label || analysis.room_type} in {directions.find(d => d.value === analysis.direction)?.label || analysis.direction}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(analysis.status)}>
                            {analysis.status.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">Score: {analysis.score}/100</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Progress value={analysis.score} className="w-20" />
                      </div>
                    </div>
                    
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Recommendations:</h4>
                        <ul className="space-y-1">
                          {analysis.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysis.benefits && analysis.benefits.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Benefits:</h4>
                        <ul className="space-y-1">
                          {analysis.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-green-700">
                              <Award className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysis.element && (
                      <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-5 w-5 text-purple-500" />
                          <span className="font-medium">{analysis.element.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{analysis.element.properties}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="elements" className="space-y-6">
          {/* Five Elements */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                Panchabhutas - Five Elements
              </CardTitle>
              <CardDescription>
                Understanding the fundamental elements of Vastu Shastra
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {vastuElements.map((element) => (
                  <Card key={element.name} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <element.icon className={`h-8 w-8 ${element.color}`} />
                        <div>
                          <h3 className="font-semibold text-lg">{element.name}</h3>
                          <p className="text-sm text-muted-foreground">{element.direction}</p>
                        </div>
                      </div>
                      <p className="text-sm mb-3">{element.properties}</p>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">{element.tips}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-6">
          {/* Room Guidelines */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-500" />
                Room Placement Guidelines
              </CardTitle>
              <CardDescription>
                Optimal directions and placements for different rooms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roomGuidelines.map((guideline) => (
                  <Card key={guideline.room} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{guideline.room}</h3>
                        <Badge variant={
                          guideline.status === 'excellent' ? 'default' :
                          guideline.status === 'warning' ? 'secondary' : 'outline'
                        }>
                          {guideline.status}
                        </Badge>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-sm font-medium text-green-700 mb-1">Best Direction</p>
                          <p className="text-sm">{guideline.bestDirection}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-700 mb-1">Avoid</p>
                          <p className="text-sm">{guideline.avoid}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-1">Tips</p>
                          <p className="text-sm">{guideline.tips}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-6">
          {/* Vastu Tips */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {vastuTipsData.map((category: any) => (
              <Card key={category.category} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className="h-5 w-5 text-orange-500" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {category.tips.map((tip: any, index: any) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Vastu Compass */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-purple-500" />
                Vastu Compass & Direction Guide
              </CardTitle>
              <CardDescription>
                Understanding directional significance in Vastu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Directional Significance</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Sun className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">East - Surya (Sun)</p>
                        <p className="text-sm text-muted-foreground">Health, prosperity, new beginnings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">North - Kubera (Wealth)</p>
                        <p className="text-sm text-muted-foreground">Financial growth, opportunities</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <Flame className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">South - Yama (Death)</p>
                        <p className="text-sm text-muted-foreground">Stability, strength, discipline</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Moon className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">West - Varuna (Water)</p>
                        <p className="text-sm text-muted-foreground">Gains, profits, relationships</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative w-64 h-64 border-2 border-gray-300 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Compass className="h-16 w-16 text-orange-500" />
                    </div>
                    {/* Directional labels */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-sm font-medium">N</div>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm font-medium">E</div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm font-medium">S</div>
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm font-medium">W</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VastuPage;
