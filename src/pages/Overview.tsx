import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { getCurrentMonthSummary, getCurrentMonthExpenseCategories } from '../lib/storage';
import { useSettings } from '../contexts/SettingsContext';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorBoundary from '../components/ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useTranslation } from '../hooks/useTranslation';
import { BudgetAnalysis } from '../components/BudgetAnalysis';
import { getBudgetStatus } from '../lib/budgetEnhanced';
import { formatCurrency as formatCurrencyUtil } from '../lib/currencyUtils';
import { useBudget } from '../contexts/BudgetContext';
import BudgetSettingsModal from '../components/BudgetSettingsModal';
import { useTransactions } from '../hooks/useTransactions';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Plus,
  Camera,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Target,
  Trophy,
  BarChart3,
  Settings,
  Zap,
  Calendar,
  CreditCard,
  ShoppingBag,
  Coffee,
  Home,
  Car,
  Sparkles
} from 'lucide-react';

interface ExpenseCategory {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface ChartData {
  revenue: number;
  expenses: number;
  netIncome: number;
  expenseCategories: ExpenseCategory[];
}

// Sparkline Component for mini trend charts
const Sparkline = ({ data, color = '#6366F1' }: { data: number[]; color?: string }) => {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1; // Avoid division by zero
  
  return (
    <svg width="100" height="30" className="inline-block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={data.map((value, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 30 - ((value - min) / range) * 30;
          return `${x},${y}`;
        }).join(' ')}
      />
    </svg>
  );
};

// Generate real sparkline data from transactions
const generateSparklineData = (transactions: any[]) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  return last7Days.map(date => {
    const dayTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate.toDateString() === date.toDateString();
    });
    
    const dayTotal = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return dayTotal;
  });
};

