# India Localization Service

## ✅ Complete Implementation

A comprehensive service for Indian-specific formatting, calculations, and utilities.

## 🎯 Features

### 1. Currency Formatting

**Indian Numbering System (Lakhs & Crores)**

```typescript
import { formatIndianCurrency } from '@/lib/services/IndiaLocalizationService';

// Full format
formatIndianCurrency(150000);        // "₹1,50,000.00"
formatIndianCurrency(10000000);      // "₹1,00,00,000.00"

// Short form
formatIndianCurrency(150000, { shortForm: true });     // "₹1.5L"
formatIndianCurrency(10000000, { shortForm: true });   // "₹1.0Cr"
formatIndianCurrency(5000, { shortForm: true });       // "₹5.0K"

// Without symbol
formatIndianCurrency(100000, { showSymbol: false });   // "1,00,000.00"

// Custom decimals
formatIndianCurrency(100000, { decimals: 0 });         // "₹1,00,000"
```

### 2. Amount to Words

```typescript
import { amountToWords } from '@/lib/services/IndiaLocalizationService';

amountToWords(100);          // "One Hundred Rupees"
amountToWords(100000);       // "One Lakh Rupees"
amountToWords(10000000);     // "One Crore Rupees"
amountToWords(1234567);      // "Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven Rupees"
```

### 3. GST Calculations

**Predefined GST Rates**

```typescript
import { GST_RATES, getGSTRate } from '@/lib/services/IndiaLocalizationService';

// Available rates
GST_RATES.CEMENT              // 28%
GST_RATES.STEEL               // 18%
GST_RATES.BRICKS              // 12%
GST_RATES.SAND                // 5%
GST_RATES.PAINT               // 28%
GST_RATES.ELECTRICAL          // 18%
GST_RATES.PLUMBING            // 18%
GST_RATES.TILES               // 28%
GST_RATES.WOOD                // 18%
GST_RATES.LABOR               // 18%
GST_RATES.PROFESSIONAL_SERVICES // 18%
GST_RATES.DEFAULT             // 18%

// Get rate for category
getGSTRate('CEMENT');         // 28
getGSTRate('STEEL');          // 18
getGSTRate('UNKNOWN');        // 18 (default)
```

**Calculate GST**

```typescript
import { calculateGST, calculateWithGST } from '@/lib/services/IndiaLocalizationService';

// Simple GST calculation
calculateGST(1000, 18);       // 180

// Full breakdown
const result = calculateWithGST(1000, 18);
// {
//   baseAmount: 1000,
//   gstRate: 18,
//   gstAmount: 180,
//   totalAmount: 1180,
//   formatted: {
//     base: "₹1,000.00",
//     gst: "₹180.00",
//     total: "₹1,180.00"
//   }
// }
```

**Reverse Calculate (from inclusive amount)**

```typescript
import { calculateBaseFromInclusive } from '@/lib/services/IndiaLocalizationService';

// If total is ₹1,180 (including 18% GST), what's the base?
calculateBaseFromInclusive(1180, 18);  // 1000
```

### 4. Date Formatting

**Indian Date Format (DD/MM/YYYY)**

```typescript
import { formatIndianDate, parseIndianDate } from '@/lib/services/IndiaLocalizationService';

// Format to Indian format
formatIndianDate(new Date('2024-01-15'));  // "15/01/2024"
formatIndianDate('2024-01-15');            // "15/01/2024"

// Parse Indian format
const date = parseIndianDate('15/01/2024');
// Date object: 2024-01-15
```

**Financial Year**

```typescript
import { getFinancialYear } from '@/lib/services/IndiaLocalizationService';

// Financial year starts from April
getFinancialYear(new Date('2024-04-01'));  // "2024-25"
getFinancialYear(new Date('2024-03-31'));  // "2023-24"
getFinancialYear();                        // Current FY
```

### 5. Validation

**GST Number Validation**

```typescript
import { validateGSTNumber } from '@/lib/services/IndiaLocalizationService';

validateGSTNumber('27ABCDE1234F1Z5');
// { valid: true }

validateGSTNumber('INVALID');
// { valid: false, message: "Invalid GST number format" }
```

**Mobile Number Validation**

```typescript
import { validateIndianMobile, formatIndianMobile } from '@/lib/services/IndiaLocalizationService';

// Validate
validateIndianMobile('9876543210');
// { valid: true }

validateIndianMobile('1234567890');
// { valid: false, message: "Invalid Indian mobile number" }

// Format
formatIndianMobile('9876543210');  // "+91 98765 43210"
```

### 6. Indian States

