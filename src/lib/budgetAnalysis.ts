import { Transaction } from '../types';
import { format, getMonth, getYear, getDate, getDaysInMonth } from 'date-fns';

export interface BudgetAnalysis {
  currentMonthSpending: number;
  projectedMonthSpending: number;
  budgetStatus: 'safe' | 'warning' | 'danger' | 'exceeded';
  dailyTarget: number;
  categoryTrends: CategoryTrend[];
  warnings: Warning[];
  recommendations: Recommendation[];
}

export interface CategoryTrend {
  category: string;
  currentMonth: number;
  previousMonth: number;
  changePercentage: number;
  volatility: number;
}

export interface Warning {
  type: 'budget' | 'category' | 'pattern';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  category: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export class BudgetAnalysisService {
  private readonly MONTHS_TO_ANALYZE = 3;
  private readonly WARNING_THRESHOLD = 0.8;
  private readonly DANGER_THRESHOLD = 0.95;

  constructor(private readonly budget: number) {}

  analyze(transactions: Transaction[]): BudgetAnalysis {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Group transactions by month and category
    const monthlyData = this.groupTransactionsByMonth(transactions);
    const categoryData = this.groupTransactionsByCategory(transactions);

    // Calculate spending metrics
    const currentMonthSpending = this.calculateCurrentMonthSpending(monthlyData, currentMonth, currentYear);
    const projectedSpending = this.predictMonthlySpending(monthlyData, currentMonth, currentYear);
    const dailyTarget = this.calculateDailyTarget(currentMonthSpending, projectedSpending);

    // Analyze trends
    const categoryTrends = this.analyzeCategoryTrends(categoryData);
    const warnings = this.generateWarnings(currentMonthSpending, projectedSpending);
    const recommendations = this.generateRecommendations(categoryTrends);

    // Determine budget status
    const budgetStatus = this.determineBudgetStatus(currentMonthSpending, projectedSpending);

    return {
      currentMonthSpending,
      projectedMonthSpending: projectedSpending,
      budgetStatus,
      dailyTarget,
      categoryTrends,
      warnings,
      recommendations,
    };
  }

  private groupTransactionsByMonth(transactions: Transaction[]) {
    const monthlyData = new Map<string, number>();
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyData.set(key, (monthlyData.get(key) || 0) + transaction.amount);
    });
    return monthlyData;
  }

  private groupTransactionsByCategory(transactions: Transaction[]) {
    const categoryData = new Map<string, number[]>();
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const currentMonth = date.getMonth();
      const currentYear = date.getFullYear();

      const key = `${currentYear}-${currentMonth}-${transaction.category}`;
      const amounts = categoryData.get(key) || [];
      amounts.push(transaction.amount);
      categoryData.set(key, amounts);
    });
    return categoryData;
  }

  private calculateCurrentMonthSpending(monthlyData: Map<string, number>, currentMonth: number, currentYear: number) {
    const key = `${currentYear}-${currentMonth}`;
    return monthlyData.get(key) || 0;
  }

  private predictMonthlySpending(monthlyData: Map<string, number>, currentMonth: number, currentYear: number) {
    const previousMonths = this.getPreviousMonthsData(monthlyData, currentMonth, currentYear);
    if (previousMonths.length < 2) return this.calculateCurrentMonthSpending(monthlyData, currentMonth, currentYear);

    // Simple linear prediction based on previous months
    const averageChange = previousMonths.reduce((acc, curr, i, arr) => {
      if (i === 0) return acc;
      return acc + (curr - arr[i - 1]);
    }, 0) / (previousMonths.length - 1);

    return previousMonths[previousMonths.length - 1] + averageChange;
  }

  private calculateDailyTarget(currentSpending: number, projectedSpending: number) {
    const remainingDays = this.getRemainingDaysInMonth();
    const remainingBudget = this.budget - currentSpending;
    return remainingBudget / remainingDays;
  }

  private analyzeCategoryTrends(categoryData: Map<string, number[]>) {
    const trends: CategoryTrend[] = [];
    const categories = new Set<string>();

    // Get all unique categories
    categoryData.forEach((_, key) => {
      const parts = key.split('-');
      categories.add(parts[2]);
    });

    categories.forEach(category => {
      const currentMonthData = this.getCurrentMonthCategoryData(categoryData, category);
      const previousMonthData = this.getPreviousMonthCategoryData(categoryData, category);

      if (currentMonthData && previousMonthData) {
        const currentMonthTotal = currentMonthData.reduce((a, b) => a + b, 0);
        const previousMonthTotal = previousMonthData.reduce((a, b) => a + b, 0);

        const changePercentage = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
        const volatility = this.calculateVolatility(currentMonthData);

        trends.push({
          category,
          currentMonth: currentMonthTotal,
          previousMonth: previousMonthTotal,
          changePercentage,
          volatility,
        });
      }
    });

    return trends;
  }

  private generateWarnings(currentSpending: number, projectedSpending: number): Warning[] {
    const warnings: Warning[] = [];

    // Budget warnings
    const budgetRatio = currentSpending / this.budget;
    if (budgetRatio > this.DANGER_THRESHOLD) {
      warnings.push({
        type: 'budget',
        message: 'You are likely to exceed your budget this month',
        severity: 'high',
      });
    } else if (budgetRatio > this.WARNING_THRESHOLD) {
      warnings.push({
        type: 'budget',
        message: 'Approaching budget limit - be cautious with spending',
        severity: 'medium',
      });
    }

    return warnings;
  }

  private generateRecommendations(categoryTrends: CategoryTrend[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    categoryTrends.forEach(trend => {
      if (trend.changePercentage > 50 && trend.volatility > 0.3) {
        recommendations.push({
          category: trend.category,
          message: `Consider reviewing your ${trend.category} spending - it has increased significantly`,
          priority: 'high',
        });
      } else if (trend.changePercentage > 20 && trend.volatility > 0.2) {
        recommendations.push({
          category: trend.category,
          message: `Monitor your ${trend.category} spending - it's showing an upward trend`,
          priority: 'medium',
        });
      }
    });

    return recommendations;
  }

  private determineBudgetStatus(currentSpending: number, projectedSpending: number): 'safe' | 'warning' | 'danger' | 'exceeded' {
    const budgetRatio = currentSpending / this.budget;
    if (budgetRatio > 1) return 'exceeded';
    if (budgetRatio > this.DANGER_THRESHOLD) return 'danger';
    if (budgetRatio > this.WARNING_THRESHOLD) return 'warning';
    return 'safe';
  }

  private getRemainingDaysInMonth(): number {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return daysInMonth - now.getDate();
  }

  private calculateVolatility(data: number[]): number {
    if (data.length < 2) return 0;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    return Math.sqrt(variance) / mean;
  }

  private getPreviousMonthsData(monthlyData: Map<string, number>, currentMonth: number, currentYear: number): number[] {
    const data: number[] = [];
    const months = this.MONTHS_TO_ANALYZE;

    for (let i = 1; i <= months; i++) {
      const month = currentMonth - i;
      const year = month < 0 ? currentYear - 1 : currentYear;
      const normalizedMonth = month < 0 ? 12 + month : month;
      const key = `${year}-${normalizedMonth}`;
      data.push(monthlyData.get(key) || 0);
    }

    return data;
  }

  private getCurrentMonthCategoryData(categoryData: Map<string, number[]>, category: string): number[] | undefined {
    const now = new Date();
    const key = `${now.getFullYear()}-${now.getMonth()}-${category}`;
    return categoryData.get(key);
  }

  private getPreviousMonthCategoryData(categoryData: Map<string, number[]>, category: string): number[] | undefined {
    const now = new Date();
    const prevMonth = now.getMonth() - 1;
    const prevYear = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const normalizedMonth = prevMonth < 0 ? 12 + prevMonth : prevMonth;
    const key = `${prevYear}-${normalizedMonth}-${category}`;
    return categoryData.get(key);
  }
}
