import React, { useMemo } from 'react';
import { useFirebaseUser } from '../hooks/useFirebaseUser';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency as formatCurrencyUtil } from '../lib/currencyUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function Dashboard() {
  const { user } = useFirebaseUser();
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { settings } = useSettings();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthTx = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [transactions, currentMonth, currentYear]);

  const totalSpent = useMemo(() => monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const budget = settings.budget || 0;
  const remaining = Math.max(budget - totalSpent, 0);

  const topCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] || '—';
  }, [monthTx]);

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, settings.currency || 'USD', settings.language || 'en-US');
  };

  return (
    <section className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm opacity-90">Signed in</div>
            <div className="text-lg sm:text-xl font-semibold truncate" title={user?.email || ''}>{user?.email}</div>
            <div className="text-xs opacity-80 mt-1">UID: {user?.uid?.slice(0, 8)}…</div>
          </div>
          <Badge className="bg-white/15 text-white border-white/20 text-xs sm:text-sm px-2 py-1 flex-shrink-0">{now.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base font-medium">Transactions this month</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{monthTx.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base font-medium">Total spent</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold expense-text">{formatCurrency(totalSpent)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base font-medium">Budget remaining</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(remaining)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base font-medium">Top category</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 truncate">{topCategory}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-semibold">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {monthTx.slice(0, 5).length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No recent transactions.</div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {monthTx.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between border-b last:border-b-0 py-2 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded px-2 sm:px-3 -mx-2 sm:-mx-3 transition-colors">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm sm:text-base font-medium truncate">{t.category}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString()}</span>
                    {t.description && (
                      <span className="text-xs text-muted-foreground truncate mt-0.5">{t.description}</span>
                    )}
                  </div>
                  <div className={`text-sm sm:text-base font-semibold flex-shrink-0 ml-2 ${t.type === 'expense' ? 'expense-text' : 'revenue-text'}`}>
                    {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
