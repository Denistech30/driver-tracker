import { getTransactions, Transaction } from './storage';
import { getCategories, Category } from './categories';

interface BackupData {
  transactions: Transaction[];
  categories: Category[];
  version: string;
  timestamp: string;
}

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
 * Imports backup data from a JSON file
 * @param jsonData The JSON data to import
 */
export function importData(jsonData: string): void {
  try {
    const data = JSON.parse(jsonData) as BackupData;
    
    // Basic validation
    if (!data.transactions || !data.categories || !Array.isArray(data.transactions) || !Array.isArray(data.categories)) {
      throw new Error('Invalid backup file format');
    }
    
    // Save to localStorage
    localStorage.setItem('transactions', JSON.stringify(data.transactions));
    localStorage.setItem('categories', JSON.stringify(data.categories));
    
    // Force a page reload to reflect the imported data
    window.location.reload();
  } catch (error) {
    console.error('Failed to import data:', error);
    throw new Error('Failed to import data. The file format may be invalid.');
  }
}
