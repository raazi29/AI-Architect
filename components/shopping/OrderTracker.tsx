'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  image: string;
 quantity: number;
 price: number;
}

interface OrderStatus {
  id: string;
  status: 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  timestamp: Date;
  location?: string;
  estimated_delivery?: Date;
}

interface Order {
  id: string;
  order_number: string;
  items: OrderItem[];
  total_amount: number;
 retailer: string;
 status: 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  order_date: Date;
  estimated_delivery?: Date;
  current_location?: string;
  status_history: OrderStatus[];
}

interface OrderTrackerProps {
  orderId?: string;
  order?: Order;
}

export default function OrderTracker({ orderId, order: propOrder }: OrderTrackerProps) {
  const [order, setOrder] = useState<Order | null>(propOrder || null);
  const [loading, setLoading] = useState(!propOrder);
  const [progress, setProgress] = useState(0);

  // Mock order data if not provided
  useEffect(() => {
    if (!propOrder && orderId) {
      // Simulate API call to fetch order details
      const fetchOrder = async () => {
        setLoading(true);
        
        // Mock data
        const mockOrder: Order = {
          id: orderId,
          order_number: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
          items: [
            {
              id: 'item-1',
              name: 'Modern Sectional Sofa',
              image: '/modern-sofa.png',
              quantity: 1,
              price: 12999,
            },
            {
              id: 'item-2',
              name: 'LED Study Table Lamp',
              image: '/modern-floor-lamp.png',
              quantity: 2,
              price: 1999,
            }
          ],
          total_amount: 16997,
          retailer: 'Urban Ladder',
          status: 'shipped',
          order_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 1000), // 3 days from now
          current_location: 'Mumbai, Maharashtra',
          status_history: [
            {
              id: '1',
              status: 'processing',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
              id: '2',
              status: 'shipped',
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 1000),
              location: 'Mumbai, Maharashtra',
            },
            {
              id: '3',
              status: 'out_for_delivery',
              timestamp: new Date(Date.now()),
              location: 'Delhi, India',
              estimated_delivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            }
          ]
        };
        
        setOrder(mockOrder);
        setLoading(false);
      };
      
      fetchOrder();
    }
 }, [orderId, propOrder]);

  // Calculate progress based on status
 useEffect(() => {
    if (order) {
      switch (order.status) {
        case 'processing':
          setProgress(25);
          break;
        case 'shipped':
          setProgress(50);
          break;
        case 'out_for_delivery':
          setProgress(75);
          break;
        case 'delivered':
          setProgress(100);
          break;
        default:
          setProgress(0);
      }
    }
  }, [order]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading order details...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">No order found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'processing':
        return { label: 'Processing', icon: Clock, color: 'bg-blue-500', description: 'Your order is being processed' };
      case 'shipped':
        return { label: 'Shipped', icon: Truck, color: 'bg-blue-500', description: 'Your order has been shipped' };
      case 'out_for_delivery':
        return { label: 'Out for Delivery', icon: Truck, color: 'bg-orange-500', description: 'On the way to your location' };
      case 'delivered':
        return { label: 'Delivered', icon: CheckCircle, color: 'bg-green-500', description: 'Successfully delivered' };
      case 'cancelled':
        return { label: 'Cancelled', icon: Package, color: 'bg-red-500', description: 'Order was cancelled' };
      default:
        return { label: 'Unknown', icon: Package, color: 'bg-gray-500', description: 'Status unknown' };
    }
  };

  const statusInfo = getStatusInfo(order.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Order Tracking</CardTitle>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Order #{order.order_number}</p>
            <p className="text-xs text-muted-foreground">{order.retailer}</p>
          </div>
          <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}>
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {statusInfo.icon && <statusInfo.icon className={`h-4 w-4 ${statusInfo.color.replace('bg', 'text')}`} />}
            <span>{statusInfo.description}</span>
          </div>
          
          {order.estimated_delivery && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Estimated delivery: {order.estimated_delivery.toLocaleDateString()}</span>
            </div>
          )}
          
          {order.current_location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Current location: {order.current_location}</span>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Order Timeline</h4>
            <div className="space-y-3">
              {order.status_history.map((status, index) => {
                const statusInfo = getStatusInfo(status.status as Order['status']);
                const statusColor = getStatusInfo(status.status as Order['status']).color;
                
                return (
                  <div key={status.id} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColor} text-white`}>
                      {statusInfo.icon && <statusInfo.icon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="font-medium capitalize">{status.status.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {status.timestamp.toLocaleString()} 
                        {status.location && ` • ${status.location}`}
                      </p>
                      {status.estimated_delivery && (
                        <p className="text-xs text-muted-foreground">
                          Estimated: {status.estimated_delivery.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}