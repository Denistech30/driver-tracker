// Utility functions for managing user data and localStorage cleanup

/**
 * Clear all localStorage data when a new user signs up
 * This ensures new users start with a clean slate
 */
export function clearLocalStorageForNewUser(): void {
  try {
    // Clear transactions
    localStorage.removeItem('transactions');
    
    // Clear categories
    localStorage.removeItem('categories');
    
    // Clear settings (but preserve theme preference)
    const currentTheme = localStorage.getItem('theme');
    localStorage.removeItem('settings');
    if (currentTheme) {
      localStorage.setItem('theme', currentTheme);
    }
    
    // Clear budget data (all budget keys)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('budget-')) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem('budget');
    localStorage.removeItem('budgetMonthly');
    
    // Clear enhanced budget features
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('categoryBudgets-')) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem('savingsGoals');
    localStorage.removeItem('achievements');
    localStorage.removeItem('transactionStreak');
    
    // Clear offline sync queue (start fresh)
    localStorage.removeItem('offline-sync-queue');
    localStorage.removeItem('last-sync-timestamp');
    
    console.log('Cleared localStorage for new user');
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

/**
 * Check if this is a new user's first session
 * (has Firebase auth but no Firestore data yet)
 */
export function isNewUser(uid: string): boolean {
  // This is a simple check - in a real app you might want to check Firestore
  // for user document existence
  return true; // For now, assume all authenticated users might be new
}
