// Utility for getting/setting monthly budget in localStorage by YYYY-MM key

const BUDGET_PREFIX = 'budget-';

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function setMonthlyBudget(amount: number, date = new Date()) {
  const key = BUDGET_PREFIX + getMonthKey(date);
  localStorage.setItem(key, amount.toString());
}

export function getMonthlyBudget(date = new Date()): number {
  const key = BUDGET_PREFIX + getMonthKey(date);
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
