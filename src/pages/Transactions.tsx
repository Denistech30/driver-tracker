import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Transaction, getTransactions, deleteTransaction } from '../lib/storage';
import { useSettings } from '../contexts/SettingsContext';
import { useTransactions } from '../hooks/useTransactions';
import TransactionModal from '../components/TransactionModal';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorBoundary from '../components/ErrorBoundary';
import { 
  Pencil, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  CheckSquare, 
  Square, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function Transactions() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { transactions: allTransactions } = useTransactions();
  const [filter, setFilter] = useState<'all' | 'revenue' | 'expense'>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let result = [...allTransactions];

    // Type filter
    if (filter !== 'all') {
      result = result.filter((t) => t.type === filter);
    }

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t) => {
        const inCategory = (t.category || '').toLowerCase().includes(q);
        const inDesc = (t.description || '').toLowerCase().includes(q);
        return inCategory || inDesc;
      });
    }

    // Date range
    if (dateFrom) {
      result = result.filter((t) => t.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((t) => t.date <= dateTo);
    }

    // Amount range
    if (amountMin) {
      result = result.filter((t) => t.amount >= parseFloat(amountMin));
    }
    if (amountMax) {
      result = result.filter((t) => t.amount <= parseFloat(amountMax));
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [allTransactions, filter, search, dateFrom, dateTo, amountMin, amountMax]);

  // Summary statistics
  const summary = useMemo(() => {
    const stats = filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === 'expense') acc.totalExpense += t.amount;
        else acc.totalRevenue += t.amount;
        acc.count++;
        return acc;
      },
      { totalExpense: 0, totalRevenue: 0, count: 0, net: 0 }
    );
    stats.net = stats.totalRevenue - stats.totalExpense;
    return stats;
  }, [filteredTransactions]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      let label;

      if (date.toDateString() === today.toDateString()) {
        label = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = 'Yesterday';
      } else if (date > weekAgo) {
        label = 'This Week';
      } else {
        label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(transaction);
    });

    return groups;
  }, [filteredTransactions]);

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
      return `${settings.currency} ${amount.toFixed(2)}`;
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  // Pagination
  const groupLabels = Object.keys(groupedTransactions);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Bulk actions
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const allIds = paginatedTransactions.map((t) => t.id);
    setSelectedIds(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkMode(false);
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.size} transaction(s)?`)) {
      selectedIds.forEach((id) => deleteTransaction(id));
      clearSelection();
    }
  };

  const handleExport = () => {
    const data = filteredTransactions.map((t) => ({
      Date: t.date,
      Type: t.type,
      Category: t.category,
      Amount: t.amount.toFixed(2),
      Description: t.description || '',
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Quick filters
  const quickFilters = [
    {
      label: 'This Month',
      onClick: () => {
        const now = new Date();
        setDateFrom(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
        setDateTo(now.toISOString().split('T')[0]);
      },
    },
    {
      label: 'Last Month',
      onClick: () => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        setDateFrom(`${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        setDateTo(`${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${lastDay.getDate()}`);
      },
    },
    {
      label: 'Clear Filters',
      onClick: () => {
        setDateFrom('');
        setDateTo('');
        setAmountMin('');
        setAmountMax('');
        setSearch('');
      },
    },
  ];

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Transactions</h2>
        <SkeletonLoader type="card" />
      </section>
    );
  }

  return (
    <ErrorBoundary>
      <section className="space-y-4 max-w-6xl mx-auto">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transactions</h2>
          <div className="flex gap-2">
            <Button
              variant={bulkMode ? 'default' : 'outline'}
              onClick={() => {
                setBulkMode(!bulkMode);
                clearSelection();
              }}
              className="gap-2"
              style={bulkMode ? { background: 'linear-gradient(to right, #2B6CB0, #4A90E2)', color: 'white' } : {}}
            >
              <CheckSquare className="h-4 w-4" />
              {bulkMode ? 'Exit Bulk' : 'Select'}
            </Button>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <Card style={{ background: 'linear-gradient(135deg, #2B6CB0 0%, #4A90E2 50%, #1E4A78 100%)', color: 'white' }}>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-blue-100 text-sm mb-1">Showing</p>
                <p className="text-2xl font-bold">{summary.count}</p>
                <p className="text-blue-100 text-xs">transactions</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1 flex items-center gap-1">
                  <TrendingDown className="h-4 w-4" />
                  Expenses
                </p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalExpense)}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Revenue
                </p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Net</p>
                <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                  {summary.net >= 0 ? '+' : ''}{formatCurrency(Math.abs(summary.net))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {bulkMode && selectedIds.size > 0 && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {selectedIds.size} transaction(s) selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All ({paginatedTransactions.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search category or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
                style={showFilters ? { background: 'linear-gradient(to right, #2B6CB0, #4A90E2)', color: 'white' } : {}}
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter, idx) => (
                <button
                  key={idx}
                  onClick={filter.onClick}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              {(['all', 'expense', 'revenue'] as const).map((type) => (
                <Button
                  key={type}
                  variant={filter === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(type)}
                  style={filter === type ? { background: 'linear-gradient(to right, #2B6CB0, #4A90E2)', color: 'white' } : {}}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t dark:border-gray-700">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">From Date</label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">To Date</label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Min Amount</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Max Amount</label>
                  <Input
                    type="number"
                    placeholder="1000.00"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {search || dateFrom || dateTo || amountMin || amountMax
                  ? 'Try adjusting your filters or search terms'
                  : 'Start tracking by adding your first transaction'}
              </p>
              <Button onClick={() => navigate('/add')}>Add Transaction</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {paginatedTransactions.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Bulk Select Checkbox */}
                    {bulkMode && (
                      <button onClick={() => toggleSelection(transaction.id)} className="flex-shrink-0">
                        {selectedIds.has(transaction.id) ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    )}

                    {/* Transaction Icon */}
                    <div
                      className={`p-2 rounded-lg ${
                        transaction.type === 'revenue' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                      }`}
                    >
                      <DollarSign
                        className={`h-5 w-5 ${
                          transaction.type === 'revenue' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      />
                    </div>

                    {/* Transaction Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {transaction.category}
                        </span>
                        {transaction.recurring && (
                          <Badge variant="outline" className="text-xs">
                            Recurring
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(transaction.date)}</span>
                        {transaction.description && (
                          <>
                            <span>•</span>
                            <span className="truncate">{transaction.description}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            transaction.type === 'revenue' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {transaction.type === 'revenue' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Badge
                          variant={transaction.type === 'revenue' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {transaction.type}
                        </Badge>
                      </div>

                      {!bulkMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/transactions/edit/${transaction.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                  <span className="text-sm text-gray-600 dark:text-gray-400">per page</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={i}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          style={
                            currentPage === pageNum
                              ? { background: 'linear-gradient(to right, #2B6CB0, #4A90E2)', color: 'white' }
                              : {}
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTransaction && (
          <TransactionModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
        )}
      </section>
    </ErrorBoundary>
  );
}

export default Transactions;
