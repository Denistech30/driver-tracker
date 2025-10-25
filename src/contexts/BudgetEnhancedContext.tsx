import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BudgetAnalysisService } from '../lib/budgetAnalysis';
import type { Transaction } from '../lib/storage';
import type { BudgetAnalysis } from '../lib/budgetAnalysis';
import { getMonthlyBudget, setMonthlyBudget } from '../lib/monthlyBudget';
import { 
  CategoryBudget, 
  SavingsGoal, 
  Achievement, 
  BudgetStats 
} from '../types/budget';
import {
  getCategoryBudgets,
  setCategoryBudget,
  updateCategorySpending,
  getSavingsGoals,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  getAchievements,
  calculateBudgetStats,
  checkAndUnlockAchievements,
  getGoalProgress
} from '../lib/budgetEnhanced';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';

interface BudgetEnhancedContextType {
  // Legacy budget system (for backward compatibility)
  analysis: BudgetAnalysis | null;
  budget: number;
  setBudget: (budget: number) => void;
  
  // Enhanced budget system
  categoryBudgets: CategoryBudget[];
  savingsGoals: SavingsGoal[];
  achievements: Achievement[];
  budgetStats: BudgetStats;
  
  // Category budget management
  setCategoryBudget: (categoryId: string, categoryName: string, allocated: number, icon?: string, color?: string) => void;
  
  // Savings goals management
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  
  // Utility functions
  getGoalProgress: (goal: SavingsGoal) => { percentage: number; remaining: number; daysLeft: number };
  refreshData: () => void;
}

const BudgetEnhancedContext = createContext<BudgetEnhancedContextType | undefined>(undefined);

export function BudgetEnhancedProvider({ children }: { children: React.ReactNode }) {
  // Legacy state
  const [analysis, setAnalysis] = useState<BudgetAnalysis | null>(null);
  const [budget, setBudgetState] = useState<number>(0);
  
  // Enhanced state
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [budgetStats, setBudgetStats] = useState<BudgetStats>({
    totalBudget: 0,
    totalSpent: 0,
    budgetHealth: 0,
    streak: 0,
    totalSaved: 0,
    achievements: []
  });

  // Get real-time data
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  // Load initial data
  useEffect(() => {
    setBudgetState(getMonthlyBudget());
    refreshData();
  }, []);

  const refreshData = useCallback(() => {
    const budgets = getCategoryBudgets();
    const goals = getSavingsGoals();
    const achievementsList = getAchievements();
    
    setCategoryBudgets(budgets);
    setSavingsGoals(goals);
    setAchievements(achievementsList);
    
    const stats = calculateBudgetStats(budgets, goals);
    setBudgetStats(stats);
  }, []);

  // Update spending when transactions change
  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0) {
      updateCategorySpending(transactions, categories);
      refreshData();
      
      // Check for new achievements
      const budgets = getCategoryBudgets();
      const goals = getSavingsGoals();
      checkAndUnlockAchievements(budgets, goals, transactions);
    }
  }, [transactions, categories, refreshData]);

  // Legacy budget analysis (maintain backward compatibility)
  const updateAnalysis = useCallback(async () => {
    if (budget > 0 && transactions.length > 0) {
      const service = new BudgetAnalysisService(budget);
      const newAnalysis = service.analyze(transactions);
      setAnalysis(newAnalysis);
    } else {
      setAnalysis(null);
    }
  }, [budget, transactions]);

  useEffect(() => {
    updateAnalysis();
  }, [updateAnalysis]);

  // Legacy budget setter
  const setBudget = (amount: number) => {
    setBudgetState(amount);
    setMonthlyBudget(amount);
  };

  // Enhanced budget functions
  const setCategoryBudgetWrapper = (categoryId: string, categoryName: string, allocated: number, icon?: string, color?: string) => {
    setCategoryBudget(categoryId, categoryName, allocated, icon, color);
    refreshData();
  };

  const addGoal = (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    addSavingsGoal(goal);
    refreshData();
  };

  const updateGoal = (id: string, updates: Partial<SavingsGoal>) => {
    updateSavingsGoal(id, updates);
    refreshData();
  };

  const deleteGoal = (id: string) => {
    deleteSavingsGoal(id);
    refreshData();
  };

  return (
    <BudgetEnhancedContext.Provider value={{
      // Legacy
      analysis,
      budget,
      setBudget,
      
      // Enhanced
      categoryBudgets,
      savingsGoals,
      achievements,
      budgetStats,
      
      // Functions
      setCategoryBudget: setCategoryBudgetWrapper,
      addGoal,
      updateGoal,
      deleteGoal,
      getGoalProgress,
      refreshData
    }}>
      {children}
    </BudgetEnhancedContext.Provider>
  );
}

export function useBudgetEnhanced() {
  const context = useContext(BudgetEnhancedContext);
  if (context === undefined) {
    throw new Error('useBudgetEnhanced must be used within a BudgetEnhancedProvider');
  }
  return context;
}
