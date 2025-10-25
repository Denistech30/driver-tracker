// Currency formatting utilities with support for common invalid currency codes

// Map common invalid currency codes to valid ISO 4217 codes
const CURRENCY_CODE_MAP: Record<string, string> = {
  'FCFA': 'XAF', // Central African CFA franc
  'CFA': 'XOF',  // West African CFA franc
  'CFP': 'XPF',  // CFP franc
};

/**
 * Format currency amount with proper fallback handling
 * @param amount - The amount to format
 * @param currency - The currency code (can be invalid)
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string {
  try {
    // Map invalid currency codes to valid ones
    const validCurrency = CURRENCY_CODE_MAP[currency] || currency;
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: validCurrency,
    }).format(amount);
  } catch (error) {
    // If currency is still invalid, try with USD
    try {
      console.warn(`Invalid currency code: ${currency}. Falling back to USD.`);
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    } catch (fallbackError) {
      // Last resort: format as number with currency symbol
      console.error(`Currency formatting failed for ${currency}. Using basic formatting.`);
      return `${currency} ${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }
}

/**
 * Get the currency symbol for a given currency code
 * @param currency - The currency code
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Currency symbol or the currency code if symbol cannot be determined
 */
export function getCurrencySymbol(currency: string = 'USD', locale: string = 'en-US'): string {
  try {
    const validCurrency = CURRENCY_CODE_MAP[currency] || currency;
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: validCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    // Format 0 and extract the symbol
    const formatted = formatter.format(0);
    const symbol = formatted.replace(/[\d\s,]/g, '');
    return symbol || currency;
  } catch (error) {
    return currency;
  }
}

/**
 * Validate if a currency code is supported by Intl.NumberFormat
 * @param currency - The currency code to validate
 * @returns true if valid, false otherwise
 */
export function isValidCurrencyCode(currency: string): boolean {
  try {
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: CURRENCY_CODE_MAP[currency] || currency,
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get a list of commonly supported currency codes
 */
export const COMMON_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
] as const;
