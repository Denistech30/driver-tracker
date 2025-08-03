import { useEffect, useState } from 'react';
import { Transaction } from '../lib/storage';

/**
 * Reactively get transactions from localStorage and update when storage changes.
 * Returns the latest transactions array, triggering re-renders on add/update/remove.
 */
export function useLocalStorageTransactions(): Transaction[] {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('transactions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === 'transactions') {
        try {
          setTransactions(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          setTransactions([]);
        }
      }
    }
    // Listen for localStorage changes in other tabs
    window.addEventListener('storage', handleStorageChange);
    // Poll for changes in this tab (since localStorage events don't fire in same tab)
    const poll = setInterval(() => {
      try {
        const saved = localStorage.getItem('transactions');
        setTransactions(saved ? JSON.parse(saved) : []);
      } catch {
        setTransactions([]);
      }
    }, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(poll);
    };
  }, []);

  return transactions;
}
