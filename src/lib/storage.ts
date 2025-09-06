export interface Transaction {
  id: string;
  type: 'revenue' | 'expense';
  amount: number;
  category: string;
  date: string;
  description?: string;
}

const STORAGE_KEY = 'transactions';

export function getTransactions(): Transaction[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return [];
  }
}

export function addTransaction(transaction: Omit<Transaction, 'id'>): void {
  try {
    const transactions = getTransactions();
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };
    transactions.push(newTransaction);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
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
    let transactions = getTransactions();
    transactions = transactions.map(t => 
      t.id === updatedTransaction.id ? updatedTransaction : t
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Failed to update transaction:', error);
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