import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Transaction, getTransactions } from '../lib/storage';
import { useSettings } from '../contexts/SettingsContext';

function Calendar() {
  const { settings } = useSettings();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const transactions = getTransactions();
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  const firstDayOfMonth = start.getDay();
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const hasTransactions = (date: Date): boolean => {
    return transactions.some((t) => isSameDay(parseISO(t.date), date));
  };

  const transactionsForDate = selectedDate
    ? transactions.filter((t) => isSameDay(parseISO(t.date), selectedDate))
    : [];

  const formatCurrency = (amount: number): string => {
    // Map FCFA to the correct ISO currency code (XAF - Central African CFA franc)
    const currencyCode = settings.currency === 'FCFA' ? 'XAF' : settings.currency;
    
    try {
      const formatted = new Intl.NumberFormat('en-US', {
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

  const formatDate = (date: Date): string => {
    return format(date, 'MMM d, yyyy');
  };

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Transaction Calendar</h2>
      <div className="bg-card shadow-sm rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5 text-gray-900" />
          </button>
          <h3 className="text-lg font-medium text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5 text-gray-900" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2">
              {day}
            </div>
          ))}
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}
          {days.map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`p-2 rounded-full text-sm ${
                hasTransactions(day) ? 'bg-primary/20' : ''
              } ${
                selectedDate && isSameDay(day, selectedDate)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-gray-100'
              }`}
              aria-label={`Select ${formatDate(day)}`}
            >
              {day.getDate()}
            </button>
          ))}
        </div>
      </div>
      {selectedDate && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Transactions for {formatDate(selectedDate)}
          </h3>
          {transactionsForDate.length === 0 ? (
            <p className="text-gray-500 text-center">No transactions for this date.</p>
          ) : (
            <div className="space-y-3 card-grid-sm">
              {transactionsForDate.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-card shadow-sm rounded-lg p-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 text-truncate-sm">
                        {transaction.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {transaction.description || 'No description'}
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Calendar;