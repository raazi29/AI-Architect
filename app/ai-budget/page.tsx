'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  IndianRupee, 
  TrendingUp, 
  AlertTriangle, 
  Info,
  Clock,
  PieChart,
  RefreshCw,
  Download,
  Share2,
  Calendar,
  CreditCard,
  Building,
  Users
} from 'lucide-react';

interface RoomType {
  value: string;
  label: string;
}

interface DesignStyle {
  value: string;
  label: string;
}

interface BudgetPrediction {
  total_budget?: {
    minimum: number;
    average: number;
    maximum: number;
    currency: string;
  };
  category_breakdown?: any;
  timeline?: any;
  cost_factors?: any;
  savings_tips?: string[];
  payment_schedule?: any;
  indian_market_insights?: any;
  error?: boolean;
  message?: string;
  raw_response?: string;
}

const AIBudgetPage = () => {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [designStyles, setDesignStyles] = useState<DesignStyle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<BudgetPrediction | null>(null);

  // Form state
  const [roomType, setRoomType] = useState('');
  const [style, setStyle] = useState('');
  const [roomSize, setRoomSize] = useState('');
  const [materials, setMaterials] = useState<string[]>([]);
  const [renovationScope, setRenovationScope] = useState('');
  const [location, setLocation] = useState('India');
  const [materialInput, setMaterialInput] = useState('');

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

  const addMaterial = () => {
    if (materialInput.trim() && !materials.includes(materialInput.trim())) {
      setMaterials([...materials, materialInput.trim()]);
      setMaterialInput('');
    }
  };

  const removeMaterial = (material: string) => {
    setMaterials(materials.filter(m => m !== material));
  };

  const getBudgetPrediction = async () => {
    if (!roomType || !style || !roomSize || !renovationScope || materials.length === 0) {
      setError('Please fill in all required fields and add at least one material');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8001/ai/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_type: roomType,
          style: style,
          room_size: parseFloat(roomSize),
          materials: materials,
          renovation_scope: renovationScope,
          location: location
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get budget prediction');
      }

      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      setError('Failed to get budget prediction. Please try again.');
      console.error('Error getting budget prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            AI Budget Planner
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Get AI-powered cost estimation based on room size, style, and selected materials
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
            <Calculator className="h-5 w-5 text-green-500" />
            Project Details
          </CardTitle>
          <CardDescription>
            Provide your project specifications to get accurate budget predictions
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
              <Label htmlFor="renovation-scope">Renovation Scope *</Label>
              <Select value={renovationScope} onValueChange={setRenovationScope}>
                <SelectTrigger>
                  <SelectValue placeholder="Select renovation scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Renovation - Complete overhaul</SelectItem>
                  <SelectItem value="partial">Partial Renovation - Major updates</SelectItem>
                  <SelectItem value="refresh">Refresh - Cosmetic changes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Mumbai, Delhi, Bangalore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* Materials Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="materials">Materials & Finishes *</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Add materials you plan to use (e.g., marble flooring, wooden cabinets, LED lights)
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter material name"
                  value={materialInput}
                  onChange={(e) => setMaterialInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMaterial()}
                />
                <Button type="button" onClick={addMaterial} variant="outline">
                  Add
                </Button>
              </div>
            </div>

            {materials.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Materials ({materials.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {materials.map((material, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => removeMaterial(material)}
                    >
                      {material} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={getBudgetPrediction} 
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Calculating Budget...' : 'Get Budget Prediction'}
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
      {prediction && (
        <div className="space-y-6">
          {prediction.error ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{prediction.message}</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Total Budget Overview */}
              {prediction.total_budget && (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IndianRupee className="h-6 w-6 text-green-600" />
                      Total Budget Estimate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 bg-white rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Minimum</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(prediction.total_budget.minimum)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border-2 border-green-200">
                        <p className="text-sm text-muted-foreground mb-1">Average (Recommended)</p>
                        <p className="text-3xl font-bold text-green-700">
                          {formatCurrency(prediction.total_budget.average)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Maximum</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(prediction.total_budget.maximum)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Category Breakdown */}
              {prediction.category_breakdown && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-blue-500" />
                      Budget Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(prediction.category_breakdown).map(([category, data]: [string, any]) => (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{data.percentage}%</span>
                              <span className="font-semibold">{formatCurrency(data.amount)}</span>
                            </div>
                          </div>
                          <Progress value={data.percentage} className="h-2" />
                          
                          {data.details && (
                            <div className="ml-4 space-y-1">
                              {Object.entries(data.details).map(([item, amount]: [string, any]) => (
                                <div key={item} className="flex justify-between text-sm text-muted-foreground">
                                  <span>• {item.replace('_', ' ')}</span>
                                  <span>{formatCurrency(amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              {prediction.timeline && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      Project Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <p className="font-medium">Planning Phase</p>
                        <p className="text-sm text-muted-foreground">{prediction.timeline.planning_phase}</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Building className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <p className="font-medium">Execution Phase</p>
                        <p className="text-sm text-muted-foreground">{prediction.timeline.execution_phase}</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                        <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <p className="font-medium">Total Duration</p>
                        <p className="text-sm text-muted-foreground">{prediction.timeline.total_duration}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Schedule */}
              {prediction.payment_schedule && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-indigo-500" />
                      Payment Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {prediction.payment_schedule.advance && (
                        <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                          <div>
                            <p className="font-medium">Advance Payment</p>
                            <p className="text-sm text-muted-foreground">{prediction.payment_schedule.advance.timing}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(prediction.payment_schedule.advance.amount)}</p>
                            <p className="text-sm text-muted-foreground">{prediction.payment_schedule.advance.percentage}%</p>
                          </div>
                        </div>
                      )}
                      
                      {prediction.payment_schedule.progress_payments?.map((payment: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Progress Payment {index + 1}</p>
                            <p className="text-sm text-muted-foreground">{payment.milestone}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-muted-foreground">{payment.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cost Factors */}
              {prediction.cost_factors && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-orange-500" />
                      Cost Factors Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.entries(prediction.cost_factors).map(([factor, description]: [string, any]) => (
                        <div key={factor} className="p-4 bg-orange-50 rounded-lg">
                          <h4 className="font-medium capitalize mb-2">{factor.replace('_', ' ')}</h4>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Savings Tips */}
              {prediction.savings_tips && (
                <Card className="border-0 shadow-lg bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-yellow-600" />
                      Money-Saving Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {prediction.savings_tips.map((tip: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                            {index + 1}
                          </div>
                          <p className="text-sm">{tip}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Indian Market Insights */}
              {prediction.indian_market_insights && (
                <Card className="border-0 shadow-lg bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Indian Market Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(prediction.indian_market_insights).map(([key, value]: [string, any]) => (
                        <div key={key} className="p-4 bg-white rounded-lg border border-blue-200">
                          <h4 className="font-medium capitalize mb-2">{key.replace('_', ' ')}</h4>
                          <p className="text-sm text-muted-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Raw Response Fallback */}
              {prediction.raw_response && !prediction.total_budget && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>AI Budget Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                        {prediction.raw_response}
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

export default AIBudgetPage;
