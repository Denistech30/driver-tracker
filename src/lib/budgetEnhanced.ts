// Enhanced Budget Management System
import { CategoryBudget, SavingsGoal, Achievement, BudgetStats, BudgetStatus, BudgetStatusInfo } from '../types/budget';
import { Category } from './categories';
import { Transaction } from './storage';

const CATEGORY_BUDGETS_KEY = 'category-budgets';
const SAVINGS_GOALS_KEY = 'savings-goals';
const ACHIEVEMENTS_KEY = 'achievements';
const STREAK_KEY = 'budget-streak';

// Category Budget Management
export function getCategoryBudgets(month?: string): CategoryBudget[] {
  const currentMonth = month || getCurrentMonth();
  try {
    const saved = localStorage.getItem(`${CATEGORY_BUDGETS_KEY}-${currentMonth}`);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to get category budgets:', error);
    return [];
  }
}

export function setCategoryBudget(categoryId: string, categoryName: string, allocated: number, icon?: string, color?: string): void {
  const currentMonth = getCurrentMonth();
  const budgets = getCategoryBudgets(currentMonth);
  
  const existingIndex = budgets.findIndex(b => b.categoryId === categoryId);
  const budget: CategoryBudget = {
    id: existingIndex >= 0 ? budgets[existingIndex].id : crypto.randomUUID(),
    categoryId,
    categoryName,
    allocated,
    spent: existingIndex >= 0 ? budgets[existingIndex].spent : 0,
    month: currentMonth,
    icon,
    color
  };

  if (existingIndex >= 0) {
    budgets[existingIndex] = budget;
  } else {
    budgets.push(budget);
  }

  localStorage.setItem(`${CATEGORY_BUDGETS_KEY}-${currentMonth}`, JSON.stringify(budgets));
}

export function updateCategorySpending(transactions: Transaction[], categories: Category[]): void {
  const currentMonth = getCurrentMonth();
  const budgets = getCategoryBudgets(currentMonth);
  
  // Reset spent amounts
  budgets.forEach(budget => budget.spent = 0);
  
  // Calculate spending for current month
  const currentMonthTransactions = transactions.filter(t => {
    const transactionMonth = new Date(t.date).toISOString().slice(0, 7);
    return transactionMonth === currentMonth && t.type === 'expense';
  });

  // Group by category and sum amounts
  const categorySpending = currentMonthTransactions.reduce((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] || 0) + Math.abs(transaction.amount);
    return acc;
  }, {} as Record<string, number>);

  // Update budget spending
  budgets.forEach(budget => {
    budget.spent = categorySpending[budget.categoryName] || 0;
  });

  localStorage.setItem(`${CATEGORY_BUDGETS_KEY}-${currentMonth}`, JSON.stringify(budgets));
}

