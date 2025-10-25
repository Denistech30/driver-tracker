// Enhanced Budget Types
export interface CategoryBudget {
  id: string;
  categoryId: string;
  categoryName: string;
  allocated: number;
  spent: number;
  month: string; // YYYY-MM format
  icon?: string;
  color?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string; // ISO date string
  icon: string;
  color: string;
  emoji: string;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string;
  color: string;
  type: 'budget' | 'savings' | 'streak' | 'milestone';
}

export interface BudgetStats {
  totalBudget: number;
  totalSpent: number;
  budgetHealth: number; // percentage
  streak: number; // days
  totalSaved: number;
  achievements: Achievement[];
}

export type BudgetStatus = 'great' | 'on-track' | 'warning' | 'over-budget';

export interface BudgetStatusInfo {
  status: BudgetStatus;
  color: string;
  bgColor: string;
  borderColor: string;
  message: string;
}
