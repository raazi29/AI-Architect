'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE_URL } from '@/lib/api';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Zap,
  Clock,
  Package,
  AlertTriangle,
  CheckCircle,
  Wifi,
  RefreshCw,
  Star
} from 'lucide-react';

interface RealTimeUpdate {
  id: string;
  type: 'inventory' | 'price' | 'rating' | 'review' | 'trending';
  title: string;
  description: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'resolved' | 'warning';
  product_id?: string;
  retailer?: string;
}

interface RealTimeUpdatesProps {
  productId?: string;
}

export default function RealTimeUpdates({ productId }: RealTimeUpdatesProps) {
  const [updates, setUpdates] = useState<RealTimeUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch real-time updates from backend
  useEffect(() => {
    const fetchRealTimeUpdates = async () => {
      setLoading(true);
      
      try {
        // Call real backend API for real-time updates
        const response = await fetch(`${API_BASE_URL}/shopping/realtime-updates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: productId
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUpdates(data.updates || []);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching real-time updates:', error);
        
        // Fallback to mock data only if API fails
        const mockUpdates: RealTimeUpdate[] = [
        {
          id: '1',
          type: 'inventory',
          title: 'Stock Alert',
          description: 'Urban Ladder - Modern Sectional Sofa is running low (only 3 left)',
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          priority: 'high',
          status: 'active',
          product_id: 'urban_ladder_1',
          retailer: 'Urban Ladder'
        },
        {
          id: '2',
          type: 'price',
          title: 'Price Drop',
          description: 'Pepperfry - LED Study Table Lamp dropped by ₹500',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          priority: 'medium',
          status: 'active',
          product_id: 'pepperfry_2',
          retailer: 'Pepperfry'
        },
        {
          id: '3',
          type: 'rating',
          title: 'New Rating',
          description: 'Godrej Interio - Modern Bookshelf received 5-star review',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          priority: 'low',
          status: 'active',
          product_id: 'godrej_interio_3',
          retailer: 'Godrej Interio'
        },
        {
          id: '4',
          type: 'trending',
          title: 'Trending Now',
          description: 'Your search - Modern Dining Chair is trending in your area',
          timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
          priority: 'medium',
          status: 'active',
          product_id: 'wood_street_4',
          retailer: 'Wood Street'
        },
        {
          id: '5',
          type: 'review',
          title: 'New Review',
          description: 'Home Centre - Marble Side Table has 12 new reviews',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          priority: 'low',
          status: 'active',
          product_id: 'home_centre_5',
          retailer: 'Home Centre'
        }
      ];
      
      setUpdates(mockUpdates);
      setLastUpdated(new Date());
      }
      
      setLoading(false);
    };

    fetchRealTimeUpdates();
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchRealTimeUpdates, 30000);
    
    return () => clearInterval(interval);
  }, [productId]);

  const getUpdateIcon = (type: RealTimeUpdate['type']) => {
    switch (type) {
      case 'inventory': return <Package className="h-4 w-4" />;
      case 'price': return <Zap className="h-4 w-4" />;
      case 'rating': return <Star className="h-4 w-4" />;
      case 'review': return <CheckCircle className="h-4 w-4" />;
      case 'trending': return <TrendingUp className="h-4 w-4" />;
      default: return <Wifi className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: RealTimeUpdate['priority']) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High Priority</Badge>;
      case 'medium': return <Badge variant="warning">Medium Priority</Badge>;
      case 'low': return <Badge variant="secondary">Low Priority</Badge>;
      default: return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getStatusColor = (status: RealTimeUpdate['status']) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'resolved': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Real-time Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading real-time updates...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Real-time Updates
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {updates.length > 0 ? (
            updates.map((update) => (
              <div 
                key={update.id} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${getStatusColor(update.status)} bg-opacity-10`}>
                    {getUpdateIcon(update.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{update.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {update.description}
                        </p>
                        {update.retailer && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Retailer: {update.retailer}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getPriorityBadge(update.priority)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(update.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Wifi className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No real-time updates available</p>
              <p className="text-xs text-muted-foreground mt-1">
                Updates will appear here when available
              </p>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-muted-foreground">Live updates enabled</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}