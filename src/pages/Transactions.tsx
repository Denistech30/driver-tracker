import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Transaction, getTransactions } from '../lib/storage';
import { useSettings } from '../contexts/SettingsContext';
import TransactionModal from '../components/TransactionModal';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorBoundary from '../components/ErrorBoundary';
import { Pencil } from 'lucide-react';

function Transactions() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [filter, setFilter] = useState<'all' | 'revenue' | 'expense'>('all');
  // New controls: search, date range, sort
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(''); // yyyy-mm-dd
  const [dateTo, setDateTo] = useState(''); // yyyy-mm-dd
  const [sort, setSort] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Simulate async data fetch
    setTimeout(() => {
      const all = getTransactions();

      // Type filter (existing)
      let result = all.filter((t) => (filter === 'all' ? true : t.type === filter));

      // Date range filter (inclusive)
      if (dateFrom) {
        const fromTs = new Date(dateFrom + 'T00:00:00').getTime();
        result = result.filter((t) => new Date(t.date).getTime() >= fromTs);
      }
      if (dateTo) {
        const toTs = new Date(dateTo + 'T23:59:59').getTime();
        result = result.filter((t) => new Date(t.date).getTime() <= toTs);
      }

      // Search (category and description)
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        result = result.filter((t) => {
          const inCategory = (t.category || '').toLowerCase().includes(q);
          const inDesc = (t.description || '').toLowerCase().includes(q);
          return inCategory || inDesc;
        });
      }

      // Sort
      result = [...result].sort((a, b) => {
        if (sort === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sort === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sort === 'amount_desc') return b.amount - a.amount;
        if (sort === 'amount_asc') return a.amount - b.amount;
        return 0;
      });

      setTransactions(result);
      setIsLoading(false);
    }, 500);
  }, [filter, search, dateFrom, dateTo, sort]);

  const formatCurrency = (amount: number): string => {
    // Map FCFA to the correct ISO currency code (XAF - Central African CFA franc)
    const currencyCode = settings.currency === 'FCFA' ? 'XAF' : settings.currency;
    
    try {      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'code'
      }).format(amount);
      
      // Replace XAF with FCFA if needed
      return settings.currency === 'FCFA' ? formatted.replace('XAF', 'FCFA') : formatted;
    } catch (error) {
      console.error('Error formatting currency:', error);
      // Fallback to basic formatting
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
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Recent Transactions</h2>

        {/* Controls: search, date range, sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category or description..."
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-background text-foreground"
            aria-label="Search transactions"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-background text-foreground"
            aria-label="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-background text-foreground"
            aria-label="To date"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-background text-foreground"
            aria-label="Sort transactions"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="amount_desc">Amount: High to Low</option>
            <option value="amount_asc">Amount: Low to High</option>
          </select>
        </div>

        {/* Existing type filter chips */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('revenue')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'revenue' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setFilter('expense')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'expense' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            Expense
          </button>
        </div>
        {transactions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center">No transactions found.</p>
        ) : (
          <div className="space-y-3 card-grid-sm">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-card shadow-sm rounded-lg p-4 hover:bg-muted-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => setSelectedTransaction(transaction)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-truncate-sm">
                      {transaction.category}
                    </span>
                    <span className="text-xs text-muted-foreground dark:text-gray-400">
                      {formatDate(transaction.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        transaction.type === 'revenue' ? 'revenue-text' : 'expense-text'
                      }`}
                    >
                      {formatCurrency(transaction.amount)}
                    </span>
                    <Badge
                      className={
                        transaction.type === 'revenue' ? 'badge-success' : 'badge-destructive'
                      }
                    >
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/transactions/edit/${transaction.id}`);
                      }}
                      className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Edit transaction"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedTransaction && (
          <TransactionModal
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
          />
        )}
      </section>
    </ErrorBoundary>
  );
}

export default Transactions;
