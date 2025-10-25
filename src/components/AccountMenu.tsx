import React, { useEffect, useRef, useState, useMemo } from 'react';
import { LogOut, X } from 'lucide-react';
import { useFirebaseUser } from '../hooks/useFirebaseUser';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency as formatCurrencyUtil } from '../lib/currencyUtils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function AccountMenu() {
  const { user } = useFirebaseUser();
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const initials = (user?.email || 'U').slice(0, 1).toUpperCase();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Failed to sign out', e);
    }
  };

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
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 rounded-full text-white flex items-center justify-center text-sm font-semibold shadow hover:opacity-90 focus:outline-none focus:ring-2"
        style={{ background: 'linear-gradient(to top right, #2B6CB0, #4A90E2)', boxShadow: '0 4px 6px rgba(30, 74, 120, 0.2)' }}
        aria-label="Account menu"
      >
        {initials}
      </button>
      {open && (
        <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 sm:hidden" onClick={() => setOpen(false)} />
          
          <div 
            className="fixed inset-x-2 top-16 bottom-20 sm:absolute sm:inset-auto sm:top-auto sm:right-0 sm:bottom-auto sm:mt-2 sm:w-[22rem] sm:max-h-[80vh] overflow-y-auto rounded-xl sm:rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 shadow-2xl p-3 sm:p-4 z-50"
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          >
          {/* Close button for mobile */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 sm:hidden z-10"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Profile header */}
          <div className="rounded-lg sm:rounded-xl p-3 sm:p-4 text-white shadow-md" style={{ background: 'linear-gradient(to bottom right, #2B6CB0, #4A90E2, #1E4A78)', boxShadow: '0 4px 6px rgba(30, 74, 120, 0.2)' }}>
            <div className="text-xs opacity-90">Signed in</div>
            <div className="text-sm sm:text-base font-semibold truncate" title={user?.email || ''}>{user?.email || 'Unknown'}</div>
            <div className="text-[10px] sm:text-[11px] opacity-80 mt-1">UID: {user?.uid?.slice(0, 8)}…</div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
            <div className="rounded-md sm:rounded-lg border dark:border-gray-800 p-2 sm:p-3">
              <div className="text-[10px] sm:text-xs text-muted-foreground">Tx this month</div>
              <div className="text-base sm:text-lg font-semibold">{monthTx.length}</div>
            </div>
            <div className="rounded-md sm:rounded-lg border dark:border-gray-800 p-2 sm:p-3">
              <div className="text-[10px] sm:text-xs text-muted-foreground">Spent</div>
              <div className="text-base sm:text-lg font-semibold expense-text">{formatCurrency(totalSpent)}</div>
            </div>
            <div className="rounded-md sm:rounded-lg border dark:border-gray-800 p-2 sm:p-3">
              <div className="text-[10px] sm:text-xs text-muted-foreground">Remaining</div>
              <div className="text-base sm:text-lg font-semibold">{formatCurrency(remaining)}</div>
            </div>
            <div className="rounded-md sm:rounded-lg border dark:border-gray-800 p-2 sm:p-3">
              <div className="text-[10px] sm:text-xs text-muted-foreground">Top category</div>
              <div className="text-base sm:text-lg font-semibold truncate" title={topCategory}>{topCategory}</div>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="mt-2 sm:mt-3">
            <div className="text-sm font-medium mb-1 sm:mb-2">Recent transactions</div>
            {monthTx.slice(0, 5).length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-2">No recent transactions.</div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {monthTx.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between border-b dark:border-gray-800 last:border-b-0 py-1.5 sm:py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded px-1 sm:px-2 -mx-1 sm:-mx-2 transition-colors">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-medium truncate">{t.category}</span>
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground">{new Date(t.date).toLocaleDateString()}</span>
                    </div>
                    <div className={`text-xs sm:text-sm font-semibold flex-shrink-0 ml-2 ${t.type === 'expense' ? 'expense-text' : 'revenue-text'}`}>
                      {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="mt-2 sm:mt-3 flex justify-end">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs sm:text-sm transition-colors"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" /> Logout
            </button>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
