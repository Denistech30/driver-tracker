import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parse, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Transaction } from '../lib/storage';
import { useSettings } from '../contexts/SettingsContext';
import { useBudget } from '../contexts/BudgetContext';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorBoundary from '../components/ErrorBoundary';
import { useToast } from '../hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  FileText,
  BarChart3,
  Activity,
  X,
  Eye,
  Zap,
  CircleDot,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';

// Types
interface CategoryData {
  name: string;
  current: number;
  previous: number;
  budget: number;
  color: string;
  type: 'revenue' | 'expense';
}

interface MonthlyData {
  month: string;
  currentYear: number;
  lastYear: number;
  revenue: number;
  expenses: number;
}

interface DailyData {
  day: string;
  amount: number;
  intensity: number;
}

interface WaterfallData {
  name: string;
  value: number;
  type: 'start' | 'revenue' | 'expense' | 'end';
}

interface Insight {
  type: 'success' | 'info' | 'warning';
  icon: any;
  title: string;
  message: string;
  color: string;
  textColor: string;
}

function Reports() {
  const { settings } = useSettings();
  const { budget } = useBudget();
  const { transactions: allTransactions } = useTransactions();
  const { categories: allCategories } = useCategories();
  const { toast } = useToast();

  const parseDate = (value: string | undefined | null): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  // State
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [comparisonMode, setComparisonMode] = useState('period');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(true);
  const [chartView, setChartView] = useState('trend');
  const [isLoading, setIsLoading] = useState(true);
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'revenue' | 'expense'>('all');
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsModalType, setDetailsModalType] = useState<string>('');
  const [showAIInsightsModal, setShowAIInsightsModal] = useState(false);
  
  // Navigation
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    let start: Date, end: Date;

    switch (selectedPeriod) {
      case 'today':
        start = end = now;
        break;
      case 'week':
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        start = quarterStart;
        end = endOfMonth(new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 2, 1));
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'custom':
        if (customDateFrom && customDateTo) {
          start = new Date(customDateFrom);
          end = new Date(customDateTo);
        } else {
          start = startOfMonth(now);
          end = endOfMonth(now);
        }
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return { start, end };
  };

  // Helper functions
  const formatCurrency = (amount: number): string => {
    const currencyCode = settings.currency === 'FCFA' ? 'XAF' : settings.currency;
    try {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'code',
      }).format(amount);
      return settings.currency === 'FCFA' ? formatted.replace('XAF', 'FCFA') : formatted;
    } catch (error) {
      return `${settings.currency} ${amount.toFixed(2)}`;
    }
  };

  const getCategoryChange = (cat: CategoryData) => {
    const change = cat.current - cat.previous;
    const percent = cat.previous > 0 ? ((change / cat.previous) * 100).toFixed(1) : '0';
    return { change, percent };
  };

  const getHeatmapColor = (intensity: number) => {
    if (intensity < 25) return '#dcfce7';
    if (intensity < 50) return '#86efac';
    if (intensity < 75) return '#fbbf24';
    return '#ef4444';
  };

  // Filter helper functions
  const clearFilters = () => {
    setFilterType('all');
    setFilterCategories([]);
    setFilterMinAmount('');
    setFilterMaxAmount('');
    setFilterDescription('');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterType !== 'all') count++;
    if (filterCategories.length > 0) count++;
    if (filterMinAmount || filterMaxAmount) count++;
    if (filterDescription) count++;
    return count;
  }, [filterType, filterCategories, filterMinAmount, filterMaxAmount, filterDescription]);

  const toggleCategoryFilter = (category: string) => {
    setFilterCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Modal helper functions
  const openDetailsModal = (type: string) => {
    setDetailsModalType(type);
    setShowDetailsModal(true);
  };

  // Quick Actions handlers
  const handleViewTransactions = () => {
    // Navigate to transactions page with current filters
    const params = new URLSearchParams();
    
    // Pass period filter
    if (selectedPeriod !== 'month') {
      params.set('period', selectedPeriod);
    }
    if (selectedPeriod === 'custom' && customDateFrom && customDateTo) {
      params.set('dateFrom', customDateFrom);
      params.set('dateTo', customDateTo);
    }
    
    // Pass type filter
    if (filterType !== 'all') {
      params.set('type', filterType);
    }
    
    // Pass category filters
    if (filterCategories.length > 0) {
      params.set('categories', filterCategories.join(','));
    }
    
    // Pass amount filters
    if (filterMinAmount) {
      params.set('minAmount', filterMinAmount);
    }
    if (filterMaxAmount) {
      params.set('maxAmount', filterMaxAmount);
    }
    
    // Pass description search
    if (filterDescription) {
      params.set('search', filterDescription);
    }
    
    const queryString = params.toString();
    navigate(`/transactions${queryString ? `?${queryString}` : ''}`);
  };

  const handleDownloadPDF = async () => {
    toast({
      title: 'PDF Export',
      description: 'PDF export feature coming soon! For now, use CSV export or print this page.',
      variant: 'default',
    });
    // TODO: Implement PDF export with jspdf
  };

  // Filter transactions by period AND advanced filters
  const filteredTransactions = useMemo(() => {
    const { start, end } = getDateRange();
    return allTransactions.filter((t) => {
      // Period filter
      const txDate = parseDate(t.date);
      if (!txDate) return false;
      if (txDate < start || txDate > end) return false;
      
      // Type filter
      if (filterType !== 'all' && t.type !== filterType) return false;
      
      // Category filter
      if (filterCategories.length > 0 && !filterCategories.includes(t.category)) return false;
      
      // Amount filter
      const minAmount = filterMinAmount ? parseFloat(filterMinAmount) : null;
      const maxAmount = filterMaxAmount ? parseFloat(filterMaxAmount) : null;
      if (minAmount !== null && t.amount < minAmount) return false;
      if (maxAmount !== null && t.amount > maxAmount) return false;
      
      // Description filter
      if (filterDescription && !t.description?.toLowerCase().includes(filterDescription.toLowerCase())) {
        if (!t.category.toLowerCase().includes(filterDescription.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });
  }, [allTransactions, selectedPeriod, customDateFrom, customDateTo, filterType, filterCategories, filterMinAmount, filterMaxAmount, filterDescription]);

  // Get previous period transactions for comparison
  const previousPeriodTransactions = useMemo(() => {
    const { start, end } = getDateRange();
    const duration = Math.max(end.getTime() - start.getTime(), 0);
    if (duration === 0) return [];
    const prevStart = new Date(start.getTime() - duration);
    const prevEnd = new Date(end.getTime() - duration);

    return allTransactions.filter((t) => {
      const txDate = parseDate(t.date);
      if (!txDate) return false;
      return txDate >= prevStart && txDate <= prevEnd;
    });
  }, [allTransactions, selectedPeriod, customDateFrom, customDateTo]);

  // Calculate current period stats
  const currentPeriod = useMemo(() => {
    const revenue = filteredTransactions
      .filter((t) => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { revenue, expenses, net: revenue - expenses };
  }, [filteredTransactions]);

  // Calculate previous period stats
  const previousPeriod = useMemo(() => {
    const revenue = previousPeriodTransactions
      .filter((t) => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = previousPeriodTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { revenue, expenses, net: revenue - expenses };
  }, [previousPeriodTransactions]);

  // Calculate trends
  const trends = useMemo(() => {
    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(1);
    };
    return {
      revenue: calcTrend(currentPeriod.revenue, previousPeriod.revenue),
      expenses: calcTrend(currentPeriod.expenses, previousPeriod.expenses),
      net: calcTrend(currentPeriod.net, previousPeriod.net),
    };
  }, [currentPeriod, previousPeriod]);

  // Generate category data
  const categoryData = useMemo((): CategoryData[] => {
    const categoryColors: Record<string, string> = {
      Groceries: '#3B82F6',
      Dining: '#10B981',
      Transport: '#F59E0B',
      Shopping: '#EF4444',
      Bills: '#8B5CF6',
      Entertainment: '#EC4899',
      Salary: '#10B981',
      Freelance: '#3B82F6',
    };

    const currentCats: Record<string, { amount: number; type: 'revenue' | 'expense' }> = {};
    const previousCats: Record<string, number> = {};

    filteredTransactions.forEach((t) => {
      if (!currentCats[t.category]) {
        currentCats[t.category] = { amount: 0, type: t.type };
      }
      currentCats[t.category].amount += t.amount;
    });

    previousPeriodTransactions.forEach((t) => {
      previousCats[t.category] = (previousCats[t.category] || 0) + t.amount;
    });

    // Calculate budget allocation per category based on spending proportion
    const totalExpenses = Object.keys(currentCats)
      .filter(cat => currentCats[cat].type === 'expense')
      .reduce((sum, cat) => sum + currentCats[cat].amount, 0);

    return Object.keys(currentCats).map((name) => {
      // Allocate budget proportionally for expense categories
      let categoryBudget = 0;
      if (currentCats[name].type === 'expense' && budget > 0 && totalExpenses > 0) {
        const proportion = currentCats[name].amount / totalExpenses;
        categoryBudget = budget * proportion;
      }

      return {
        name,
        current: currentCats[name].amount,
        previous: previousCats[name] || 0,
        budget: categoryBudget,
        color: categoryColors[name] || '#6B7280',
        type: currentCats[name].type,
      };
    });
  }, [filteredTransactions, previousPeriodTransactions, budget]);

  // Generate monthly comparison data
  const monthlyData = useMemo((): MonthlyData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    return months.map((month, idx) => {
      const currentYearTxns = allTransactions.filter((t) => {
        const txDate = parseDate(t.date);
        if (!txDate) return false;
        return txDate.getFullYear() === currentYear && txDate.getMonth() === idx;
      });

      const lastYearTxns = allTransactions.filter((t) => {
        const txDate = parseDate(t.date);
        if (!txDate) return false;
        return txDate.getFullYear() === currentYear - 1 && txDate.getMonth() === idx;
      });

      const currentYearTotal = currentYearTxns.reduce((sum, t) => sum + t.amount, 0);
      const lastYearTotal = lastYearTxns.reduce((sum, t) => sum + t.amount, 0);
      const revenue = currentYearTxns.filter((t) => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
      const expenses = currentYearTxns.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      return {
        month,
        currentYear: currentYearTotal,
        lastYear: lastYearTotal,
        revenue,
        expenses,
      };
    });
  }, [allTransactions]);

  // Generate daily data for heatmap
  const dailyData = useMemo((): DailyData[] => {
    const dailyMap: Record<string, number> = {};
    filteredTransactions.forEach((t) => {
      const txDate = parseDate(t.date);
      if (!txDate) return;
      const day = format(txDate, 'MMM dd');
      dailyMap[day] = (dailyMap[day] || 0) + t.amount;
    });

    const maxAmount = Math.max(...Object.values(dailyMap), 1);
    return Object.entries(dailyMap).map(([day, amount]) => ({
      day,
      amount,
      intensity: (amount / maxAmount) * 100,
    }));
  }, [filteredTransactions]);

  // Generate waterfall data
  const waterfallData = useMemo((): WaterfallData[] => {
    const data: WaterfallData[] = [{ name: 'Starting', value: 0, type: 'start' }];

    const revenueCats = categoryData.filter((c) => c.type === 'revenue');
    const expenseCats = categoryData.filter((c) => c.type === 'expense');

    revenueCats.forEach((cat) => {
      data.push({ name: cat.name, value: cat.current, type: 'revenue' });
    });

    expenseCats.forEach((cat) => {
      data.push({ name: cat.name, value: -cat.current, type: 'expense' });
    });

    data.push({ name: 'Ending', value: currentPeriod.net, type: 'end' });
    return data;
  }, [categoryData, currentPeriod]);

  // Generate smart insights
  const insights = useMemo((): Insight[] => {
    const result: Insight[] = [];

    // Expense reduction
    if (Number(trends.expenses) < -5) {
      result.push({
        type: 'success',
        icon: CheckCircle2,
        title: 'Expense Reduction Success',
        message: `You spent ${Math.abs(Number(trends.expenses))}% less this period compared to the previous period. Great job!`,
        color: 'border-green-200 bg-green-50 dark:bg-green-900/20',
        textColor: 'text-green-800 dark:text-green-200',
      });
    }

    // Revenue increase
    if (Number(trends.revenue) > 10) {
      result.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Revenue Growth',
        message: `Your revenue increased by ${trends.revenue}% compared to the previous period!`,
        color: 'border-green-200 bg-green-50 dark:bg-green-900/20',
        textColor: 'text-green-800 dark:text-green-200',
      });
    }

    // Category warning
    const increasedCats = categoryData.filter((c) => {
      const change = ((c.current - c.previous) / (c.previous || 1)) * 100;
      return change > 25 && c.type === 'expense';
    });

    if (increasedCats.length > 0) {
      const cat = increasedCats[0];
      const change = ((cat.current - cat.previous) / (cat.previous || 1)) * 100;
      result.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Category Alert',
        message: `${cat.name} expenses increased by ${change.toFixed(1)}% from ${formatCurrency(cat.previous)} to ${formatCurrency(cat.current)}.`,
        color: 'border-orange-200 bg-orange-50 dark:bg-orange-900/20',
        textColor: 'text-orange-800 dark:text-orange-200',
      });
    }

    // Spending pattern
    if (filteredTransactions.length > 10) {
      result.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Spending Pattern Detected',
        message: `You made ${filteredTransactions.length} transactions this period. Consider reviewing for optimization opportunities.`,
        color: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20',
        textColor: 'text-blue-800 dark:text-blue-200',
      });
    }

    return result;
  }, [trends, categoryData, filteredTransactions, formatCurrency]);

  // Generate enhanced AI recommendations
  const aiRecommendations = useMemo(() => {
    const recommendations: Array<{
      title: string;
      description: string;
      action: string;
      priority: 'high' | 'medium' | 'low';
      icon: any;
    }> = [];

    // Budget-based recommendations
    if (budget > 0) {
      const budgetUsage = (currentPeriod.expenses / budget) * 100;
      
      if (budgetUsage > 100) {
        recommendations.push({
          title: 'Budget Exceeded',
          description: `You've exceeded your budget by ${formatCurrency(currentPeriod.expenses - budget)}. Consider reviewing your expenses.`,
          action: 'Review high-spending categories and identify areas to cut back.',
          priority: 'high',
          icon: AlertCircle,
        });
      } else if (budgetUsage > 80) {
        recommendations.push({
          title: 'Approaching Budget Limit',
          description: `You've used ${budgetUsage.toFixed(0)}% of your monthly budget.`,
          action: 'Monitor remaining spending carefully for the rest of the month.',
          priority: 'medium',
          icon: AlertCircle,
        });
      } else if (budgetUsage < 50) {
        recommendations.push({
          title: 'Great Budget Management',
          description: `You're only at ${budgetUsage.toFixed(0)}% of your budget. Well done!`,
          action: 'Consider saving the surplus or investing it for future goals.',
          priority: 'low',
          icon: CheckCircle2,
        });
      }
    }

    // Category-based recommendations
    const topExpenseCategory = categoryData
      .filter(c => c.type === 'expense')
      .sort((a, b) => b.current - a.current)[0];
    
    if (topExpenseCategory && topExpenseCategory.current > 0) {
      const categoryPercent = (topExpenseCategory.current / currentPeriod.expenses) * 100;
      if (categoryPercent > 40) {
        recommendations.push({
          title: `High ${topExpenseCategory.name} Spending`,
          description: `${topExpenseCategory.name} accounts for ${categoryPercent.toFixed(0)}% of your expenses (${formatCurrency(topExpenseCategory.current)}).`,
          action: `Look for ways to reduce ${topExpenseCategory.name} costs or set a specific budget for this category.`,
          priority: 'medium',
          icon: TrendingDown,
        });
      }
    }

    // Trend-based recommendations
    if (Number(trends.expenses) > 20) {
      recommendations.push({
        title: 'Rising Expenses Trend',
        description: `Your expenses increased by ${trends.expenses}% compared to the previous period.`,
        action: 'Analyze what caused the increase and create a plan to control spending.',
        priority: 'high',
        icon: TrendingUp,
      });
    }

    if (Number(trends.revenue) < -10) {
      recommendations.push({
        title: 'Declining Revenue',
        description: `Your revenue decreased by ${Math.abs(Number(trends.revenue))}% compared to the previous period.`,
        action: 'Consider diversifying income sources or reviewing pricing strategies.',
        priority: 'high',
        icon: TrendingDown,
      });
    }

    // Positive reinforcement
    if (currentPeriod.net > 0 && Number(trends.net) > 0) {
      recommendations.push({
        title: 'Positive Cash Flow',
        description: `You have a net income of ${formatCurrency(currentPeriod.net)}, up ${trends.net}% from last period.`,
        action: 'Consider allocating surplus to savings, investments, or debt reduction.',
        priority: 'low',
        icon: CheckCircle2,
      });
    }

    // Transaction volume insights
    if (filteredTransactions.length > 50) {
      recommendations.push({
        title: 'High Transaction Volume',
        description: `You made ${filteredTransactions.length} transactions this period.`,
        action: 'Consider consolidating purchases or using bulk buying to reduce transaction frequency.',
        priority: 'low',
        icon: Lightbulb,
      });
    }

    return recommendations;
  }, [budget, currentPeriod, categoryData, trends, filteredTransactions, formatCurrency]);

  const handleExportCSV = () => {
    if (!filteredTransactions.length) {
      toast({
        title: 'No Data to Export',
        description: 'There are no transactions in the selected period.',
        variant: 'default',
      });
      return;
    }

    const data = filteredTransactions.map((t) => ({
      Date: t.date,
      Type: t.type,
      Category: t.category,
      Amount: t.amount.toFixed(2),
      Description: t.description || '',
    }));

    const header = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).join(','));
    const csv = [header, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Report Exported',
      description: 'Your financial report has been downloaded as CSV.',
      variant: 'default',
    });
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Financial Reports</h2>
        <SkeletonLoader type="card" />
      </section>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="w-full md:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Financial Reports</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Deep dive into your financial performance</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button 
                variant="outline" 
                className="gap-1 sm:gap-2 relative flex-1 sm:flex-none text-xs sm:text-sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sm:hidden">Filter</span>
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center bg-blue-600 text-white text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
                {showFilters ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 ml-1" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />}
              </Button>
              <Button
                onClick={handleExportCSV}
                className="gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                style={{ background: 'linear-gradient(to right, #2B6CB0, #4A90E2)', color: 'white' }}
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Advanced Filters
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Transaction Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Transaction Type</Label>
                  <div className="flex gap-2 flex-wrap">
                    {(['all', 'revenue', 'expense'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          filterType === type
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Categories</Label>
                  <div className="flex gap-2 flex-wrap">
                    {allCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategoryFilter(cat.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          filterCategories.includes(cat.name)
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Range Filter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minAmount" className="text-sm font-medium">Min Amount</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      placeholder="0.00"
                      value={filterMinAmount}
                      onChange={(e) => setFilterMinAmount(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAmount" className="text-sm font-medium">Max Amount</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      placeholder="10000.00"
                      value={filterMaxAmount}
                      onChange={(e) => setFilterMaxAmount(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Description Search */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Search Description/Category</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="description"
                      type="text"
                      placeholder="Search transactions..."
                      value={filterDescription}
                      onChange={(e) => setFilterDescription(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>

                {/* Filter Summary */}
                {activeFilterCount > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} with {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Period Selector */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col gap-4">
                {/* Period Buttons */}
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  {['Today', 'Week', 'Month', 'Quarter', 'Year', 'Custom'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period.toLowerCase())}
                      className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        selectedPeriod === period.toLowerCase()
                          ? 'text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={
                        selectedPeriod === period.toLowerCase()
                          ? { background: 'linear-gradient(to right, #2B6CB0, #4A90E2)' }
                          : {}
                      }
                    >
                      {period}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range */}
                {selectedPeriod === 'custom' && (
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      className="w-full sm:w-auto px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-xs sm:text-sm"
                    />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">to</span>
                    <input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      className="w-full sm:w-auto px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-xs sm:text-sm"
                    />
                  </div>
                )}

                {/* Comparison Mode */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Compare with:</span>
                  <select
                    value={comparisonMode}
                    onChange={(e) => setComparisonMode(e.target.value)}
                    className="w-full sm:w-auto px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-xs sm:text-sm"
                  >
                    <option value="period">Previous Period</option>
                    <option value="year">Last Year</option>
                    <option value="budget">Budget</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Smart Insights Panel */}
          {showInsights && insights.length > 0 && (
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <Card key={idx} className={`border-2 ${insight.color}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${insight.color}`}>
                        <insight.icon className={`h-5 w-5 ${insight.textColor}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold mb-1 ${insight.textColor}`}>{insight.title}</h4>
                        <p className={`text-sm ${insight.textColor}`}>{insight.message}</p>
                      </div>
                      <button
                        onClick={() => setShowInsights(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenue Card */}
            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <Badge
                    className={`${
                      Number(trends.revenue) >= 0
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    {Number(trends.revenue) >= 0 ? '+' : ''}
                    {trends.revenue}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(currentPeriod.revenue)}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      Previous: {formatCurrency(previousPeriod.revenue)}
                    </span>
                    <span
                      className={
                        Number(trends.revenue) >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {Number(trends.revenue) >= 0 ? '↑' : '↓'} $
                      {Math.abs(currentPeriod.revenue - previousPeriod.revenue).toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000"
                    style={{ width: '85%' }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Expenses Card */}
            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <Badge
                    className={`${
                      Number(trends.expenses) <= 0
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    {Number(trends.expenses) >= 0 ? '+' : ''}
                    {trends.expenses}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Expenses</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(currentPeriod.expenses)}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      Previous: {formatCurrency(previousPeriod.expenses)}
                    </span>
                    <span
                      className={
                        Number(trends.expenses) <= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {Number(trends.expenses) >= 0 ? '↑' : '↓'} $
                      {Math.abs(currentPeriod.expenses - previousPeriod.expenses).toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-1000"
                    style={{ width: '55%' }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Net Income Card */}
            <Card
              className="hover:shadow-xl transition-shadow text-white"
              style={{ background: 'linear-gradient(135deg, #2B6CB0 0%, #4A90E2 50%, #1E4A78 100%)' }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <Badge className="bg-white/20 backdrop-blur text-white border-white/30">
                    {Number(trends.net) >= 0 ? '+' : ''}
                    {trends.net}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-blue-100">Net Income</p>
                  <p className="text-3xl font-bold">{formatCurrency(currentPeriod.net)}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-100">Previous: {formatCurrency(previousPeriod.net)}</span>
                    <span className="text-white font-medium">
                      {Number(trends.net) >= 0 ? '↑' : '↓'} $
                      {Math.abs(currentPeriod.net - previousPeriod.net).toFixed(0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart View Selector */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {[
                  { id: 'trend', label: 'Spending Trends', shortLabel: 'Trends', icon: Activity },
                  { id: 'comparison', label: 'Period Comparison', shortLabel: 'Compare', icon: BarChart3 },
                  { id: 'category', label: 'Category Breakdown', shortLabel: 'Categories', icon: CircleDot },
                  { id: 'heatmap', label: 'Spending Heatmap', shortLabel: 'Heatmap', icon: Calendar },
                  { id: 'waterfall', label: 'Money Flow', shortLabel: 'Flow', icon: TrendingDown },
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setChartView(view.id)}
                    className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                      chartView === view.id
                        ? 'text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={
                      chartView === view.id
                        ? { background: 'linear-gradient(to right, #2B6CB0, #4A90E2)' }
                        : {}
                    }
                  >
                    <view.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{view.label}</span>
                    <span className="sm:hidden">{view.shortLabel}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Chart Display */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <span className="text-base sm:text-lg">
                  {chartView === 'trend' && 'Spending Trends Over Time'}
                  {chartView === 'comparison' && 'Period-over-Period Comparison'}
                  {chartView === 'category' && 'Category Analysis'}
                  {chartView === 'heatmap' && 'Daily Spending Heatmap'}
                  {chartView === 'waterfall' && 'Cash Flow Waterfall'}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto"
                  onClick={() => openDetailsModal(chartView)}
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  View Details
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 md:p-6">
              {/* Spending Trends */}
              {chartView === 'trend' && (
                <ResponsiveContainer width="100%" height={300} className="sm:!h-[400px]">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3CB371"
                      strokeWidth={3}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#FF6B6B"
                      strokeWidth={3}
                      name="Expenses"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {/* Period Comparison */}
              {chartView === 'comparison' && (
                <ResponsiveContainer width="100%" height={300} className="sm:!h-[400px]">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="currentYear" fill="#2B6CB0" name="This Year" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="lastYear" fill="#4A90E2" name="Last Year" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Category Breakdown */}
              {chartView === 'category' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <ResponsiveContainer width="100%" height={280} className="sm:!h-[350px]">
                    <PieChart>
                      <Pie
                        data={categoryData as unknown as Record<string, unknown>[]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }: { name?: string; value?: number }) =>
                          `${name ?? ''} (${formatCurrency(typeof value === 'number' ? value : 0)})`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="current"
                        onClick={(d: any) => setSelectedCategory(d?.name ?? d?.payload?.name ?? null)}
                        cursor="pointer"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            opacity={selectedCategory === entry.name || !selectedCategory ? 1 : 0.3}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Category Details</h4>
                    {categoryData.map((cat) => {
                      const { change, percent } = getCategoryChange(cat);
                      const isIncrease = change > 0;
                      return (
                        <div
                          key={cat.name}
                          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                            selectedCategory === cat.name
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          onClick={() => setSelectedCategory(cat.name)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span className="font-medium dark:text-gray-100">{cat.name}</span>
                            </div>
                            <Badge
                              className={
                                isIncrease
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              }
                            >
                              {isIncrease ? '+' : ''}
                              {percent}%
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              Current: {formatCurrency(cat.current)}
                            </span>
                            <span className="text-gray-500 dark:text-gray-500">
                              Prev: {formatCurrency(cat.previous)}
                            </span>
                          </div>
                          <div className="mt-2">
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full transition-all duration-500"
                                style={{
                                  width: `${Math.min((cat.current / cat.budget) * 100, 100)}%`,
                                  backgroundColor: cat.current > cat.budget ? '#EF4444' : cat.color,
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatCurrency(cat.current)} of {formatCurrency(cat.budget)} budget (
                              {((cat.current / cat.budget) * 100).toFixed(0)}%)
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Spending Heatmap */}
              {chartView === 'heatmap' && (
                <div>
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-gray-600 dark:text-gray-400">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {dailyData.slice(0, 35).map((day, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                        style={{ backgroundColor: getHeatmapColor(day.intensity) }}
                        title={`${day.day}: ${formatCurrency(day.amount)}`}
                      >
                        {idx + 1}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Less</span>
                    <div className="flex gap-1">
                      {['#dcfce7', '#86efac', '#fbbf24', '#ef4444'].map((color) => (
                        <div key={color} className="w-6 h-6 rounded" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">More</span>
                  </div>
                </div>
              )}

              {/* Waterfall Chart */}
              {chartView === 'waterfall' && (
                <div>
                  <ResponsiveContainer width="100%" height={300} className="sm:!h-[400px]">
                    <ComposedChart data={waterfallData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8">
                        {waterfallData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.type === 'revenue'
                                ? '#3CB371'
                                : entry.type === 'expense'
                                ? '#FF6B6B'
                                : '#2B6CB0'
                            }
                          />
                        ))}
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
                    Visual representation of how your money flows from income to expenses
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={handleDownloadPDF}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Export Options</p>
                    <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Download Report</p>
                  </div>
                  <Download className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: '#2B6CB0' }} />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={handleViewTransactions}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Detailed Analysis</p>
                    <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">View Transactions</p>
                  </div>
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: '#3CB371' }} />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer sm:col-span-2 md:col-span-1"
              onClick={() => setShowAIInsightsModal(true)}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">AI Insights</p>
                    <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Get Recommendations</p>
                  </div>
                  <Zap className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: '#F59E0B' }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chart Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {detailsModalType === 'trend' && 'Spending Trends Details'}
                {detailsModalType === 'comparison' && 'Period Comparison Details'}
                {detailsModalType === 'category' && 'Category Breakdown Details'}
                {detailsModalType === 'heatmap' && 'Daily Spending Details'}
                {detailsModalType === 'waterfall' && 'Cash Flow Details'}
              </DialogTitle>
              <DialogDescription>
                Detailed view of your financial data for the selected period
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Trend Details */}
              {detailsModalType === 'trend' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(currentPeriod.revenue)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(currentPeriod.expenses)}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-2 text-left">Month</th>
                          <th className="px-4 py-2 text-right">Revenue</th>
                          <th className="px-4 py-2 text-right">Expenses</th>
                          <th className="px-4 py-2 text-right">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.filter(m => m.revenue > 0 || m.expenses > 0).map((month) => (
                          <tr key={month.month} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="px-4 py-2">{month.month}</td>
                            <td className="px-4 py-2 text-right text-green-600">{formatCurrency(month.revenue)}</td>
                            <td className="px-4 py-2 text-right text-red-600">{formatCurrency(month.expenses)}</td>
                            <td className={`px-4 py-2 text-right font-semibold ${month.revenue - month.expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(month.revenue - month.expenses)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Comparison Details */}
              {detailsModalType === 'comparison' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left">Month</th>
                        <th className="px-4 py-2 text-right">This Year</th>
                        <th className="px-4 py-2 text-right">Last Year</th>
                        <th className="px-4 py-2 text-right">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((month) => {
                        const change = month.currentYear - month.lastYear;
                        const changePercent = month.lastYear > 0 ? ((change / month.lastYear) * 100).toFixed(1) : '0';
                        return (
                          <tr key={month.month} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="px-4 py-2">{month.month}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(month.currentYear)}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(month.lastYear)}</td>
                            <td className={`px-4 py-2 text-right font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {change >= 0 ? '+' : ''}{changePercent}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Category Details */}
              {detailsModalType === 'category' && (
                <div className="space-y-4">
                  {categoryData.map((cat) => {
                    const { change, percent } = getCategoryChange(cat);
                    return (
                      <Card key={cat.name}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} />
                              <h4 className="font-semibold">{cat.name}</h4>
                              <Badge variant={cat.type === 'revenue' ? 'default' : 'destructive'}>
                                {cat.type}
                              </Badge>
                            </div>
                            <Badge className={change >= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                              {change >= 0 ? '+' : ''}{percent}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Current</p>
                              <p className="font-semibold">{formatCurrency(cat.current)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Previous</p>
                              <p className="font-semibold">{formatCurrency(cat.previous)}</p>
                            </div>
                            {cat.budget > 0 && (
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Budget</p>
                                <p className="font-semibold">{formatCurrency(cat.budget)}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Heatmap Details */}
              {detailsModalType === 'heatmap' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left">Day</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-right">Intensity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.map((day, idx) => (
                        <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="px-4 py-2">{day.day}</td>
                          <td className="px-4 py-2 text-right font-semibold">{formatCurrency(day.amount)}</td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div 
                                className="w-12 h-4 rounded" 
                                style={{ backgroundColor: getHeatmapColor(day.intensity) }}
                              />
                              <span>{day.intensity.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Waterfall Details */}
              {detailsModalType === 'waterfall' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Starting Balance</p>
                        <p className="text-2xl font-bold">$0.00</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Inflow</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(currentPeriod.revenue)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Outflow</p>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(currentPeriod.expenses)}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-2 text-left">Category</th>
                          <th className="px-4 py-2 text-center">Type</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {waterfallData.filter(w => w.type !== 'start' && w.type !== 'end').map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="px-4 py-2">{item.name}</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant={item.type === 'revenue' ? 'default' : 'destructive'}>
                                {item.type}
                              </Badge>
                            </td>
                            <td className={`px-4 py-2 text-right font-semibold ${item.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(Math.abs(item.value))}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 dark:bg-gray-800 font-bold">
                          <td className="px-4 py-2">Ending Balance</td>
                          <td className="px-4 py-2"></td>
                          <td className={`px-4 py-2 text-right ${currentPeriod.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(currentPeriod.net)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Insights Modal */}
        <Dialog open={showAIInsightsModal} onOpenChange={setShowAIInsightsModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-500" />
                AI-Powered Financial Insights
              </DialogTitle>
              <DialogDescription>
                Personalized recommendations based on your spending patterns and financial goals
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Period</p>
                    <p className="text-lg font-bold capitalize">{selectedPeriod}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transactions</p>
                    <p className="text-lg font-bold">{filteredTransactions.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Income</p>
                    <p className={`text-lg font-bold ${currentPeriod.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(currentPeriod.net)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              {aiRecommendations.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold mb-3">Personalized Recommendations</h3>
                  {aiRecommendations.map((rec, idx) => {
                    const Icon = rec.icon;
                    const priorityColors = {
                      high: 'border-red-200 bg-red-50 dark:bg-red-900/20',
                      medium: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20',
                      low: 'border-green-200 bg-green-50 dark:bg-green-900/20',
                    };
                    const priorityTextColors = {
                      high: 'text-red-800 dark:text-red-200',
                      medium: 'text-yellow-800 dark:text-yellow-200',
                      low: 'text-green-800 dark:text-green-200',
                    };

                    return (
                      <Card key={idx} className={`border-2 ${priorityColors[rec.priority]}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${priorityColors[rec.priority]}`}>
                              <Icon className={`h-5 w-5 ${priorityTextColors[rec.priority]}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className={`font-semibold ${priorityTextColors[rec.priority]}`}>
                                  {rec.title}
                                </h4>
                                <Badge 
                                  variant={rec.priority === 'high' ? 'destructive' : 'default'}
                                  className="text-xs"
                                >
                                  {rec.priority.toUpperCase()}
                                </Badge>
                              </div>
                              <p className={`text-sm mb-2 ${priorityTextColors[rec.priority]}`}>
                                {rec.description}
                              </p>
                              <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                  💡 Action Step:
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {rec.action}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No specific recommendations at this time. Keep tracking your transactions for personalized insights!
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Additional Tips */}
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Pro Tips
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <li>• Set a monthly budget to get more accurate recommendations</li>
                    <li>• Track transactions regularly for better insights</li>
                    <li>• Review your reports weekly to stay on top of spending</li>
                    <li>• Use categories consistently for better analysis</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}

export default Reports;