```typescript
import { getIndianStates } from '@/lib/services/IndiaLocalizationService';

const states = getIndianStates();
// [
//   { code: '01', name: 'Jammu and Kashmir' },
//   { code: '27', name: 'Maharashtra' },
//   { code: '29', name: 'Karnataka' },
//   ...
// ]
```

## 📊 Usage Examples

### Example 1: Material Cost with GST

```typescript
import { calculateWithGST, getGSTRate } from '@/lib/services/IndiaLocalizationService';

const materialCost = 50000;
const gstRate = getGSTRate('CEMENT');  // 28%

const breakdown = calculateWithGST(materialCost, gstRate);

console.log(`Base: ${breakdown.formatted.base}`);      // "₹50,000.00"
console.log(`GST (${gstRate}%): ${breakdown.formatted.gst}`);  // "₹14,000.00"
console.log(`Total: ${breakdown.formatted.total}`);    // "₹64,000.00"
```

### Example 2: Invoice Display

```typescript
import { formatIndianCurrency, amountToWords } from '@/lib/services/IndiaLocalizationService';

const invoiceAmount = 125000;

console.log(`Amount: ${formatIndianCurrency(invoiceAmount)}`);
// "₹1,25,000.00"

console.log(`In Words: ${amountToWords(invoiceAmount)}`);
// "One Lakh Twenty Five Thousand Rupees"
```

### Example 3: Project Budget Display

```typescript
import { formatIndianCurrency } from '@/lib/services/IndiaLocalizationService';

const budget = 25000000;

// Full format for detailed view
console.log(formatIndianCurrency(budget));
// "₹2,50,00,000.00"

// Short form for dashboard
console.log(formatIndianCurrency(budget, { shortForm: true }));
// "₹2.5Cr"
```

## 🧪 Testing

All functions are fully tested with 23 test cases covering:

- ✅ Currency formatting (lakhs, crores, short form)
- ✅ Indian number formatting
- ✅ Amount to words conversion
- ✅ GST calculations
- ✅ Date formatting and parsing
- ✅ Financial year calculation
- ✅ GST number validation
- ✅ Mobile number validation
- ✅ Indian states data

Run tests:
```bash
npm run test:run -- tests/services/IndiaLocalizationService.test.ts
```

## 📝 Type Safety

All functions are fully typed with TypeScript:

```typescript
// Material categories are type-safe
type MaterialCategory = 
  | 'CEMENT' 
  | 'STEEL' 
  | 'BRICKS' 
  | 'SAND' 
  | 'PAINT' 
  | 'ELECTRICAL' 
  | 'PLUMBING' 
  | 'TILES' 
  | 'WOOD' 
  | 'GLASS' 
  | 'HARDWARE' 
  | 'LABOR' 
  | 'PROFESSIONAL_SERVICES' 
  | 'DEFAULT';
```

## 🎨 UI Integration

Use with React components:

```tsx
import { formatIndianCurrency } from '@/lib/services/IndiaLocalizationService';

function BudgetDisplay({ amount }: { amount: number }) {
  return (
    <div>
      <span className="text-2xl font-bold">
        {formatIndianCurrency(amount)}
      </span>
      <span className="text-sm text-muted-foreground ml-2">
        {formatIndianCurrency(amount, { shortForm: true })}
      </span>
    </div>
  );
}
```

## 🌍 Localization Features

- **Number System**: Indian (lakhs, crores) vs Western (millions, billions)
- **Date Format**: DD/MM/YYYY (Indian) vs MM/DD/YYYY (US)
- **Currency Symbol**: ₹ (Rupee)
- **Financial Year**: April to March
- **GST Rates**: India-specific tax rates
- **Mobile Format**: +91 prefix with Indian numbering
- **States**: All Indian states and union territories

## 🚀 Performance

- **Fast**: All calculations are O(1) or O(n) where n is string length
- **Lightweight**: No external dependencies
- **Tree-shakeable**: Import only what you need
- **Type-safe**: Full TypeScript support

## 📦 Export

The service exports both named exports and a default object:

```typescript
// Named exports (recommended)
import { formatIndianCurrency, calculateGST } from '@/lib/services/IndiaLocalizationService';

// Default export
import IndiaLocalizationService from '@/lib/services/IndiaLocalizationService';
IndiaLocalizationService.formatIndianCurrency(100000);
```

## ✨ Next Steps

This service is ready to be integrated into:
- Project management forms
- Material cost calculators
- Expense tracking
- Invoice generation
- Budget displays
- Financial reports

See Task 2.2 for climate-zone and regional material suggestions implementation.
