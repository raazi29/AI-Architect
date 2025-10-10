'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface PriceAlert {
  id: string;
  product_id: string;
  product_name: string;
  target_price: number;
  current_price: number;
  retailer: string;
  active: boolean;
  created_at: Date;
  last_notified?: Date;
}

interface PriceAlertProps {
  productId: string;
  productName: string;
  currentPrice: number;
  retailer: string;
}

export default function PriceAlert({ productId, productName, currentPrice, retailer }: PriceAlertProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState('');

  // Load existing alerts from localStorage or simulate API call
  useEffect(() => {
    const savedAlerts = localStorage.getItem(`price_alerts_${productId}`);
    if (savedAlerts) {
      try {
        const parsedAlerts = JSON.parse(savedAlerts).map((alert: any) => ({
          ...alert,
          created_at: new Date(alert.created_at),
          last_notified: alert.last_notified ? new Date(alert.last_notified) : undefined
        }));
        setAlerts(parsedAlerts);
      } catch (e) {
        console.error('Error parsing saved alerts', e);
      }
    }
  }, [productId]);

  // Check if current price is below target and trigger notification
  useEffect(() => {
    const activeAlerts = alerts.filter(alert => alert.active);
    activeAlerts.forEach(alert => {
      if (currentPrice <= alert.target_price && alert.active) {
        // Trigger notification
        setMessage(`Price dropped! ${productName} is now ₹${currentPrice.toLocaleString('en-IN')} (below your target of ₹${alert.target_price.toLocaleString('en-IN')})`);
        
        // Update alert with notification timestamp
        const updatedAlerts = alerts.map(a => 
          a.id === alert.id ? { ...a, last_notified: new Date(), active: false } : a
        );
        setAlerts(updatedAlerts);
        localStorage.setItem(`price_alerts_${productId}`, JSON.stringify(updatedAlerts));
      }
    });
  }, [currentPrice, alerts, productName, productId]);

  const handleCreateAlert = () => {
    if (targetPrice <= 0 || targetPrice >= currentPrice) {
      setMessage('Target price must be lower than current price');
      return;
    }

    setIsCreating(true);
    
    // Simulate API call to create alert
    setTimeout(() => {
      const newAlert: PriceAlert = {
        id: `alert_${Date.now()}`,
        product_id: productId,
        product_name: productName,
        target_price: targetPrice,
        current_price: currentPrice,
        retailer: retailer,
        active: true,
        created_at: new Date()
      };

      const updatedAlerts = [...alerts, newAlert];
      setAlerts(updatedAlerts);
      localStorage.setItem(`price_alerts_${productId}`, JSON.stringify(updatedAlerts));
      
      setMessage(`Alert created! You'll be notified when ${productName} drops to ₹${targetPrice.toLocaleString('en-IN')}`);
      setTargetPrice(0);
      setIsCreating(false);
    }, 500);
  };

  const handleRemoveAlert = (alertId: string) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    setAlerts(updatedAlerts);
    localStorage.setItem(`price_alerts_${productId}`, JSON.stringify(updatedAlerts));
    setMessage('Alert removed');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Price Alerts
        </CardTitle>
        <CardDescription>
          Get notified when prices drop below your target
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {message && (
            <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Label htmlFor="targetPrice">Target Price (₹)</Label>
              <Input
                id="targetPrice"
                type="number"
                value={targetPrice || ''}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                placeholder="Enter target price"
                min="1"
                max={currentPrice - 1}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Current price: {formatCurrency(currentPrice)}
              </p>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleCreateAlert} 
                disabled={isCreating || targetPrice <= 0 || targetPrice >= currentPrice}
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Set Alert'}
              </Button>
            </div>
          </div>
          
          {alerts.length > 0 && (
            <div className="space-y-3 mt-4">
              <h4 className="font-medium">Your Alerts</h4>
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-lg border ${
                    currentPrice <= alert.target_price 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(alert.target_price)}</span>
                        {currentPrice <= alert.target_price && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Triggered!
                          </Badge>
                        )}
                        {alert.active && currentPrice > alert.target_price && (
                          <Badge variant="outline">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Set for {formatCurrency(alert.current_price)} (current)
                      </p>
                      {alert.last_notified && (
                        <p className="text-xs text-muted-foreground">
                          Notified: {alert.last_notified.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAlert(alert.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  {currentPrice <= alert.target_price && (
                    <div className="mt-2 p-2 bg-green-100 rounded text-sm flex items-start gap-2">
                      <TrendingDown className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                      <span>
                        Price has dropped to {formatCurrency(currentPrice)} - below your target!
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>Alerts are stored locally in your browser</p>
      </CardFooter>
    </Card>
  );
}