import { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { getSummary, getExpenseCategories } from '../lib/storage';
import { useSettings } from '../contexts/SettingsContext';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorBoundary from '../components/ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useTranslation } from '../hooks/useTranslation';
import { BudgetAnalysis } from '../components/BudgetAnalysis';
import { useBudget } from '../contexts/BudgetContext';
import BudgetSettingsModal from '../components/BudgetSettingsModal';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

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
  viewMode: 'expenses' | 'financial';
}

export default function Overview() {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { analysis } = useBudget(); // Get analysis from context
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [data, setData] = useState<ChartData>({
    revenue: 0,
    expenses: 0,
    netIncome: 0,
    expenseCategories: [],
    viewMode: 'financial', // Default to financial overview
  });

  useEffect(() => {
    const loadData = () => {
      const summary = getSummary();
      const categories = getExpenseCategories();
      
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
        viewMode: enhancedCategories.length > 0 ? 'expenses' : 'financial',
      });
      setIsLoading(false);
    };
    // Load data with a small delay to show loading state
    setTimeout(loadData, 500);
  }, []);

  const formatCurrency = (amount: number) => {
    const currencyCode = settings.currency === 'FCFA' ? 'XAF' : settings.currency;
    try {
      const formatted = new Intl.NumberFormat(settings.language || 'en-US', { // Fallback to 'en-US'
        style: 'currency', currency: currencyCode, currencyDisplay: 'code'
      }).format(amount);
      return settings.currency === 'FCFA' ? formatted.replace('XAF', 'FCFA') : formatted;
    } catch (error) {
      console.error('Error formatting currency:', error);
      // Fallback basic formatting
      return `${amount.toFixed(2)} ${currencyCode.replace('XAF', 'FCFA')}`;
    }
  };

  const toggleChartType = () => setChartType(prevType => (prevType === 'pie' ? 'bar' : 'pie'));
  
  const toggleViewMode = () => setData(prevData => ({ 
    ...prevData, 
    viewMode: prevData.viewMode === 'expenses' ? 'financial' : 'expenses' 
  }));

  const pieChartData = data.viewMode === 'expenses' ? {
    labels: data.expenseCategories.map(cat => cat.name), // Category names are dynamic, not translation keys
    datasets: [{
      data: data.expenseCategories.map(cat => cat.value),
      backgroundColor: data.expenseCategories.map(cat => cat.color),
      borderColor: 'hsl(var(--card))', 
      borderWidth: 2,
    }],
  } : {
    labels: [t('overview.revenue'), t('overview.expenses')],
    datasets: [{
      data: [data.revenue, data.expenses],
      backgroundColor: ['hsl(150, 80%, 40%)', 'hsl(350, 85%, 50%)'], // Green for revenue, Red for expenses
      borderColor: 'hsl(var(--card))', 
      borderWidth: 2,
    }],
  };

  const barChartData = data.viewMode === 'expenses' ? {
    labels: data.expenseCategories.map(cat => cat.name), // Category names are dynamic, not translation keys
    datasets: [{
      label: t('overview.expenses'), 
      data: data.expenseCategories.map(cat => cat.value),
      backgroundColor: data.expenseCategories.map(cat => cat.color),
      borderColor: data.expenseCategories.map(cat => cat.color), 
      borderWidth: 1,
    }],
  } : {
    labels: [t('overview.revenue'), t('overview.expenses')],
    datasets: [{
      label: t('overview.amountLabel'), 
      data: [data.revenue, data.expenses],
      backgroundColor: ['hsl(150, 80%, 40%)', 'hsl(350, 85%, 50%)'],
      borderColor: ['hsl(150, 80%, 40%)', 'hsl(350, 85%, 50%)'], 
      borderWidth: 1,
    }],
  };
  
  const chartFontColor = document.documentElement.classList.contains('dark') ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))';

  const commonChartOptions: any = {
    responsive: true, 
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom' as const, 
        labels: { 
          color: chartFontColor,
          padding: 20, 
          font: { size: 12 },
          usePointStyle: true,
          pointStyle: 'circle',
        } 
      },
      tooltip: {
        backgroundColor: 'hsl(var(--background))', 
        titleColor: 'hsl(var(--foreground))',
        bodyColor: 'hsl(var(--foreground))', 
        borderColor: 'hsl(var(--border))',
        borderWidth: 1, 
        padding: 12, 
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const rawValue = context.raw as number;
            let label = context.label || '';
            let valueStr = formatCurrency(rawValue);
            
            if (data.viewMode === 'expenses') {
              // Ensure context.dataIndex is valid for expenseCategories
              const category = data.expenseCategories[context.dataIndex];
              const percentage = category?.percentage?.toFixed(1) || '0.0';
              return `${label}: ${valueStr} (${percentage}%)`;
            } else { // Financial overview
              const total = data.revenue + Math.abs(data.expenses || 0); // Ensure expenses is not undefined
              const percentage = total !== 0 ? ((rawValue / total) * 100).toFixed(1) : '0.0';
              return `${label}: ${valueStr} (${percentage}%)`;
            }
          },
        },
      },
    },
  };

  const pieChartOptions: any = { 
    ...commonChartOptions, 
    elements: { arc: { borderWidth: 2, borderColor: 'hsl(var(--background))' } },
  };
  
  const barChartOptions: any = {
    ...commonChartOptions,
    plugins: { ...commonChartOptions.plugins, legend: { ...commonChartOptions.plugins.legend, display: false } },
    scales: {
      y: {
        beginAtZero: true, 
        grid: { color: 'hsl(var(--border))', drawBorder: false },
        ticks: { padding: 8, callback: (value: any) => formatCurrency(value), color: chartFontColor, font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: chartFontColor, font: { size: 11 } },
      },
    },
  };

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

        {/* Dashboard Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('overview.revenue')}</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-green-500 lucide lucide-trending-up"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(data.revenue)}</div>
              <p className="text-xs text-muted-foreground">{t('overview.totalRevenueDescription')}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('overview.expenses')}</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-red-500 lucide lucide-trending-down"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(data.expenses)}</div>
               <p className="text-xs text-muted-foreground">{t('overview.totalExpensesDescription')}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('overview.netIncome')}</CardTitle>
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${data.netIncome >= 0 ? 'text-blue-500' : 'text-orange-500'} lucide lucide-landmark`}><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.netIncome >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {formatCurrency(data.netIncome)}
              </div>
              <p className="text-xs text-muted-foreground">{t('overview.netIncomeDescription')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary Card (Chart and Table) */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {data.viewMode === 'expenses' ? t('overview.expenseSummaryTitle') : t('overview.financialSummaryTitle')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={toggleViewMode} size="sm" variant="outline" className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                {data.viewMode === 'expenses' ? t('overview.toggleFinancialOverview') : t('overview.toggleExpenseCategories')}
              </Button>
              <Button onClick={toggleChartType} size="sm" variant="outline" className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-2"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
                {chartType === 'pie' ? t('overview.toggleBarChart') : t('overview.togglePieChart')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {(data.viewMode === 'financial' && (data.revenue === 0 && data.expenses === 0)) || (data.viewMode === 'expenses' && data.expenseCategories.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-database-zap h-12 w-12 text-muted-foreground mb-4"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 12 22A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 12 15A9 3 0 0 0 21 12"/><path d="M13 22V15L10 19L13 22"/><path d="M16 12L14 15H18L16 18"/></svg>
                <p className="text-lg font-medium text-muted-foreground">{t('overview.noData')}</p>
                <p className="text-sm text-muted-foreground">{t('overview.noDataDescription')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-x-8 gap-y-6 items-start">
                <div className="md:col-span-2 h-72 sm:h-80 md:h-96 relative">
                  {chartType === 'pie' ? (
                     <Pie data={pieChartData} options={pieChartOptions} />
                  ) : (
                     <Bar data={barChartData} options={barChartOptions} />
                  )}
                </div>
                <div className="md:col-span-3 overflow-x-auto">
                  {data.viewMode === 'expenses' ? (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 dark:bg-muted/30">
                        <tr className="border-b dark:border-gray-700">
                          <th className="px-4 py-3 font-semibold text-muted-foreground tracking-wider">{t('overview.category')}</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground text-right tracking-wider">{t('overview.amountLabel')}</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground text-right tracking-wider">{t('overview.percentage')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.expenseCategories.map((category) => (
                          <tr key={category.name} className="border-b dark:border-gray-800 hover:bg-muted/20 dark:hover:bg-muted/10 transition-colors duration-150">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                                <span className="font-medium text-gray-700 dark:text-gray-300">{category.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-mono">{formatCurrency(category.value)}</td>
                            <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-mono">{category.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                        <tr className="font-bold bg-muted/50 dark:bg-muted/30 text-gray-800 dark:text-gray-200">
                          <td className="px-4 py-3 ">{t('overview.totalExpenses')}</td>
                          <td className="px-4 py-3 text-right font-mono">{formatCurrency(data.expenses)}</td>
                          <td className="px-4 py-3 text-right font-mono">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : ( // Financial Overview Table
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 dark:bg-muted/30">
                        <tr className="border-b dark:border-gray-700">
                          <th className="px-4 py-3 font-semibold text-muted-foreground tracking-wider">{t('overview.financialEntryType')}</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground text-right tracking-wider">{t('overview.amountLabel')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b dark:border-gray-800 hover:bg-muted/20 dark:hover:bg-muted/10 transition-colors duration-150">
                          <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{t('overview.revenue')}</td>
                          <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-mono">{formatCurrency(data.revenue)}</td>
                        </tr>
                        <tr className="border-b dark:border-gray-800 hover:bg-muted/20 dark:hover:bg-muted/10 transition-colors duration-150">
                          <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{t('overview.expenses')}</td>
                          <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 font-mono">{formatCurrency(data.expenses)}</td>
                        </tr>
                        <tr className="font-bold bg-muted/50 dark:bg-muted/30 text-gray-800 dark:text-gray-200">
                          <td className="px-4 py-3">{t('overview.netIncome')}</td>
                          <td className={`px-4 py-3 text-right font-mono ${data.netIncome >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {formatCurrency(data.netIncome)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </ErrorBoundary>
  );
}