export default function Overview() {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { analysis, budget } = useBudget(); // Get analysis and budget from context
  const { transactions } = useTransactions(); // Get real transaction data
  const navigate = useNavigate();

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState<ChartData>({
    revenue: 0,
    expenses: 0,
    netIncome: 0,
    expenseCategories: [],
  });

  useEffect(() => {
    const loadData = () => {
      const summary = getCurrentMonthSummary();
      const categories = getCurrentMonthExpenseCategories();
      
      const colors = [
        'hsl(215, 90%, 50%)', 'hsl(150, 80%, 40%)', 'hsl(350, 85%, 50%)',
        'hsl(45, 95%, 50%)', 'hsl(280, 85%, 55%)', 'hsl(190, 90%, 45%)',
        'hsl(20, 90%, 50%)', 'hsl(325, 85%, 45%)', 'hsl(170, 85%, 35%)',
        'hsl(245, 85%, 60%)',
      ];

      const isDarkMode = document.documentElement.classList.contains('dark');
      const adjustedColors = isDarkMode ? colors.map(color => {
        const matchResult = color.match(/\d+/g);
        if (!matchResult || matchResult.length < 3) {
          console.warn(`Could not parse HSL color string: ${color} for dark mode adjustment. Using original color.`);
          return color; 
        }
        const [h, s, l] = matchResult.map(Number);
        // Example adjustment: slightly desaturate and lighten for dark mode
        return `hsl(${h}, ${s * 0.9}%, ${Math.min(100, l * 1.15)}%)`;
      }) : colors;

      const totalExpenses = summary.expenses > 0 ? summary.expenses : 1; // Avoid division by zero
      const enhancedCategories = categories.map((cat, index) => ({
        ...cat,
        percentage: (cat.value / totalExpenses) * 100,
        color: adjustedColors[index % adjustedColors.length],
      }));

      setData({
        revenue: summary.revenue,
        expenses: summary.expenses,
        netIncome: summary.netIncome,
        expenseCategories: enhancedCategories,
      });
      setIsLoading(false);
    };
    // Load data with a small delay to show loading state
    setTimeout(loadData, 500);
  }, []);

  // Update current time every minute for time-aware features
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, settings.currency || 'USD', settings.language || 'en-US');
  };



  // Calculate today's data from real transactions
  const todayData = useMemo(() => {
    const today = new Date();
    const todayTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate.toDateString() === today.toDateString();
    });

    const todaySpent = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastTransaction = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const getTimeAgo = (date: string) => {
      const now = new Date();
      const txDate = new Date(date);
      const diffMs = now.getTime() - txDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return 'Just now';
    };

    return {
      spent: todaySpent,
      transactions: todayTransactions.length,
      lastTransaction: lastTransaction ? {
        name: lastTransaction.description || lastTransaction.category,
        amount: lastTransaction.amount,
        time: getTimeAgo(lastTransaction.date)
      } : null
    };
  }, [transactions]);

  // Calculate week data
  const weekData = {
    spent: data.expenses * 0.7, // Rough estimate of week's spending
    budget: budget || 1000,
    daysLeft: 7 - new Date().getDay()
  };

  // Enhanced metrics with sparklines and trends
  const metrics = {
    revenue: { 
      amount: data.revenue, 
      change: 10.4, 
      trend: 'up' as const, 
      sparkline: generateSparklineData(transactions.filter(t => t.type === 'revenue')) 
    },
    expenses: { 
      amount: data.expenses, 
      change: -5.2, 
      trend: 'down' as const, 
      sparkline: generateSparklineData(transactions.filter(t => t.type === 'expense')) 
    },
    net: { 
      amount: data.netIncome, 
      change: data.netIncome > 0 ? 15.8 : -8.3, 
      trend: data.netIncome > 0 ? 'up' as const : 'down' as const, 
      sparkline: generateSparklineData(transactions) 
    }
  };

  // Smart Alert System - Generate intelligent notifications
  const alerts = [];
  
  // Budget-based alerts
  if (budget && data.expenses > 0) {
    const budgetUsage = (data.expenses / budget) * 100;
    
    if (budgetUsage > 100) {
      alerts.push({
        type: 'warning' as const,
        icon: AlertTriangle,
        message: `Budget exceeded by ${formatCurrency(data.expenses - budget)}. Consider reviewing your expenses.`,
        priority: 'high' as const
      });
    } else if (budgetUsage > 85) {
      alerts.push({
        type: 'warning' as const,
        icon: AlertTriangle,
        message: `Budget at ${budgetUsage.toFixed(0)}% - ${formatCurrency(budget - data.expenses)} remaining`,
        priority: 'high' as const
      });
    } else if (budgetUsage < 50) {
      alerts.push({
        type: 'success' as const,
        icon: CheckCircle2,
        message: `Great budget management! Only ${budgetUsage.toFixed(0)}% used this month. 🎉`,
        priority: 'low' as const
      });
    }
  }

  // Category-based alerts
  const topExpenseCategory = data.expenseCategories
    .sort((a, b) => b.value - a.value)[0];
  
  if (topExpenseCategory && topExpenseCategory.percentage > 40) {
    alerts.push({
      type: 'info' as const,
      icon: Zap,
      message: `${topExpenseCategory.name} is your top expense (${topExpenseCategory.percentage.toFixed(0)}%). Consider setting a category budget.`,
      priority: 'medium' as const
    });
  }

  // Positive reinforcement
  if (data.netIncome > 0) {
    alerts.push({
      type: 'success' as const,
      icon: CheckCircle2,
      message: `You're saving ${formatCurrency(data.netIncome)} this month! Keep up the great work! 💪`,
      priority: 'low' as const
    });
  }

  // Revenue growth alert
  if (data.revenue > 0 && metrics.revenue.change > 10) {
    alerts.push({
      type: 'info' as const,
      icon: Zap,
      message: `Revenue is up ${metrics.revenue.change}%! You're on track for a great month! 📈`,
      priority: 'medium' as const
    });
  }

  // Category icon mapping for transactions
  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('food') || categoryLower.includes('dining') || categoryLower.includes('restaurant')) return Coffee;
    if (categoryLower.includes('transport') || categoryLower.includes('gas') || categoryLower.includes('car')) return Car;
    if (categoryLower.includes('shopping') || categoryLower.includes('groceries') || categoryLower.includes('store')) return ShoppingBag;
    if (categoryLower.includes('bills') || categoryLower.includes('utilities') || categoryLower.includes('rent')) return CreditCard;
    if (categoryLower.includes('home') || categoryLower.includes('house') || categoryLower.includes('mortgage')) return Home;
    return DollarSign; // Default icon
  };

  // Format time ago helper
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  // Get recent transactions (last 5)
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(transaction => ({
      id: transaction.id,
      name: transaction.description || 'Transaction',
      category: transaction.category,
      amount: Math.abs(transaction.amount),
      time: formatTimeAgo(new Date(transaction.date)),
      icon: getCategoryIcon(transaction.category),
      type: transaction.type
    }));

  const hasData = (data.revenue !== 0 || data.expenses !== 0 || data.expenseCategories.length > 0);

  if (isLoading) {
    return (
      <section className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('nav.overview')}</h2>
        </div>
        {/* Skeleton for Budget Analysis Card */}
        <Card className="shadow-lg"><CardHeader><CardTitle><div className="h-6 w-1/2 bg-muted rounded animate-pulse"></div></CardTitle></CardHeader><CardContent><div className="space-y-2"><div className="h-4 w-full bg-muted rounded animate-pulse"></div><div className="h-8 bg-muted rounded w-3/4" animate-pulse></div><div className="h-24 bg-muted rounded" animate-pulse></div></div></CardContent></Card>
        {/* Skeleton for Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card><CardHeader><div className="h-4 w-1/3 bg-muted rounded animate-pulse mb-2"></div></CardHeader><CardContent><div className="h-6 w-2/3 bg-muted rounded animate-pulse"></div></CardContent></Card>
            <Card><CardHeader><div className="h-4 w-1/3 bg-muted rounded animate-pulse mb-2"></div></CardHeader><CardContent><div className="h-6 w-2/3 bg-muted rounded animate-pulse"></div></CardContent></Card>
            <Card><CardHeader><div className="h-4 w-1/3 bg-muted rounded animate-pulse mb-2"></div></CardHeader><CardContent><div className="h-6 w-2/3 bg-muted rounded animate-pulse"></div></CardContent></Card>
        </div>
        {/* Skeleton for Chart/Table Card */}
        <Card className="shadow-lg"><CardHeader><div className="h-6 w-1/2 bg-muted rounded animate-pulse"></div></CardHeader><CardContent><div className="h-64 w-full bg-muted rounded animate-pulse"></div></CardContent></Card>
      </section>
    );
  }

  return (
    <ErrorBoundary>
      <BudgetSettingsModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} />
      <section className="space-y-8 p-4 md:p-6" id="financial-report">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{t('nav.overview')}</h2>

        </div>

        {/* Time-Aware Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 text-white shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm opacity-90">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}!
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm opacity-80 mb-1">Today's Spending</p>
                  <p className="text-2xl font-bold">{formatCurrency(todayData.spent)}</p>
                  <p className="text-xs opacity-70">{todayData.transactions} transactions</p>
                </div>
                <div>
                  <p className="text-sm opacity-80 mb-1">This Week</p>
                  <p className="text-2xl font-bold">{formatCurrency(weekData.spent)}</p>
                  <p className="text-xs opacity-70">{weekData.daysLeft} days left</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="text-sm opacity-80 mb-1">Budget Status</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((weekData.spent / weekData.budget) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{Math.min(((weekData.spent / weekData.budget) * 100), 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <Button 
                onClick={() => navigate('/add-transaction')}
                className="bg-white text-indigo-600 hover:bg-gray-100 gap-2 justify-center"
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
              <Button 
                onClick={() => navigate('/add-transaction')}
                className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20 gap-2 justify-center"
              >
                <Camera className="h-4 w-4" />
                Scan Receipt
              </Button>
            </div>
          </div>
        </div>

        {!hasData && (
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CardContent className="p-8 text-center">
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Welcome to Xpense</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">Get started by adding your first transaction, creating categories, or setting a monthly budget.</div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/categories')} variant="outline">
                  Categories
                </Button>
                <Button onClick={() => setIsBudgetModalOpen(true)} variant="outline">
                  Set Budget
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budget Analysis Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('overview.budgetAnalysisTitle')}</CardTitle>
            <Button onClick={() => setIsBudgetModalOpen(true)} size="sm" variant="outline" className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-coins"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.72A6 6 0 1 1 10.72 3.91"/><path d="M8 12h.01"/><path d="M16 18h.01"/><path d="M3 6h.01"/><path d="M21 12h.01"/></svg>
              {t('overview.setBudgetButton')}
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {analysis ? (
              <BudgetAnalysis />
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <p>{t('overview.setBudgetPrompt')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Metrics Cards with Sparklines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Card */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <Sparkline data={metrics.revenue.sparkline} color="#10B981" />
                  <Badge className="bg-green-100 text-green-700 mt-1">
                    +{metrics.revenue.change}%
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('overview.revenue')}</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.revenue.amount)}</p>
                <p className="text-xs text-gray-500 mt-1">↑ Up from last month</p>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-red-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-right">
                  <Sparkline data={metrics.expenses.sparkline} color="#EF4444" />
                  <Badge className="bg-green-100 text-green-700 mt-1">
                    {metrics.expenses.change}%
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('overview.expenses')}</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.expenses.amount)}</p>
                <p className="text-xs text-gray-500 mt-1">↓ Down from last month</p>
              </div>
            </CardContent>
          </Card>

          {/* Net Income Card */}
          <Card className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <Sparkline data={metrics.net.sparkline} color="#FFFFFF" />
                  <Badge className="bg-white/20 backdrop-blur text-white border-white/30 mt-1">
                    {metrics.net.change >= 0 ? '+' : ''}{metrics.net.change}%
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-indigo-100 mb-1">{t('overview.netIncome')}</p>
                <p className="text-3xl font-bold">{formatCurrency(metrics.net.amount)}</p>
                <p className="text-xs text-indigo-100 mt-1">
                  {metrics.net.amount >= 0 ? '🎉 Great job saving!' : '📊 Track your progress'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Smart Alerts & Insights */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <Card key={idx} className={`border-l-4 ${
                alert.type === 'warning' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' :
                alert.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
                'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <alert.icon className={`h-5 w-5 ${
                      alert.type === 'warning' ? 'text-orange-600 dark:text-orange-400' :
                      alert.type === 'success' ? 'text-green-600 dark:text-green-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`} />
                    <p className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{alert.message}</p>
                    <Button variant="ghost" size="sm" className="gap-1">
                      View
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recent Activity Feed */}
        {recentTransactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-500" />
                  Recent Activity
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => navigate('/transactions')}
                >
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => navigate('/transactions')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <transaction.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.category} • {transaction.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold ${
                        transaction.type === 'revenue' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'revenue' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Categories Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  Top Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.expenseCategories.slice(0, 4).map((category) => {
                  const budgetAmount = budget ? (budget * (category.percentage / 100)) : category.value * 1.2;
                  const percentage = (category.value / budgetAmount) * 100;
                  const isOver = category.value > budgetAmount;
                  const CategoryIcon = getCategoryIcon(category.name);
                  
                  return (
                    <div key={category.name}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{category.name}</span>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formatCurrency(category.value)} / {formatCurrency(budgetAmount)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500 rounded-full"
                          style={{ 
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: isOver ? '#EF4444' : category.color
                          }}
                        />
                      </div>
                      {isOver && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                          Over budget by {formatCurrency(category.value - budgetAmount)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Category Progress Visualization */}
        {data.expenseCategories.length > 0 && (
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Target className="h-6 w-6 text-indigo-500" />
                Category Budget Tracking
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1"
                onClick={() => navigate('/categories')}
              >
                Manage Categories
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.expenseCategories.map((category) => {
                  const budgetAmount = budget 
                    ? (budget * (category.percentage / 100)) 
                    : category.value * 1.2;
                  const percentage = (category.value / budgetAmount) * 100;
                  const isOver = category.value > budgetAmount;
                  const isNearLimit = percentage > 80 && !isOver;
                  const CategoryIcon = getCategoryIcon(category.name);
                  
                  return (
                    <div 
                      key={category.name}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                        isOver 
                          ? 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800' 
                          : isNearLimit 
                          ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800'
                          : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <CategoryIcon 
                              className="h-5 w-5" 
                              style={{ color: category.color }}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {category.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {category.percentage.toFixed(1)}% of total expenses
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            className={`${
                              isOver 
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                                : isNearLimit
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            }`}
                          >
                            {percentage.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Spent</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(category.value)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Budget</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(budgetAmount)}
                          </span>
                        </div>
                        
                        {/* Enhanced Progress Bar */}
                        <div className="relative">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full transition-all duration-700 rounded-full relative"
                              style={{ 
                                width: `${Math.min(percentage, 100)}%`,
                                backgroundColor: isOver ? '#EF4444' : category.color
                              }}
                            >
                              {/* Animated shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                            </div>
                          </div>
                          
                          {/* Progress indicators */}
                          <div className="flex justify-between mt-1 text-xs">
                            <span className="text-gray-500 dark:text-gray-400">0%</span>
                            <span className="text-gray-500 dark:text-gray-400">50%</span>
                            <span className="text-gray-500 dark:text-gray-400">100%</span>
                          </div>
                        </div>
                        
                        {/* Status Messages */}
                        {isOver && (
                          <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            Over budget by {formatCurrency(category.value - budgetAmount)}
                          </div>
                        )}
                        {isNearLimit && (
                          <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            Approaching limit - {formatCurrency(budgetAmount - category.value)} remaining
                          </div>
                        )}
                        {!isOver && !isNearLimit && (
                          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            On track - {formatCurrency(budgetAmount - category.value)} remaining
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Category Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {data.expenseCategories.filter(cat => {
                        const budgetAmount = budget 
                          ? (budget * (cat.percentage / 100)) 
                          : cat.value * 1.2;
                        return cat.value <= budgetAmount * 0.8;
                      }).length}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">On Track</div>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {data.expenseCategories.filter(cat => {
                        const budgetAmount = budget 
                          ? (budget * (cat.percentage / 100)) 
                          : cat.value * 1.2;
                        const percentage = (cat.value / budgetAmount) * 100;
                        return percentage > 80 && percentage <= 100;
                      }).length}
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Near Limit</div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {data.expenseCategories.filter(cat => {
                        const budgetAmount = budget 
                          ? (budget * (cat.percentage / 100)) 
                          : cat.value * 1.2;
                        return cat.value > budgetAmount;
                      }).length}
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">Over Budget</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Entry Point Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-indigo-500">
            <CardContent 
              className="p-6 text-center"
              onClick={() => navigate('/reports')}
            >
              <div className="inline-flex p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Detailed Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Analyze trends & patterns</p>
              <Button variant="ghost" size="sm" className="gap-1 text-indigo-600 dark:text-indigo-400">
                Explore
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-green-500">
            <CardContent 
              className="p-6 text-center"
              onClick={() => navigate('/budget-goals')}
            >
              <div className="inline-flex p-4 bg-green-100 dark:bg-green-900/30 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Budget & Goals</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Track your progress</p>
              <Button variant="ghost" size="sm" className="gap-1 text-green-600 dark:text-green-400">
                Manage
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-yellow-500">
            <CardContent 
              className="p-6 text-center"
              onClick={() => navigate('/transactions')}
            >
              <div className="inline-flex p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Achievements</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {recentTransactions.length > 0 ? `${recentTransactions.length} recent transactions!` : 'Track your milestones'}
              </p>
              <Button variant="ghost" size="sm" className="gap-1 text-yellow-600 dark:text-yellow-400">
                View All
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-purple-500">
            <CardContent 
              className="p-6 text-center"
              onClick={() => navigate('/categories')}
            >
              <div className="inline-flex p-4 bg-purple-100 dark:bg-purple-900/30 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                <Settings className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Categories</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Organize your expenses</p>
              <Button variant="ghost" size="sm" className="gap-1 text-purple-600 dark:text-purple-400">
                Configure
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </div>

      </section>
    </ErrorBoundary>
  );
}