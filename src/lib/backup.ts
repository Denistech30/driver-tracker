import { getTransactions, Transaction } from './storage';
import { getCategories, Category } from './categories';
import { validateBackupData, safeValidateBackupData, type BackupData } from './validation';

/**
 * Exports all user data as a downloadable JSON file
 */
export function exportData(): void {
  try {
    const transactions = getTransactions();
    const categories = getCategories();
    
    const backupData: BackupData = {
      transactions,
      categories,
      version: '1.0',
      timestamp: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `driver-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  } catch (error) {
    console.error('Failed to export data:', error);
    throw new Error('Failed to export data. Please try again.');
  }
}

/**
 * Imports backup data from a JSON file with comprehensive validation
 * @param jsonData The JSON data to import
 */
export function importData(jsonData: string): void {
  try {
    // Parse JSON
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(jsonData);
    } catch (parseError) {
      throw new Error('Invalid JSON format. Please check your backup file.');
    }
    
    // Validate the backup data structure
    const validationResult = safeValidateBackupData(parsedData);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map((err: any) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`Invalid backup file format: ${errorMessages}`);
    }
    
    const data = validationResult.data;
    
    // Additional business logic validation
    if (data.transactions.length === 0 && data.categories.length === 0) {
      throw new Error('Backup file appears to be empty (no transactions or categories found).');
    }
    
    // Check for duplicate IDs within transactions
    const transactionIds = new Set();
    for (const transaction of data.transactions) {
      if (transactionIds.has(transaction.id)) {
        throw new Error(`Duplicate transaction ID found: ${transaction.id}`);
      }
      transactionIds.add(transaction.id);
    }
    
    // Check for duplicate IDs within categories
    const categoryIds = new Set();
    for (const category of data.categories) {
      if (categoryIds.has(category.id)) {
        throw new Error(`Duplicate category ID found: ${category.id}`);
      }
      categoryIds.add(category.id);
    }
    
    // Validate that all transaction categories exist in the categories list
    const categoryNames = new Set(data.categories.map(c => c.name));
    const missingCategories = data.transactions
      .map(t => t.category)
      .filter(cat => !categoryNames.has(cat));
    
    if (missingCategories.length > 0) {
      const uniqueMissing = [...new Set(missingCategories)];
      console.warn(`Some transactions reference missing categories: ${uniqueMissing.join(', ')}`);
      // We'll allow this but warn the user
    }
    
    // Create backup of current data before importing
    const currentTransactions = localStorage.getItem('transactions');
    const currentCategories = localStorage.getItem('categories');
    
    if (currentTransactions || currentCategories) {
      const backupTimestamp = new Date().toISOString();
      localStorage.setItem(`backup_transactions_${backupTimestamp}`, currentTransactions || '[]');
      localStorage.setItem(`backup_categories_${backupTimestamp}`, currentCategories || '[]');
      console.log(`Created backup of current data with timestamp: ${backupTimestamp}`);
    }
    
    // Save validated data to localStorage
    localStorage.setItem('transactions', JSON.stringify(data.transactions));
    localStorage.setItem('categories', JSON.stringify(data.categories));
    
    console.log(`Successfully imported ${data.transactions.length} transactions and ${data.categories.length} categories`);
    
    // Force a page reload to reflect the imported data
    window.location.reload();
  } catch (error) {
    console.error('Failed to import data:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to import data. Please check the file format and try again.');
    }
  }
}
