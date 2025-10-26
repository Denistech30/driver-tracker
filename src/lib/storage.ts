import { updateLastTransactionTime } from './notificationService';
import { auth } from './firebase';
import {
  getAllTransactions as repoGetAll,
  upsertTransaction as repoUpsert,
  updateTransactionDoc as repoUpdate,
  deleteTransaction as repoDelete,
  listenAllTransactions,
} from './repositories/transactionsRepo';
import { addToOfflineQueue, isOnline } from './offlineSync';
import type { Unsubscribe } from 'firebase/firestore';

export interface Transaction {
  id: string;
  type: 'revenue' | 'expense';
  amount: number;
  category: string;
  date: string;
  description?: string;
  recurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  recurringEndDate?: string;
}

const STORAGE_KEY = 'transactions';

// --- Firestore-backed cache and listener ---
let cachedUid: string | null = null;
let cachedTransactions: Transaction[] = [];
let unsubscribe: Unsubscribe | null = null;

function ensureListener() {
  const uid = auth?.currentUser?.uid || null;
  if (!uid) {
    // No Firebase user yet; keep local cache (possibly from localStorage) as fallback
    teardownListener();
    return;
  }
  if (cachedUid === uid && unsubscribe) return;
  // Switch listener when uid changes
  teardownListener();
  cachedUid = uid;
  unsubscribe = listenAllTransactions(uid, (txs) => {
    cachedTransactions = txs;
  });
}

function teardownListener() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

export function getTransactions(): Transaction[] {
  // Ensure Firestore listener is set for current user
  ensureListener();
  // Serve cached Firestore data; fallback to localStorage once before listener fills
  if (cachedTransactions.length > 0) return cachedTransactions;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function addTransaction(transaction: Omit<Transaction, 'id'>): void {
  try {
    ensureListener();
    const uid = auth?.currentUser?.uid;
    const id = crypto.randomUUID();
    const newTransaction: Transaction = { ...transaction, id };
    
    // Always save to localStorage first (for offline support)
    const transactions = getTransactions();
    transactions.push(newTransaction);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    
    if (uid && isOnline() && auth && repoUpsert) {
      // Write to Firestore if online and authenticated
      void repoUpsert(uid, newTransaction);
    } else if (uid) {
      // Queue for offline sync if authenticated but offline
      addToOfflineQueue({
        type: 'transaction',
        operation: 'create',
        data: newTransaction
      });
    }
    
    const txTime = new Date(transaction.date).getTime();
    updateLastTransactionTime(Number.isFinite(txTime) ? txTime : undefined);
  } catch (error) {
    console.error('Failed to add transaction:', error);
  }
}

export function getTransactionById(id: string): Transaction | undefined {
  try {
    const transactions = getTransactions();
    return transactions.find(t => t.id === id);
  } catch (error) {
    console.error('Failed to get transaction by ID:', error);
    return undefined;
  }
}

export function updateTransaction(updatedTransaction: Transaction): void {
  try {
    ensureListener();
    const uid = auth?.currentUser?.uid;
    
    // Always update localStorage first (for offline support)
    let transactions = getTransactions();
    transactions = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    
    if (uid && isOnline() && auth && repoUpdate) {
      // Update in Firestore if online and authenticated
      void repoUpdate(uid, updatedTransaction);
    } else if (uid) {
      // Queue for offline sync if authenticated but offline
      addToOfflineQueue({
        type: 'transaction',
        operation: 'update',
        data: updatedTransaction
      });
    }
    
    const txTime = new Date(updatedTransaction.date).getTime();
    updateLastTransactionTime(Number.isFinite(txTime) ? txTime : undefined);
  } catch (error) {
    console.error('Failed to update transaction:', error);
  }
}

export function deleteTransaction(id: string): void {
  try {
    ensureListener();
    const uid = auth?.currentUser?.uid;
    
    // Always delete from localStorage first (for offline support)
    const transactions = getTransactions();
    const updated = transactions.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    if (uid && isOnline() && auth && repoDelete) {
      // Delete from Firestore if online and authenticated
      void repoDelete(uid, id);
    } else if (uid) {
      // Queue for offline sync if authenticated but offline
      addToOfflineQueue({
        type: 'transaction',
        operation: 'delete',
        data: { id }
      });
    }
  } catch (error) {
    console.error('Failed to delete transaction:', error);
  }
}

// Helper function to check if a transaction is from a specific month
function isFromMonth(transaction: Transaction, year: number, month: number): boolean {
  const transactionDate = new Date(transaction.date);
  return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
}

// Helper function to get current month transactions
function getCurrentMonthTransactions(): Transaction[] {
  const transactions = getTransactions();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  return transactions.filter(t => isFromMonth(t, currentYear, currentMonth));
}

// Get summary for current month only
export function getCurrentMonthSummary() {
  const transactions = getCurrentMonthTransactions();
  const revenue = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netIncome = revenue - expenses;

  return { revenue, expenses, netIncome };
}

// Original function - kept for backward compatibility (used by Calendar and other pages)
export function getSummary() {
  const transactions = getTransactions();
  const revenue = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netIncome = revenue - expenses;

  return { revenue, expenses, netIncome };
}

// Get expense categories for current month only
export function getCurrentMonthExpenseCategories() {
  const transactions = getCurrentMonthTransactions();
  
  // Filter only expense transactions
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  
  // If no expense transactions, return empty array
  if (expenseTransactions.length === 0) {
    return [];
  }
  
  // Aggregate expenses by category
  const categories = expenseTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  // Convert to array and sort by amount descending
  return Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// Original function - kept for backward compatibility (used by Calendar and other pages)
export function getExpenseCategories() {
  const transactions = getTransactions();
  
  // Filter only expense transactions
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  
  // If no expense transactions, return empty array
  if (expenseTransactions.length === 0) {
    return [];
  }
  
  // Aggregate expenses by category
  const categories = expenseTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  // Convert to array and sort by amount descending
  return Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}