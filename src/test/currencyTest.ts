// Quick test for currency formatting
import { formatCurrency, isValidCurrencyCode } from '../lib/currencyUtils';

// Test the currency formatting with FCFA
console.log('Testing currency formatting:');
console.log('FCFA 1000:', formatCurrency(1000, 'FCFA'));
console.log('CFA 1000:', formatCurrency(1000, 'CFA'));
console.log('USD 1000:', formatCurrency(1000, 'USD'));
console.log('Invalid currency:', formatCurrency(1000, 'INVALID'));

console.log('\nTesting currency validation:');
console.log('FCFA valid:', isValidCurrencyCode('FCFA'));
console.log('USD valid:', isValidCurrencyCode('USD'));
console.log('INVALID valid:', isValidCurrencyCode('INVALID'));
