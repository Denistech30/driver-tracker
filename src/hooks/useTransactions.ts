import { useEffect, useState } from 'react';
import type { Transaction } from '../lib/storage';
import { getTransactions } from '../lib/storage';
import { useFirebaseUser } from './useFirebaseUser';
import { listenAllTransactions, type Unsubscribe } from '../lib/repositories/transactionsRepo';

export function useTransactions(): { transactions: Transaction[]; loading: boolean } {
  const { user } = useFirebaseUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsub: Unsubscribe | null = null;
    setLoading(true);
    
    if (user?.uid) {
      unsub = listenAllTransactions(user.uid, (txs) => {
        setTransactions(txs);
        setLoading(false);
      });
    } else {
      // Fallback to localStorage when Firebase is not available or user not signed in
      try {
        const localTransactions = getTransactions();
        setTransactions(localTransactions);
      } catch (error) {
        console.warn('Failed to load local transactions:', error);
        setTransactions([]);
      }
      setLoading(false);
    }
    
    return () => {
      if (unsub) unsub();
    };
  }, [user?.uid]);

  return { transactions, loading };
}
