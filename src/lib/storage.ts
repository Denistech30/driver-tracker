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