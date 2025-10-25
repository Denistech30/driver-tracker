import { useState, useEffect } from 'react';
import { format, parse, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Transaction, getTransactions } from '../lib/storage';
import { getCategories } from '../lib/categories';
import { useSettings } from '../contexts/SettingsContext';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorBoundary from '../components/ErrorBoundary';
import { generateFinancialReportPDF } from '../utils/pdfService';
import { generateCategoryPieChartImage, generateDailyNetLineChartImage, generateRevenueExpensesBarImage } from '../utils/chartImage';
import { useToast } from "../hooks/use-toast";

// Define interfaces for data structures needed
interface SummaryData {
  revenue: number;
  expenses: number;
  netIncome: number;
}

interface CategoryDetail {
  categoryType: string;
  type: 'Revenue' | 'Expense';
  amount: number;
  description: string;
}

interface DailyFinancial {
  date: string; // 'YYYY-MM-DD'
  revenue: number;
  expenses: number;
  net: number;
  status: 'Profit' | 'Loss' | 'Break-even';
}

interface ReportData {
  revenue: number;
  expenses: number;
  netIncome: number;
  categories: { 
    name: string; 
    amount: number; 
    type: 'revenue' | 'expense';
    description?: string;
  }[];
  transactions: Transaction[];
}

function Reports() {
  const { settings } = useSettings();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const [optLandscapeDaily, setOptLandscapeDaily] = useState(false);
  const [optCategoryPercent, setOptCategoryPercent] = useState(false);
  const [optIncludeAppendix, setOptIncludeAppendix] = useState(false);
  const [optIncludeCharts, setOptIncludeCharts] = useState(false);
  const [optModernTemplate, setOptModernTemplate] = useState(false);
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData>({
    revenue: 0,
    expenses: 0,
    netIncome: 0,
    categories: [],
    transactions: []
  });
  const [dailyPerformanceData, setDailyPerformanceData] = useState<DailyFinancial[]>([]);

  useEffect(() => {
    setIsLoading(true);
    // Simulate async data fetch
    setTimeout(() => {
      const month = selectedMonth;
      const startDate = startOfMonth(parse(month, 'yyyy-MM', new Date()));
      const endDate = endOfMonth(startDate);

      const transactions = getTransactions();
      const categories = getCategories();

      const filteredTransactions = transactions.filter((t) => {
        const txDate = parse(t.date, 'yyyy-MM-dd', new Date());
        return txDate >= startDate && txDate <= endDate;
      });

      const revenue = filteredTransactions
        .filter((t) => t.type === 'revenue')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const netIncome = revenue - expenses;

      // Calculate category breakdown
      const categoryMap = filteredTransactions.reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = {
            amount: 0,
            type: categories.find((c) => c.name === t.category)?.type || 'expense',
            description: t.description || ''
          };
        }
        acc[t.category].amount += t.amount;
        if (t.description) acc[t.category].description = t.description;
        return acc;
      }, {} as Record<string, { amount: number; type: 'revenue' | 'expense'; description: string; }>);

      const categoryData = Object.entries(categoryMap).map(([name, data]) => ({
        name,
        ...data
      }));

      // Calculate daily performance data
      const dailyDataMap: { [key: string]: { revenue: number; expenses: number } } = {};
      
      filteredTransactions.forEach(t => {
        const formattedTxDate = format(parse(t.date, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd');
        if (!dailyDataMap[formattedTxDate]) {
          dailyDataMap[formattedTxDate] = { revenue: 0, expenses: 0 };
        }
        if (t.type === 'revenue') {
          dailyDataMap[formattedTxDate].revenue += t.amount;
        } else if (t.type === 'expense') {
          dailyDataMap[formattedTxDate].expenses += t.amount;
        }
      });

      const calculatedDailyPerformance: DailyFinancial[] = Object.keys(dailyDataMap)
        .map(dateStr => {
          const daily = dailyDataMap[dateStr];
          const net = daily.revenue - daily.expenses;
          const status = net > 0 ? 'Profit' : (net < 0 ? 'Loss' : 'Break-even') as 'Profit' | 'Loss' | 'Break-even';
          return {
            date: dateStr,
            revenue: daily.revenue,
            expenses: daily.expenses,
            net,
            status,
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setReportData({
        revenue,
        expenses,
        netIncome,
        categories: categoryData,
        transactions: filteredTransactions
      });
      setDailyPerformanceData(calculatedDailyPerformance);
      setIsLoading(false);
    }, 500);
  }, [selectedMonth]);

  const handleGeneratePdfOption = async (reportType: 'summary' | 'daily') => {
    const monthName = format(parse(selectedMonth, 'yyyy-MM', new Date()), 'MMMM yyyy');
    const fileNamePrefix = `DriverTracker_Financial_Report_${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`;
    const fileName = `${fileNamePrefix}_${monthName.replace(' ', '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;

    setIsExporting(true);
    setShowPdfOptions(false);

    try {
      // Optionally generate charts as images to embed in the PDF
      let charts: Array<{ title: string; dataUrl: string; width?: number; height?: number }> | undefined = undefined;
      if (optIncludeCharts) {
        charts = [];
        const locale = settings.language || 'en-US';
        // Revenue vs Expenses bar chart
        const revExpImg = await generateRevenueExpensesBarImage(
          reportData.revenue,
          reportData.expenses,
          settings.currency,
          locale
        );
        if (revExpImg) charts.push(revExpImg);
        // Category Pie (Summary mode best, but useful in general)
        const catImg = await generateCategoryPieChartImage(
          reportData.categories.map(c => ({ name: c.name, amount: c.amount, type: c.type })),
          settings.currency,
          locale
        );
        if (catImg) charts.push(catImg);
        // Daily Line chart
        const dailyImg = await generateDailyNetLineChartImage(
          dailyPerformanceData,
          settings.currency,
          locale
        );
        if (dailyImg) charts.push(dailyImg);
        if (charts.length === 0) charts = undefined;
      }

      await generateFinancialReportPDF(
        reportType,
        {
          monthName: monthName,
          summary: {
            revenue: reportData.revenue,
            expenses: reportData.expenses,
            netIncome: reportData.netIncome,
          },
          categoryBreakdown: reportData.categories.map(cat => ({
            categoryType: cat.name,
            type: cat.type.charAt(0).toUpperCase() + cat.type.slice(1) as 'Revenue' | 'Expense',
            amount: cat.amount,
            description: cat.description || 'N/A'
          })),
          dailyPerformance: dailyPerformanceData,
          transactions: reportData.transactions,
        },
        fileName,
        settings.currency,
        {
          landscape: reportType === 'daily' ? optLandscapeDaily : false,
          includeCategoryPercent: reportType === 'summary' ? optCategoryPercent : false,
          includeTransactionsAppendix: reportType === 'summary' ? optIncludeAppendix : false,
          locale: settings.language || 'en-US',
          charts,
          template: optModernTemplate ? 'modern' : 'classic',
        }
      );

      toast({
        title: "PDF Generated Successfully",
        description: `${reportType === 'summary' ? 'Summary & Categories' : 'Daily Performance'} report has been exported.`,
        variant: "success",
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

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

  if (isLoading) {
    return (
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Monthly Reports</h2>
        <SkeletonLoader type="card" />
        <SkeletonLoader type="table" />
      </section>
    );
  }

  return (
    <ErrorBoundary>
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Monthly Reports</h2>
        <div className="flex justify-between items-center relative">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = subMonths(new Date(), i);
                const month = format(date, 'yyyy-MM');
                return (
                  <SelectItem key={month} value={month}>
                    {format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy')}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Export PDF Button and Dropdown */}
          <Button 
            onClick={() => setShowPdfOptions(!showPdfOptions)} 
            className="bg-primary text-primary-foreground"
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              'Export PDF'
            )}
          </Button>

          {showPdfOptions && !isExporting && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2"
                 style={{ minWidth: '260px' }}>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Options</div>
              <div className="px-3 py-2 flex items-center gap-2">
                <input
                  id="optCategoryPercent"
                  type="checkbox"
                  checked={optCategoryPercent}
                  onChange={(e) => setOptCategoryPercent(e.target.checked)}
                />
                <label htmlFor="optCategoryPercent" className="text-sm">Include % of Type (Summary)</label>
              </div>
              <div className="px-3 py-2 flex items-center gap-2">
                <input
                  id="optIncludeAppendix"
                  type="checkbox"
                  checked={optIncludeAppendix}
                  onChange={(e) => setOptIncludeAppendix(e.target.checked)}
                />
                <label htmlFor="optIncludeAppendix" className="text-sm">Include Transactions Appendix (Summary)</label>
              </div>
              <div className="px-3 py-2 flex items-center gap-2">
                <input
                  id="optLandscapeDaily"
                  type="checkbox"
                  checked={optLandscapeDaily}
                  onChange={(e) => setOptLandscapeDaily(e.target.checked)}
                />
                <label htmlFor="optLandscapeDaily" className="text-sm">Landscape (Daily)</label>
              </div>
              <div className="px-3 py-2 flex items-center gap-2">
                <input
                  id="optIncludeCharts"
                  type="checkbox"
                  checked={optIncludeCharts}
                  onChange={(e) => setOptIncludeCharts(e.target.checked)}
                />
                <label htmlFor="optIncludeCharts" className="text-sm">Include Charts</label>
              </div>
              <div className="px-3 py-2 flex items-center gap-2">
                <input
                  id="optModernTemplate"
                  type="checkbox"
                  checked={optModernTemplate}
                  onChange={(e) => setOptModernTemplate(e.target.checked)}
                />
                <label htmlFor="optModernTemplate" className="text-sm">Use Modern Template</label>
              </div>
              <div className="border-t my-2" />
              <button
                onClick={() => handleGeneratePdfOption('summary')}
                className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
              >
                Summary & Categories PDF
              </button>
              <button
                onClick={() => handleGeneratePdfOption('daily')}
                className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
              >
                Daily Performance PDF
              </button>
            </div>
          )}
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900">
              Report for {format(parse(selectedMonth, 'yyyy-MM', new Date()), 'MMMM yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 card-grid-sm">
              <div className="bg-card shadow-sm rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Revenue</h3>
                <p className="text-2xl font-bold revenue-text mt-2">
                  {formatCurrency(reportData.revenue)}
                </p>
              </div>
              <div className="bg-card shadow-sm rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Expenses</h3>
                <p className="text-2xl font-bold expense-text mt-2">
                  {formatCurrency(reportData.expenses)}
                </p>
              </div>
              <div className="bg-card shadow-sm rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Net Income</h3>
                <p
                  className="text-2xl font-bold mt-2"
                  style={{ color: reportData.netIncome >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}
                >
                  {formatCurrency(reportData.netIncome)}
                </p>
              </div>
            </div>

            {/* Category Breakdown */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 pt-4">Category Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-center text-gray-500 dark:text-gray-400">
                        No category data for this month.
                      </td>
                    </tr>
                  ) : (
                    reportData.categories.map((cat, index) => (
                      <tr key={index} className="border-t dark:border-gray-700">
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{cat.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 capitalize">{cat.type}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(cat.amount)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{cat.description || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Daily Performance */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 pt-4">Daily Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Revenue</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Expenses</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Net (P/L)</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyPerformanceData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-center text-gray-500 dark:text-gray-400">
                        No daily transaction data for this month.
                      </td>
                    </tr>
                  ) : (
                    dailyPerformanceData.map((day, index) => (
                      <tr key={index} className="border-t dark:border-gray-700">
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                          {format(parse(day.date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(day.revenue)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(day.expenses)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-bold"
                            style={{ color: day.net >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}>
                          {formatCurrency(day.net)}
                        </td>
                        <td className="px-4 py-2 text-sm"
                            style={{ color: day.status === 'Profit' ? 'hsl(var(--success))' : (day.status === 'Loss' ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))') }}>
                          {day.status}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </ErrorBoundary>
  );
}

export default Reports;