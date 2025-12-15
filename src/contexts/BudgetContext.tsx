import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BudgetAnalysisService } from '../lib/budgetAnalysis';
import { getMonthlyBudget, setMonthlyBudget } from '../lib/monthlyBudget';
import { getTransactions } from '../lib/storage';
import type { Transaction } from '../lib/storage';
import type { BudgetAnalysis } from '../lib/budgetAnalysis';

interface BudgetContextType {
  analysis: BudgetAnalysis | null;
  budget: number;
  setBudget: (budget: number) => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [analysis, setAnalysis] = useState<BudgetAnalysis | null>(null);
  const [budget, setBudget] = useState<number>(0);

  // Use monthly budget persistence
  useEffect(() => {
    setBudget(getMonthlyBudget());
  }, []);

  const updateAnalysis = useCallback(async () => {
    // Get transactions using proper data source (respects authentication)
    const transactions: Transaction[] = getTransactions();
    
    if (budget > 0 && transactions.length > 0) {
      const service = new BudgetAnalysisService(budget);
      const newAnalysis = service.analyze(transactions);
      setAnalysis(newAnalysis);
    } else if (budget === 0 || transactions.length === 0) {
      // Clear analysis if budget is 0 or no transactions
      setAnalysis(null);
    }
  }, [budget]); // Add budget as a dependency for useCallback

  useEffect(() => {
    setMonthlyBudget(budget);
    // Update analysis when budget changes
    updateAnalysis();
  }, [budget, updateAnalysis]);



  useEffect(() => {
    // Initial analysis update
    updateAnalysis();

    // Update analysis periodically
    const interval = setInterval(updateAnalysis, 60000); // Every minute
    return () => clearInterval(interval);
  }, [updateAnalysis]);

  // Always persist budget both to state and storage
  const setBudgetAndPersist = (amount: number) => {
    setBudget(amount);
    setMonthlyBudget(amount);
  };

  return (
    <BudgetContext.Provider value={{ analysis, budget, setBudget: setBudgetAndPersist }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}
