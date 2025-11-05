'use client';

import { IndiaLocalizationService } from '@/lib/services/indiaLocalizationService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface IndianCurrencyFormatterProps {
  amount: number;
  showGST?: boolean;
  gstRate?: number;
  label?: string;
  compact?: boolean;
  showBreakdown?: boolean;
  variant?: 'default' | 'card' | 'inline';
  trend?: 'up' | 'down' | 'neutral';
  trendPercentage?: number;
}

export function IndianCurrencyFormatter({
  amount,
  showGST = false,
  gstRate = 18,
  label,
  compact = false,
  showBreakdown = false,
  variant = 'inline',
  trend,
  trendPercentage,
}: IndianCurrencyFormatterProps) {
  const gstCalc = showGST
    ? IndiaLocalizationService.calculateGST(amount, 'default')
    : null;

  const displayAmount = showGST && gstCalc ? gstCalc.totalAmount : amount;
  const formattedAmount = IndiaLocalizationService.formatCurrency(displayAmount, { compact });

  if (variant === 'card') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {label && <p className="text-sm text-muted-foreground">{label}</p>}
            
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{formattedAmount}</p>
              {trend && (
                <div className="flex items-center gap-1">
                  {trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : null}
                  {trendPercentage !== undefined && (
                    <span
                      className={`text-sm font-medium ${
                        trend === 'up'
                          ? 'text-green-500'
                          : trend === 'down'
                          ? 'text-red-500'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {trendPercentage > 0 ? '+' : ''}
                      {trendPercentage.toFixed(1)}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {showGST && gstCalc && showBreakdown && (
              <div className="space-y-1 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Amount:</span>
                  <span className="font-medium">
                    {IndiaLocalizationService.formatCurrency(gstCalc.baseAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST ({gstCalc.gstRate}%):</span>
                  <span className="font-medium">
                    {IndiaLocalizationService.formatCurrency(gstCalc.gstAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pl-4">
                  <span>CGST:</span>
                  <span>{IndiaLocalizationService.formatCurrency(gstCalc.breakdown.cgst)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pl-4">
                  <span>SGST:</span>
                  <span>{IndiaLocalizationService.formatCurrency(gstCalc.breakdown.sgst)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                  <span>Total Amount:</span>
                  <span>{IndiaLocalizationService.formatCurrency(gstCalc.totalAmount)}</span>
                </div>
              </div>
            )}

            {showGST && gstCalc && !showBreakdown && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                      <Info className="h-3 w-3" />
                      <span>Includes GST @ {gstCalc.gstRate}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p>Base: {IndiaLocalizationService.formatCurrency(gstCalc.baseAmount)}</p>
                      <p>GST: {IndiaLocalizationService.formatCurrency(gstCalc.gstAmount)}</p>
                      <p className="font-semibold">
                        Total: {IndiaLocalizationService.formatCurrency(gstCalc.totalAmount)}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="font-semibold">{formattedAmount}</span>
        {showGST && gstCalc && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-help">
                  +GST {gstCalc.gstRate}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1 text-xs">
                  <p>Base: {IndiaLocalizationService.formatCurrency(gstCalc.baseAmount)}</p>
                  <p>GST: {IndiaLocalizationService.formatCurrency(gstCalc.gstAmount)}</p>
                  <p className="font-semibold pt-1 border-t">
                    Total: {IndiaLocalizationService.formatCurrency(gstCalc.totalAmount)}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {trend && (
          <div className="flex items-center gap-0.5">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-red-500" />
            ) : null}
            {trendPercentage !== undefined && (
              <span
                className={`text-xs ${
                  trend === 'up'
                    ? 'text-green-500'
                    : trend === 'down'
                    ? 'text-red-500'
                    : 'text-muted-foreground'
                }`}
              >
                {trendPercentage > 0 ? '+' : ''}
                {trendPercentage.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="space-y-1">
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
      <p className="text-2xl font-bold">{formattedAmount}</p>
      {showGST && gstCalc && (
        <p className="text-xs text-muted-foreground">
          Includes GST @ {gstCalc.gstRate}% (₹
          {IndiaLocalizationService.formatCurrency(gstCalc.gstAmount, { showSymbol: false })})
        </p>
      )}
    </div>
  );
}

// Utility component for displaying GST breakdown
export function GSTBreakdown({ amount, category }: { amount: number; category: string }) {
  const gstCalc = IndiaLocalizationService.calculateGST(amount, category);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b">
            <IndianRupee className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">GST Breakdown</h3>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Base Amount:</span>
              <span className="font-medium">
                {IndiaLocalizationService.formatCurrency(gstCalc.baseAmount)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">GST Rate:</span>
              <Badge variant="secondary">{gstCalc.gstRate}%</Badge>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">GST Amount:</span>
              <span className="font-medium">
                {IndiaLocalizationService.formatCurrency(gstCalc.gstAmount)}
              </span>
            </div>

            <div className="pl-4 space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>CGST (Central):</span>
                <span>{IndiaLocalizationService.formatCurrency(gstCalc.breakdown.cgst)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>SGST (State):</span>
                <span>{IndiaLocalizationService.formatCurrency(gstCalc.breakdown.sgst)}</span>
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Total Amount:</span>
              <span className="text-lg font-bold text-primary">
                {IndiaLocalizationService.formatCurrency(gstCalc.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
