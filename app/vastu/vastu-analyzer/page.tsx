'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Compass, 
  Home, 
  MapPin, 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Ruler,
  Eye,
  Sun,
  Moon,
  Mountain,
  Droplets,
  Wind,
  Flame,
  Waves,
  TreePine,
  Building,
  Shield,
  Star
} from 'lucide-react';

interface VastuElement {
  id: string;
  name: string;
  direction: string;
  element: string;
  compatibility: 'excellent' | 'good' | 'neutral' | 'poor' | 'avoid';
  notes: string;
}

interface VastuRoom {
  id: string;
  name: string;
  idealDirection: string;
  actualDirection: string;
  compatibility: 'excellent' | 'good' | 'neutral' | 'poor' | 'avoid';
  benefits: string[];
  issues: string[];
}

interface VastuComplianceCheck {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export default function EnhancedVastuPage() {
  const [houseDirection, setHouseDirection] = useState<string>('east');
  const [houseType, setHouseType] = useState<string>('residential');
  const [rooms, setRooms] = useState<VastuRoom[]>([
    {
      id: '1',
      name: 'Living Room',
      idealDirection: 'Northeast',
      actualDirection: 'Northeast',
      compatibility: 'excellent',
      benefits: ['Enhances family bonding', 'Promotes positive energy'],
      issues: []
    },
    {
      id: '2',
      name: 'Kitchen',
      idealDirection: 'Southeast',
      actualDirection: 'Southeast',
      compatibility: 'excellent',
      benefits: ['Improves health', 'Brings prosperity'],
      issues: []
    },
    {
      id: '3',
      name: 'Master Bedroom',
      idealDirection: 'Southwest',
      actualDirection: 'Southwest',
      compatibility: 'excellent',
      benefits: ['Promotes stability', 'Ensures good sleep'],
      issues: []
    },
    {
      id: '4',
      name: 'Study Room',
      idealDirection: 'Northwest',
      actualDirection: 'Northeast',
      compatibility: 'good',
      benefits: ['Enhances concentration', 'Improves memory'],
      issues: ['Not in ideal direction', 'May affect focus']
    }
  ]);

  const [elements, setElements] = useState<VastuElement[]>([
    {
      id: '1',
      name: 'Main Entrance',
      direction: 'Northeast',
      element: 'Air',
      compatibility: 'excellent',
      notes: 'Welcomes positive energy'
    },
    {
      id: '2',
      name: 'Pooja Room',
      direction: 'Northeast',
      element: 'Space',
      compatibility: 'excellent',
      notes: 'Ideal for spiritual activities'
    },
    {
      id: '3',
      name: 'Water Storage',
      direction: 'Northeast',
      element: 'Water',
      compatibility: 'excellent',
      notes: 'Brings prosperity'
    },
    {
      id: '4',
      name: 'Heavy Furniture',
      direction: 'Southwest',
      element: 'Earth',
      compatibility: 'excellent',
      notes: 'Creates stability'
    }
  ]);

  const [complianceChecks, setComplianceChecks] = useState<VastuComplianceCheck[]>([
    {
      id: '1',
      title: 'Main Entrance Direction',
      description: 'Main entrance should face North, East, or Northeast for positive energy',
      status: 'compliant',
      severity: 'high',
      recommendations: ['Ensure entrance is well-lit', 'Keep entrance clean and clutter-free']
    },
    {
      id: '2',
      title: 'Kitchen Placement',
      description: 'Kitchen should be in Southeast direction representing fire element',
      status: 'compliant',
      severity: 'high',
      recommendations: ['Cook facing East for positive energy', 'Avoid placing kitchen in Northeast']
    },
    {
      id: '3',
      title: 'Master Bedroom Placement',
      description: 'Master bedroom should be in Southwest for stability',
      status: 'compliant',
      severity: 'high',
      recommendations: ['Bed should be placed in Southwest corner', 'Avoid placing bed under beams']
    },
    {
      id: '4',
      title: 'Water Tank Placement',
      description: 'Water storage should be in North, East, or Northeast',
      status: 'partial',
      severity: 'medium',
      recommendations: ['Move water storage to Northeast if possible', 'Avoid Southwest placement']
    }
  ]);

