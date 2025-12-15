// Utility for getting/setting monthly budget in localStorage by YYYY-MM key
import { auth } from './firebase';

const BUDGET_PREFIX = 'budget-';

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function setMonthlyBudget(amount: number, date = new Date()) {
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    // For non-authenticated users, use localStorage
    const key = BUDGET_PREFIX + getMonthKey(date);
    localStorage.setItem(key, amount.toString());
    return;
  }
  
  // For authenticated users, use user-specific key
  const key = `${BUDGET_PREFIX}${uid}-${getMonthKey(date)}`;
  localStorage.setItem(key, amount.toString());
}

export function getMonthlyBudget(date = new Date()): number {
  const uid = auth?.currentUser?.uid;
  
  if (!uid) {
    // For non-authenticated users, use localStorage
    const key = BUDGET_PREFIX + getMonthKey(date);
    const value = localStorage.getItem(key);
    return value ? Number(value) : 0;
  }
  
  // For authenticated users, use user-specific key (return 0 for new users)
  const key = `${BUDGET_PREFIX}${uid}-${getMonthKey(date)}`;
  const value = localStorage.getItem(key);
  return value ? Number(value) : 0;
}

export function clearMonthlyBudget(date = new Date()) {
  const key = BUDGET_PREFIX + getMonthKey(date);
  localStorage.removeItem(key);
}

export function clearAllBudgets() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(BUDGET_PREFIX)) localStorage.removeItem(key);
  });
}
