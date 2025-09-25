'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EMICalculatorProps {
  price: number;
}

export const EMICalculator = ({ price }: EMICalculatorProps) => {
  const [downPayment, setDownPayment] = useState(0);
  const [tenure, setTenure] = useState(3); // in months
  const [interestRate, setInterestRate] = useState(12); // annual interest rate

  const calculateEMI = () => {
    const principal = price - downPayment;
    if (principal <= 0 || tenure <= 0) return 0;
    
    const monthlyRate = interestRate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
    return emi;
  };

  const emi = calculateEMI();
  const totalAmount = emi * tenure;
  const interestAmount = totalAmount - (price - downPayment);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">EMI Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="downPayment">Down Payment (₹)</Label>
            <Input
              id="downPayment"
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              className="mt-1"
              min="0"
              max={price}
            />
          </div>
          
          <div>
            <Label htmlFor="tenure">Tenure (months)</Label>
            <Select value={tenure.toString()} onValueChange={(v) => setTenure(Number(v))}>
              <SelectTrigger id="tenure" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 6, 9, 12, 18, 24].map(month => (
                  <SelectItem key={month} value={month.toString()}>{month} months</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="interestRate">Interest Rate (%)</Label>
            <Input
              id="interestRate"
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="mt-1"
              min="0"
              max="10"
              step="0.1"
            />
          </div>
          
          <div>
            <Label htmlFor="monthlyEmi">Monthly EMI (₹)</Label>
            <div
              id="monthlyEmi"
              className="mt-1 p-2 bg-muted rounded-md text-lg font-semibold"
            >
              ₹{emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <div className="p-2 bg-muted rounded">
            <div className="text-muted-foreground">Principal</div>
            <div className="font-medium">₹{(price - downPayment).toLocaleString('en-IN')}</div>
          </div>
          <div className="p-2 bg-muted rounded">
            <div className="text-muted-foreground">Interest</div>
            <div className="font-medium">₹{interestAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="p-2 bg-muted rounded">
            <div className="text-muted-foreground">Total Amount</div>
            <div className="font-medium">₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};