// Savings Goals Management
export function getSavingsGoals(): SavingsGoal[] {
  try {
    const saved = localStorage.getItem(SAVINGS_GOALS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to get savings goals:', error);
    return [];
  }
}

export function addSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>): void {
  const goals = getSavingsGoals();
  const newGoal: SavingsGoal = {
    ...goal,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  goals.push(newGoal);
  localStorage.setItem(SAVINGS_GOALS_KEY, JSON.stringify(goals));
}

export function updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): void {
  const goals = getSavingsGoals();
  const index = goals.findIndex(g => g.id === id);
  
  if (index >= 0) {
    goals[index] = {
      ...goals[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(SAVINGS_GOALS_KEY, JSON.stringify(goals));
  }
}

export function deleteSavingsGoal(id: string): void {
  const goals = getSavingsGoals().filter(g => g.id !== id);
  localStorage.setItem(SAVINGS_GOALS_KEY, JSON.stringify(goals));
}

// Achievement System
export function getAchievements(): Achievement[] {
  try {
    const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
    return saved ? JSON.parse(saved) : getDefaultAchievements();
  } catch (error) {
    console.error('Failed to get achievements:', error);
    return getDefaultAchievements();
  }
}

export function unlockAchievement(achievementId: string): void {
  const achievements = getAchievements();
  const achievement = achievements.find(a => a.id === achievementId);
  
  if (achievement && !achievement.unlocked) {
    achievement.unlocked = true;
    achievement.unlockedAt = new Date().toISOString();
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  }
}

// Budget Analysis
export function getBudgetStatus(budget: CategoryBudget): BudgetStatusInfo {
  const percentage = (budget.spent / budget.allocated) * 100;
  
  if (percentage >= 100) {
    return {
      status: 'over-budget',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      message: 'Over Budget'
    };
  }
  
  if (percentage >= 85) {
    return {
      status: 'warning',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      message: 'Warning'
    };
  }
  
  if (percentage >= 70) {
    return {
      status: 'on-track',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      message: 'On Track'
    };
  }
  
  return {
    status: 'great',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    message: 'Great!'
  };
}

export function calculateBudgetStats(budgets: CategoryBudget[], goals: SavingsGoal[]): BudgetStats {
  const totalBudget = budgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const budgetHealth = totalBudget > 0 ? ((totalBudget - totalSpent) / totalBudget * 100) : 0;
  const totalSaved = goals.reduce((sum, g) => sum + g.current, 0);
  const streak = getStreak();
  const achievements = getAchievements();

  return {
    totalBudget,
    totalSpent,
    budgetHealth,
    streak,
    totalSaved,
    achievements
  };
}

// Goal Progress Calculation
export function getGoalProgress(goal: SavingsGoal) {
  const percentage = (goal.current / goal.target) * 100;
  const remaining = goal.target - goal.current;
  const daysLeft = Math.floor((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  return { percentage, remaining, daysLeft };
}

// Streak Management
export function getStreak(): number {
  try {
    const saved = localStorage.getItem(STREAK_KEY);
    return saved ? parseInt(saved, 10) : 0;
  } catch (error) {
    return 0;
  }
}

export function updateStreak(isUnderBudget: boolean): void {
  const currentStreak = getStreak();
  const newStreak = isUnderBudget ? currentStreak + 1 : 0;
  localStorage.setItem(STREAK_KEY, newStreak.toString());
}

// Helper Functions
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getDefaultAchievements(): Achievement[] {
  return [
    {
      id: 'budget-master',
      name: 'Budget Master',
      description: 'Under budget 3 months in a row',
      unlocked: false,
      icon: 'Trophy',
      color: 'text-yellow-500',
      type: 'budget'
    },
    {
      id: 'savings-streak',
      name: 'Savings Streak',
      description: '30 days of saving',
      unlocked: false,
      icon: 'Flame',
      color: 'text-orange-500',
      type: 'streak'
    },
    {
      id: 'first-1000',
      name: 'First $1000',
      description: 'Saved your first $1000',
      unlocked: false,
      icon: 'Star',
      color: 'text-blue-500',
      type: 'savings'
    },
    {
      id: 'goal-crusher',
      name: 'Goal Crusher',
      description: 'Completed 5 goals',
      unlocked: false,
      icon: 'Award',
      color: 'text-purple-500',
      type: 'milestone'
    },
    {
      id: 'budget-king',
      name: 'Budget King',
      description: 'Under budget for 6 months',
      unlocked: false,
      icon: 'Crown',
      color: 'text-gold-500',
      type: 'budget'
    }
  ];
}

// Achievement Logic
export function checkAndUnlockAchievements(budgets: CategoryBudget[], goals: SavingsGoal[], transactions: Transaction[]): void {
  const achievements = getAchievements();
  const stats = calculateBudgetStats(budgets, goals);
  
  // Check Budget Master (3 months under budget)
  if (!achievements.find(a => a.id === 'budget-master')?.unlocked) {
    // Implementation would check last 3 months
    if (stats.budgetHealth > 10) { // Simplified check
      unlockAchievement('budget-master');
    }
  }
  
  // Check First $1000
  if (!achievements.find(a => a.id === 'first-1000')?.unlocked) {
    if (stats.totalSaved >= 1000) {
      unlockAchievement('first-1000');
    }
  }
  
  // Check Savings Streak
  if (!achievements.find(a => a.id === 'savings-streak')?.unlocked) {
    if (stats.streak >= 30) {
      unlockAchievement('savings-streak');
    }
  }
  
  // Check Goal Crusher
  const completedGoals = goals.filter(g => g.current >= g.target).length;
  if (!achievements.find(a => a.id === 'goal-crusher')?.unlocked && completedGoals >= 5) {
    unlockAchievement('goal-crusher');
  }
}
