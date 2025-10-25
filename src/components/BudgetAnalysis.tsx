import React from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { useTransactions } from '../hooks/useTransactions';
import { useSettings } from '../contexts/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

export function BudgetAnalysis() {
  const { budget } = useBudget();
  const { settings } = useSettings();

  // Get current month transactions (reactive)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const { transactions: allTransactions } = useTransactions();
  const transactions = allTransactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear && t.type === 'expense';
  });
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const percentSpent = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

  // Helper function to format currency with user's selected currency
  const formatCurrency = (amount: number) => {
    const currencyCode = settings.currency === 'FCFA' ? 'XAF' : settings.currency;
    try {
      const formatted = new Intl.NumberFormat(settings.language || 'en-US', {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'code'
      }).format(amount);
      return settings.currency === 'FCFA' ? formatted.replace('XAF', 'FCFA') : formatted;
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${amount.toFixed(2)} ${currencyCode.replace('XAF', 'FCFA')}`;
    }
  };

  // Smart message logic based on spending patterns and transaction state
  let progressColor = 'bg-green-500';
  let alertMsg = '';
  let alertTextColor = 'text-green-700';
  let alertBgColor = 'bg-green-100';

  // Check if no transactions exist
  if (transactions.length === 0) {
    alertMsg = 'Great! You haven\'t made any expenses this month yet. Start tracking your transactions to monitor your budget progress.';
  } else {
    // Check for high first expense warning
    const firstExpenseAmount = transactions.length > 0 ? transactions[0].amount : 0;
    const firstExpensePercent = budget > 0 ? (firstExpenseAmount / budget) * 100 : 0;
    
    if (percentSpent > 66.666) {
      progressColor = 'bg-red-500';
      alertTextColor = 'text-red-700';
      alertBgColor = 'bg-red-100';
      if (percentSpent >= 100) {
        alertMsg = `Budget exceeded! You've spent ${formatCurrency(totalSpent)} out of your ${formatCurrency(budget)} budget. Consider reviewing your expenses.`;
      } else {
        alertMsg = `Warning! You've used ${percentSpent.toFixed(1)}% of your budget. Only ${formatCurrency(budget - totalSpent)} remaining.`;
      }
    } else if (percentSpent > 33.333) {
      progressColor = 'bg-yellow-400';
      alertTextColor = 'text-yellow-800';
      alertBgColor = 'bg-yellow-100';
      alertMsg = `Heads up! You've spent ${formatCurrency(totalSpent)} (${percentSpent.toFixed(1)}% of budget). Consider monitoring your spending pace.`;
    } else {
      // Check for concerning first expense even if overall percentage is low
      if (transactions.length === 1 && firstExpensePercent > 40) {
        progressColor = 'bg-yellow-400';
        alertTextColor = 'text-yellow-800';
        alertBgColor = 'bg-yellow-100';
        alertMsg = `Your first expense of ${formatCurrency(firstExpenseAmount)} is ${firstExpensePercent.toFixed(1)}% of your budget. Consider smaller expenses to stay on track.`;
      } else {
        alertMsg = `Looking good! You've spent ${formatCurrency(totalSpent)} (${percentSpent.toFixed(1)}% of your ${formatCurrency(budget)} budget). Keep up the great work!`;
      }
    }
  }

  // Smart advice based on remaining days and budget
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = now.getDate();
  const daysLeft = daysInMonth - today + 1;
  let adviceMsg = '';
  
  if (budget > 0 && daysLeft > 0 && transactions.length > 0) {
    const remainingBudget = Math.max(budget - totalSpent, 0);
    const idealDailySpend = remainingBudget / daysLeft;
    const avgDailySpend = totalSpent / today;
    
    if (remainingBudget <= 0) {
      adviceMsg = `Budget exhausted with ${daysLeft} days remaining. Consider avoiding non-essential expenses.`;
    } else if (avgDailySpend > idealDailySpend * 1.5) {
      adviceMsg = `Your daily average (${formatCurrency(avgDailySpend)}) is high. Try to keep daily spending below ${formatCurrency(idealDailySpend)} for the remaining ${daysLeft} days.`;
    } else {
      adviceMsg = `You have ${formatCurrency(remainingBudget)} left for ${daysLeft} days. Aim for ${formatCurrency(idealDailySpend)} per day to stay on track.`;
    }
  } else if (budget > 0 && transactions.length === 0) {
    const idealDailySpend = budget / daysInMonth;
    adviceMsg = `You have your full budget of ${formatCurrency(budget)} for this month. Aim for about ${formatCurrency(idealDailySpend)} per day.`;
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
            <div className="text-xs mt-1 opacity-80">{adviceMsg}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
