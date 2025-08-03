import React from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { useLocalStorageTransactions } from '../hooks/useLocalStorageTransactions';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

export function BudgetAnalysis() {
  const { budget } = useBudget();

  // Get current month transactions (reactive)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const allTransactions = useLocalStorageTransactions();
  const transactions = allTransactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear && t.type === 'expense';
  });
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  // budget is now from context, already defined above
  const percentSpent = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

  // Progress bar color logic (green: 0-33.333%, yellow: 33.334-66.666%, red: 66.667-100%)
  let progressColor = 'bg-green-500';
  let alertMsg = 'Looking good! Your spending is well within your total budget. Keep up the great work.';
  let alertTextColor = 'text-green-700';
  let alertBgColor = 'bg-green-100';
  if (percentSpent > 66.666) {
    progressColor = 'bg-red-500';
    alertMsg = 'Warning! You have exceeded or are about to exceed your total budget. Review your transactions and adjust your plan for the next month.';
    alertTextColor = 'text-red-700';
    alertBgColor = 'bg-red-100';
  } else if (percentSpent > 33.333) {
    progressColor = 'bg-yellow-400';
    alertMsg = 'Heads up! You\'re approaching your total budget limit. Consider pausing non-essential spending.';
    alertTextColor = 'text-yellow-800';
    alertBgColor = 'bg-yellow-100';
  }

  // Advice: ideal daily spend to stay within budget
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = now.getDate();
  const daysLeft = daysInMonth - today + 1;
  let adviceMsg = '';
  if (budget > 0 && daysLeft > 0) {
    const remainingBudget = Math.max(budget - totalSpent, 0);
    const idealDailySpend = remainingBudget / daysLeft;
    adviceMsg = `To stay within budget, try to keep daily spending below ${idealDailySpend.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} for the rest of the month.`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span>Percent Spent:</span>
          <span className="font-bold">{percentSpent.toFixed(1)}%</span>
        </div>
        <div className="w-full h-4 rounded bg-gray-200 overflow-hidden mb-2">
          <div
            className={`h-4 rounded transition-all duration-300 ${progressColor}`}
            style={{ width: `${percentSpent}%` }}
          />
        </div>
        <div className={`mt-2 p-3 rounded ${alertBgColor} ${alertTextColor} font-semibold text-sm`}>
          {alertMsg}
          {adviceMsg && (
            <div className="text-xs mt-1 text-gray-700">{adviceMsg}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
