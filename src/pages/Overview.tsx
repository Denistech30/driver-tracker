import { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { getSummary, getExpenseCategories } from '../lib/storage';
import { useSettings } from '../contexts/SettingsContext';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorBoundary from '../components/ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useTranslation } from '../hooks/useTranslation';

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
  // Flag to determine if we're viewing expense categories or financial overview
  viewMode: 'expenses' | 'financial';
}

function Overview() {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [data, setData] = useState<ChartData>({ 
    revenue: 0, 
    expenses: 0, 
    netIncome: 0, 
    expenseCategories: [],
    viewMode: 'financial' // Default to showing financial overview
  });

  useEffect(() => {
    const loadData = () => {
      const summary = getSummary();
      const categories = getExpenseCategories();
      
      // Enhanced color palette with vibrant, distinct colors
      const colors = [
        'hsl(215, 90%, 50%)',    // Vibrant Blue
        'hsl(150, 80%, 40%)',    // Emerald Green
        'hsl(350, 85%, 50%)',    // Vibrant Pink
        'hsl(45, 95%, 50%)',     // Golden Yellow
        'hsl(280, 85%, 55%)',    // Rich Purple
        'hsl(190, 90%, 45%)',    // Turquoise
        'hsl(20, 90%, 50%)',     // Orange
        'hsl(325, 85%, 45%)',    // Deep Rose
        'hsl(170, 85%, 35%)',    // Sea Green
        'hsl(245, 85%, 60%)',    // Royal Blue
      ];

      // For darker mode, adjust color opacity and lightness
      const isDarkMode = document.documentElement.classList.contains('dark');
      const adjustedColors = isDarkMode ? colors.map(color => {
        const [h, s, l] = color.match(/\d+/g)!.map(Number);
        return `hsl(${h}, ${s}%, ${l + 15}%, 0.85)`;
      }) : colors;
      
      // Calculate percentages and add colors
      const totalExpenses = summary.expenses || 1;
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
        viewMode: 'expenses', // Add the missing viewMode property with a default value
      });
      setIsLoading(false);
    };

    // Load data with a small delay to show loading state
    setTimeout(loadData, 500);
  }, []);

  const formatCurrency = (amount: number): string => {
    const currencyCode = settings.currency === 'FCFA' ? 'XAF' : settings.currency;
    
    try {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'code'
      }).format(amount);
      
      return settings.currency === 'FCFA' ? formatted.replace('XAF', 'FCFA') : formatted;
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${settings.currency} ${amount.toFixed(2)}`;
    }
  };

  const toggleChartType = () => {
    setChartType(chartType === 'pie' ? 'bar' : 'pie');
  };
  
  const toggleViewMode = () => {
    setData(prev => ({
      ...prev,
      viewMode: prev.viewMode === 'expenses' ? 'financial' : 'expenses'
    }));
  };

  const pieChartData = data.viewMode === 'expenses' ? {
    labels: data.expenseCategories.map((cat) => cat.name),
    datasets: [
      {
        data: data.expenseCategories.map((cat) => cat.value),
        backgroundColor: data.expenseCategories.map((cat) => cat.color),
        borderColor: 'hsl(var(--card))',
        borderWidth: 2,
      },
    ],
  } : {
    // Financial overview showing revenue vs expenses
    labels: ['Revenue', 'Expenses'],
    datasets: [
      {
        data: [data.revenue, data.expenses],
        backgroundColor: [
          'hsl(150, 80%, 40%)', // Green for revenue
          'hsl(350, 85%, 50%)'  // Red for expenses
        ],
        borderColor: 'hsl(var(--card))',
        borderWidth: 2,
      },
    ],
  };

  const barChartData = data.viewMode === 'expenses' ? {
    labels: data.expenseCategories.map((cat) => cat.name),
    datasets: [
      {
        label: 'Expenses',
        data: data.expenseCategories.map((cat) => cat.value),
        backgroundColor: data.expenseCategories.map((cat) => cat.color),
        borderColor: data.expenseCategories.map((cat) => cat.color),
        borderWidth: 1,
      },
    ],
  } : {
    // Financial overview showing revenue vs expenses
    labels: ['Revenue', 'Expenses'],
    datasets: [
      {
        label: 'Amount',
        data: [data.revenue, data.expenses],
        backgroundColor: [
          'hsl(150, 80%, 40%)', // Green for revenue
          'hsl(350, 85%, 50%)'  // Red for expenses
        ],
        borderColor: [
          'hsl(150, 80%, 40%)', // Green for revenue
          'hsl(350, 85%, 50%)'  // Red for expenses
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'hsl(var(--foreground))',
          padding: 20,
          font: {
            size: 12
          },
          usePointStyle: true,
          pointStyle: 'circle'
        },
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
            if (data.viewMode === 'expenses') {
              return `${context.label}: ${formatCurrency(context.raw)} (${context.parsed.toFixed(1)}%)`;
            } else {
              // For financial overview
              const total = data.revenue + data.expenses;
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${context.label}: ${formatCurrency(context.raw)} (${percentage}%)`;
            }
          },
        },
      },
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: 'hsl(var(--background))',
      }
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
            if (data.viewMode === 'expenses') {
              return `${formatCurrency(context.raw)} (${data.expenseCategories[context.dataIndex]?.percentage.toFixed(1)}%)`;
            } else {
              // For financial overview
              const total = data.revenue + data.expenses;
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${formatCurrency(context.raw)} (${percentage}%)`;
            }
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'hsl(var(--border))',
          drawBorder: false,
        },
        ticks: {
          padding: 8,
          callback: (value: any) => formatCurrency(value),
          color: 'hsl(var(--foreground))',
          font: {
            size: 11
          }
        },
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'hsl(var(--foreground))',
          font: {
            size: 11
          }
        },
      },
    },
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        <SkeletonLoader type="card" />
        <SkeletonLoader type="card" count={1} />
      </section>
    );
  }

  return (
    <ErrorBoundary>
      <section className="space-y-6" id="financial-report">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h2>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Revenue Card */}
          <div 
            className="relative bg-card dark:bg-gray-800 rounded-lg shadow-md overflow-hidden
                       transition-all duration-200 hover:shadow-lg group"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-emerald-500/5 to-transparent transition-opacity" />
            <div className="relative border-l-4 border-emerald-500 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Revenue</h3>
                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 
                              flex items-center justify-center">
                  <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24">
                    <path fill="none" stroke="currentColor" strokeWidth="2" 
                          d="M12 4v16m-7-7h14" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(data.revenue)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Revenue</p>
            </div>
          </div>

          {/* Expenses Card */}
          <div 
            className="relative bg-card dark:bg-gray-800 rounded-lg shadow-md overflow-hidden
                       transition-all duration-200 hover:shadow-lg group"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-rose-500/5 to-transparent transition-opacity" />
            <div className="relative border-l-4 border-rose-500 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Expenses</h3>
                <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/30 
                              flex items-center justify-center">
                  <svg className="h-4 w-4 text-rose-500" viewBox="0 0 24 24">
                    <path fill="none" stroke="currentColor" strokeWidth="2" 
                          d="M12 20V4m-7 7h14" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(data.expenses)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Expenses</p>
            </div>
          </div>

          {/* Net Income Card */}
          <div 
            className="relative bg-card dark:bg-gray-800 rounded-lg shadow-md overflow-hidden
                       transition-all duration-200 hover:shadow-lg group"
          >
            <div 
              className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity
                         bg-gradient-to-r ${
                           data.netIncome >= 0 
                             ? 'from-blue-500/5 to-transparent' 
                             : 'from-destructive/5 to-transparent'
                         }`}
            />
            <div 
              className={`relative border-l-4 p-6 ${
                data.netIncome >= 0 
                  ? 'border-blue-500' 
                  : 'border-destructive'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Net Income</h3>
                <div 
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    data.netIncome >= 0 
                      ? 'bg-blue-100 dark:bg-blue-900/30' 
                      : 'bg-destructive/10'
                  }`}
                >
                  <svg 
                    className={`h-4 w-4 ${
                      data.netIncome >= 0 
                        ? 'text-blue-500' 
                        : 'text-destructive'
                    }`} 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      d={data.netIncome >= 0 
                          ? "M12 4v16m-7-7h14" 
                          : "M12 20V4m-7 7h14"} 
                    />
                  </svg>
                </div>
              </div>
              <p 
                className={`text-2xl font-bold ${
                  data.netIncome >= 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-destructive dark:text-destructive'
                }`}
              >
                {formatCurrency(data.netIncome)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Net Income</p>
            </div>
          </div>
        </div>

        {/* Financial Summary Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium">{data.viewMode === 'expenses' ? 'Expense Summary' : 'Financial Summary'}</CardTitle>
            <div className="flex space-x-2">
              <button 
                onClick={toggleViewMode}
                className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              >
                {data.viewMode === 'expenses' ? 'Show Financial Overview' : 'Show Expense Categories'}
              </button>
              <button 
                onClick={toggleChartType}
                className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              >
                {chartType === 'pie' ? 'Show Bar Chart' : 'Show Pie Chart'}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {(data.viewMode === 'financial' || data.expenseCategories.length > 0) ? (
              <div className="space-y-6">
                <div className="relative h-64 mx-auto max-w-sm">
                  {chartType === 'pie' ? (
                    <Pie data={pieChartData} options={pieChartOptions} />
                  ) : (
                    <Bar data={barChartData} options={barChartOptions} />
                  )}
                </div>
                <div className="mt-6 overflow-x-auto">
                  {data.viewMode === 'expenses' ? (
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b dark:border-gray-700">
                          <th className="px-3 py-2 text-muted-foreground">Category</th>
                          <th className="px-3 py-2 text-muted-foreground text-right">Amount</th>
                          <th className="px-3 py-2 text-muted-foreground text-right">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.expenseCategories.map((category) => (
                          <tr key={category.name} className="border-b dark:border-gray-800">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right">{formatCurrency(category.value)}</td>
                            <td className="px-3 py-2 text-right">{category.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                        <tr className="font-medium bg-muted/30">
                          <td className="px-3 py-2">Total</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(data.expenses)}</td>
                          <td className="px-3 py-2 text-right">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b dark:border-gray-700">
                          <th className="px-3 py-2 text-muted-foreground">Type</th>
                          <th className="px-3 py-2 text-muted-foreground text-right">Amount</th>
                          <th className="px-3 py-2 text-muted-foreground text-right">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b dark:border-gray-800">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: 'hsl(150, 80%, 40%)' }}
                              />
                              Revenue
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">{formatCurrency(data.revenue)}</td>
                          <td className="px-3 py-2 text-right">{((data.revenue / (data.revenue + data.expenses)) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr className="border-b dark:border-gray-800">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: 'hsl(350, 85%, 50%)' }}
                              />
                              Expenses
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">{formatCurrency(data.expenses)}</td>
                          <td className="px-3 py-2 text-right">{((data.expenses / (data.revenue + data.expenses)) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr className="font-medium bg-muted/30">
                          <td className="px-3 py-2">Total</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(data.revenue + data.expenses)}</td>
                          <td className="px-3 py-2 text-right">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No expenses to display.</p>
            )}

          </CardContent>
        </Card>
      </section>
    </ErrorBoundary>
  );
}

export default Overview;