  const directions = [
    { value: 'north', label: 'North', icon: <Compass className="h-4 w-4" /> },
    { value: 'northeast', label: 'Northeast', icon: <Compass className="h-4 w-4" /> },
    { value: 'east', label: 'East', icon: <Compass className="h-4 w-4" /> },
    { value: 'southeast', label: 'Southeast', icon: <Compass className="h-4 w-4" /> },
    { value: 'south', label: 'South', icon: <Compass className="h-4 w-4" /> },
    { value: 'southwest', label: 'Southwest', icon: <Compass className="h-4 w-4" /> },
    { value: 'west', label: 'West', icon: <Compass className="h-4 w-4" /> },
    { value: 'northwest', label: 'Northwest', icon: <Compass className="h-4 w-4" /> }
  ];

  const compatibilityColors = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800',
    poor: 'bg-yellow-100 text-yellow-800',
    avoid: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    compliant: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    'non-compliant': 'bg-red-100 text-red-800'
  };

  const severityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  const updateRoomDirection = (id: string, direction: string) => {
    setRooms(rooms.map(room => 
      room.id === id ? { ...room, actualDirection: direction } : room
    ));
  };

  const calculateComplianceScore = () => {
    const compliant = complianceChecks.filter(check => check.status === 'compliant').length;
    return Math.round((compliant / complianceChecks.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-amber-800 mb-2 flex items-center justify-center gap-3">
            <Mountain className="h-10 w-10 text-amber-600" />
            Vastu Shastra Analyzer
          </h1>
          <p className="text-lg text-amber-600 max-w-3xl mx-auto">
            Comprehensive Vastu compliance analysis for harmonious living spaces based on ancient Indian architectural principles
          </p>
        </div>

        {/* House Information Card */}
        <Card className="mb-8 border-amber-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Home className="h-6 w-6" />
              Property Information
            </CardTitle>
            <CardDescription>Enter details about your property for personalized Vastu analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-amber-700">House Facing Direction</label>
                  <Select value={houseDirection} onValueChange={setHouseDirection}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      {directions.map((dir) => (
                        <SelectItem key={dir.value} value={dir.value}>
                          {dir.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-amber-700">Property Type</label>
                  <Select value={houseType} onValueChange={setHouseType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-amber-700">Property Description</label>
                <Textarea 
                  placeholder="Describe your property layout, size, and any specific concerns..." 
                  className="h-32"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Score */}
        <Card className="mb-8 border-amber-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Shield className="h-6 w-6" />
              Vastu Compliance Score
            </CardTitle>
            <CardDescription>Overall assessment of your property's Vastu compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#f3f4f6" 
                    strokeWidth="8" 
                  />
                  {/* Progress circle */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke={calculateComplianceScore() >= 80 ? "#10b981" : calculateComplianceScore() >= 60 ? "#f59e0b" : "#ef4444"} 
                    strokeWidth="8" 
                    strokeLinecap="round"
                    strokeDasharray="283" 
                    strokeDashoffset={283 - (283 * calculateComplianceScore()) / 10} 
                    transform="rotate(-90 50 50)"
                  />
                  {/* Center text */}
                  <text 
                    x="50" 
                    y="50" 
                    textAnchor="middle" 
                    dy="7" 
                    fontSize="20" 
                    fontWeight="bold"
                    fill={calculateComplianceScore() >= 80 ? "#10b981" : calculateComplianceScore() >= 60 ? "#f59e0b" : "#ef4444"}
                  >
                    {calculateComplianceScore()}%
                  </text>
                </svg>
              </div>
              <div className="mt-4 text-center">
                <p className={`text-xl font-bold ${
                  calculateComplianceScore() >= 80 ? "text-green-600" : 
                  calculateComplianceScore() >= 60 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {calculateComplianceScore() >= 80 ? "Excellent" : 
                   calculateComplianceScore() >= 60 ? "Good" : "Needs Improvement"}
                </p>
                <p className="text-gray-600 mt-1">
                  {complianceChecks.filter(c => c.status === 'compliant').length} out of {complianceChecks.length} checks compliant
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="rooms" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-amber-100 p-1">
            <TabsTrigger value="rooms" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Building className="h-4 w-4 mr-2" />
              Rooms Analysis
            </TabsTrigger>
            <TabsTrigger value="elements" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Mountain className="h-4 w-4 mr-2" />
              Elements
            </TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="report" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Eye className="h-4 w-4 mr-2" />
              Detailed Report
            </TabsTrigger>
          </TabsList>

          {/* Rooms Analysis Tab */}
          <TabsContent value="rooms">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Building className="h-6 w-6" />
                  Room Placement Analysis
                </CardTitle>
                <CardDescription>Optimize room placement based on Vastu principles</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Ideal Direction</TableHead>
                      <TableHead>Current Direction</TableHead>
                      <TableHead>Compatibility</TableHead>
                      <TableHead>Benefits</TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {room.idealDirection}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={room.actualDirection} 
                            onValueChange={(value) => updateRoomDirection(room.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {directions.map((dir) => (
                                <SelectItem key={dir.value} value={dir.value}>
                                  {dir.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge className={compatibilityColors[room.compatibility]}>
                            {room.compatibility.charAt(0).toUpperCase() + room.compatibility.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ul className="list-disc pl-4 text-sm">
                            {room.benefits.map((benefit, idx) => (
                              <li key={idx} className="text-green-700">{benefit}</li>
                            ))}
                          </ul>
                        </TableCell>
                        <TableCell>
                          {room.issues.length > 0 ? (
                            <ul className="list-disc pl-4 text-sm">
                              {room.issues.map((issue, idx) => (
                                <li key={idx} className="text-red-700">{issue}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-green-600">None</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Elements Tab */}
          <TabsContent value="elements">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Mountain className="h-6 w-6" />
                  Five Elements (Panchabhutas) Analysis
                </CardTitle>
                <CardDescription>Balance of Earth, Water, Fire, Air, and Space elements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-800">Water (Jal)</h3>
                    </div>
                    <p className="text-sm text-blue-700 mb-2">Represents flow and adaptability. Best placed in North or East.</p>
                    <div className="space-y-2">
                      {elements.filter(el => el.element === 'Water').map(el => (
                        <div key={el.id} className="bg-white p-2 rounded border">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{el.name}</span>
                            <Badge className={compatibilityColors[el.compatibility]}>
                              {el.direction}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{el.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-orange-800">Fire (Agni)</h3>
                    </div>
                    <p className="text-sm text-orange-700 mb-2">Represents energy and transformation. Best placed in South or Southeast.</p>
                    <div className="space-y-2">
                      {elements.filter(el => el.element === 'Fire').map(el => (
                        <div key={el.id} className="bg-white p-2 rounded border">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{el.name}</span>
                            <Badge className={compatibilityColors[el.compatibility]}>
                              {el.direction}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{el.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className="h-5 w-5 text-yellow-600" />
                      <h3 className="font-semibold text-yellow-800">Air (Vayu)</h3>
                    </div>
                    <p className="text-sm text-yellow-700 mb-2">Represents movement and communication. Best placed in North or Northwest.</p>
                    <div className="space-y-2">
                      {elements.filter(el => el.element === 'Air').map(el => (
                        <div key={el.id} className="bg-white p-2 rounded border">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{el.name}</span>
                            <Badge className={compatibilityColors[el.compatibility]}>
                              {el.direction}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{el.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TreePine className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">Earth (Prithvi)</h3>
                    </div>
                    <p className="text-sm text-green-700 mb-2">Represents stability and grounding. Best placed in South or Southwest.</p>
                    <div className="space-y-2">
                      {elements.filter(el => el.element === 'Earth').map(el => (
                        <div key={el.id} className="bg-white p-2 rounded border">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{el.name}</span>
                            <Badge className={compatibilityColors[el.compatibility]}>
                              {el.direction}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{el.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-purple-800">Space (Aakash)</h3>
                    </div>
                    <p className="text-sm text-purple-700 mb-2">Represents expansion and consciousness. Best placed in center or Northeast.</p>
                    <div className="space-y-2">
                      {elements.filter(el => el.element === 'Space').map(el => (
                        <div key={el.id} className="bg-white p-2 rounded border">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{el.name}</span>
                            <Badge className={compatibilityColors[el.compatibility]}>
                              {el.direction}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{el.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Shield className="h-6 w-6" />
                  Vastu Compliance Checklist
                </CardTitle>
                <CardDescription>Review and improve your property's Vastu compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {complianceChecks.map((check) => (
                    <Card key={check.id} className="border-l-4 border-l-amber-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{check.title}</h3>
                            <p className="text-gray-600 mt-1">{check.description}</p>
                            <div className="flex items-center gap-4 mt-3">
                              <Badge className={statusColors[check.status]}>
                                {check.status.replace('-', ' ')}
                              </Badge>
                              <Badge className={severityColors[check.severity]}>
                                {check.severity} severity
                              </Badge>
                            </div>
                            <div className="mt-3">
                              <h4 className="font-medium text-gray-700">Recommendations:</h4>
                              <ul className="list-disc pl-5 mt-1 space-y-1">
                                {check.recommendations.map((rec, idx) => (
                                  <li key={idx} className="text-sm text-gray-600">{rec}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Report Tab */}
          <TabsContent value="report">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Eye className="h-6 w-6" />
                  Detailed Vastu Analysis Report
                </CardTitle>
                <CardDescription>Comprehensive insights and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-amber-700">Summary</h3>
                    <p className="text-gray-700">
                      Your property has a Vastu compliance score of {calculateComplianceScore()}%. 
                      {calculateComplianceScore() >= 80 
                        ? " Excellent Vastu compliance! Your property is well-aligned with Vastu principles, promoting harmony and positive energy flow." 
                        : calculateComplianceScore() >= 60 
                        ? " Good Vastu compliance with some areas for improvement. Following our recommendations will enhance the positive energy in your space." 
                        : " Vastu compliance could be improved. Implementing our recommendations will help balance the energy flow in your property."}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-amber-700">Key Strengths</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Proper placement of main living areas in favorable directions</li>
                      <li>Good balance of the five elements in appropriate locations</li>
                      <li>Well-positioned kitchen in Southeast direction</li>
                      <li>Master bedroom in Southwest direction for stability</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-amber-700">Areas for Improvement</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Water storage placement could be optimized for better energy flow</li>
                      <li>Study room placement could be improved for better concentration</li>
                      <li>Entrance lighting and decor could be enhanced</li>
                      <li>Heavy furniture placement in Southwest for stability</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-amber-700">Recommendations</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Sun className="h-5 w-5 text-amber-600" />
                          Daily Practices
                        </h4>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>Start your day facing East for positive energy</li>
                          <li>Keep the Northeast corner of your home clean and clutter-free</li>
                          <li>Use natural lighting in the Northeast areas</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Moon className="h-5 w-5 text-amber-600" />
                          Monthly Practices
                        </h4>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>Perform a monthly space cleansing ritual</li>
                          <li>Review and adjust any furniture placement as needed</li>
                          <li>Check water storage and drainage systems</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Waves className="h-5 w-5 text-amber-600" />
                          Long-term Improvements
                        </h4>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>Consider rearranging rooms to align with ideal directions</li>
                          <li>Install proper lighting in all corners of the house</li>
                          <li>Ensure proper ventilation in all rooms</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  Download Report
                </Button>
                <Button>
                  Schedule Consultation
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Vastu Principles Section */}
        <Card className="mt-8 border-amber-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Compass className="h-6 w-6" />
              Core Vastu Principles
            </CardTitle>
            <CardDescription>Fundamental concepts for harmonious living spaces</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Compass className="h-6 w-6 text-amber-600 mt-1" />
                  <div>
                    <h3 className="font-semibold">Directional Alignment</h3>
                    <p className="text-sm text-gray-600">Each direction has specific energy characteristics that influence different aspects of life. Proper alignment enhances positive energy flow.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Ruler className="h-6 w-6 text-amber-600 mt-1" />
                  <div>
                    <h3 className="font-semibold">Proportions & Measurements</h3>
                    <p className="text-sm text-gray-600">Using specific proportions and measurements creates harmonious structures that resonate with natural forces.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mountain className="h-6 w-6 text-amber-600 mt-1" />
                  <div>
                    <h3 className="font-semibold">Five Elements Balance</h3>
                    <p className="text-sm text-gray-600">Balancing Earth, Water, Fire, Air, and Space elements creates a stable and energizing environment.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="h-6 w-6 text-amber-600 mt-1" />
                  <div>
                    <h3 className="font-semibold">Energy Flow</h3>
                    <p className="text-sm text-gray-600">Ensuring unobstructed flow of positive energy throughout the space promotes health and prosperity.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}