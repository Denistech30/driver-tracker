import * as React from 'react';
import { useFirebaseUser } from '../hooks/useFirebaseUser';
import { getSettings as repoGetSettings, updateSettings as repoUpdateSettings, setMonthlyBudget as repoSetMonthlyBudget, getMonthlyBudget as repoGetMonthlyBudget } from '../lib/repositories/settingsRepo';

interface Settings {
  language: string;
  currency: string;
  theme: 'light' | 'dark';
  availableQuestions: string[];
  budget?: number;
}

interface ExpenditureItem {
  amount: number;
  date: string; // ISO string
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  showNotification: boolean;
  expenditure: number;
  budgetProgress: number;
  budgetColor: 'green' | 'yellow' | 'red';
}

const SettingsContext = React.createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'settings';
const LAST_OPEN_KEY = 'lastAppOpen';
const BUDGET_MONTH_KEY = 'budgetMonth'; // Added

const defaultSettings: Settings = {
  language: 'en-US',
  currency: 'USD',
  theme: 'light',
  availableQuestions: [
    'What was your first car?',
    'What is your mother\'s maiden name?',
    'What was the name of your first pet?',
    'In which city were you born?',
    'What was your childhood nickname?'
  ],
  budget: 0,
};

export function SettingsProvider({
  children,
  expenditures = [],
}: {
  children: React.ReactNode;
  expenditures?: ExpenditureItem[];
}) {
  const { user } = useFirebaseUser();
  const [settings, setSettings] = React.useState<Settings>(defaultSettings);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [showNotification, setShowNotification] = React.useState(false);

  // Calculate expenditure for current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const expenditure = React.useMemo(() => {
    return expenditures
      .filter(item => {
        const d = new Date(item.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, item) => acc + item.amount, 0);
  }, [expenditures, currentMonth, currentYear]);

  // Calculate budget progress and color
  const budgetProgress = settings.budget && settings.budget > 0
    ? Math.min(100, Math.round((expenditure / settings.budget) * 100))
    : 0;

  let budgetColor: 'green' | 'yellow' | 'red' = 'green';
  if (budgetProgress > 66.666) {
    budgetColor = 'red';
  } else if (budgetProgress > 33.333) {
    budgetColor = 'yellow';
  }

  // Initialize settings from Firestore if signed-in; fallback to localStorage otherwise
  React.useEffect(() => {
    (async () => {
      try {
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (user?.uid) {
          const remote = await repoGetSettings(user.uid);
          const currentBudget = await repoGetMonthlyBudget(user.uid, ym);
          if (remote) {
            setSettings(prev => ({
              ...prev,
              language: remote.language,
              currency: remote.currency,
              theme: remote.theme,
              availableQuestions: remote.availableQuestions,
              budget: currentBudget || 0,
            }));
          } else {
            setSettings(prev => ({ ...prev, budget: currentBudget || 0 }));
          }
        } else {
          const saved = localStorage.getItem(STORAGE_KEY);
          const savedMonth = localStorage.getItem(BUDGET_MONTH_KEY);
          const currentMonth = now.getMonth();
          if (saved) {
            const parsedSettings = JSON.parse(saved);
            if (typeof parsedSettings.budget !== 'undefined') {
              if (savedMonth && parseInt(savedMonth, 10) === currentMonth) {
                setSettings(prev => ({ ...prev, ...parsedSettings }));
              } else {
                setSettings(prev => ({ ...prev, ...parsedSettings, budget: 0 }));
                localStorage.setItem(BUDGET_MONTH_KEY, currentMonth.toString());
              }
            } else {
              setSettings(prev => ({ ...prev, ...parsedSettings }));
            }
          } else {
            localStorage.setItem(BUDGET_MONTH_KEY, currentMonth.toString());
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsInitialized(true);
      }
    })();
  }, [user?.uid]);

  // Check last app open time and set notification
  React.useEffect(() => {
    if (!isInitialized) return;
    try {
      const now = Date.now();
      const lastOpen = localStorage.getItem(LAST_OPEN_KEY);
      if (lastOpen) {
        const lastOpenTime = parseInt(lastOpen, 10);
        if (now - lastOpenTime > 24 * 60 * 60 * 1000) {
          setShowNotification(true);
        } else {
          setShowNotification(false);
        }
      } else {
        setShowNotification(false);
      }
      localStorage.setItem(LAST_OPEN_KEY, now.toString());
    } catch (error) {
      console.error('Error tracking app open time:', error);
    }
  }, [isInitialized]);

  // Apply theme and language when settings change
  React.useEffect(() => {
    if (!isInitialized) return;
    try {
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      document.documentElement.lang = settings.language.split('-')[0];
    } catch (error) {
      console.error('Error applying settings:', error);
    }
  }, [settings.theme, settings.language, isInitialized]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (user?.uid) {
      if (typeof newSettings.budget !== 'undefined') {
        void repoSetMonthlyBudget(user.uid, ym, newSettings.budget || 0);
      }
      const { budget, ...rest } = newSettings;
      if (Object.keys(rest).length > 0) {
        void repoUpdateSettings(user.uid, rest as any);
      }
    } else {
      try {
        const merged = { ...settings, ...newSettings };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        if (typeof newSettings.budget !== 'undefined') {
          localStorage.setItem(BUDGET_MONTH_KEY, now.getMonth().toString());
        }
      } catch (e) {
        console.error('Error saving settings locally:', e);
      }
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      showNotification,
      expenditure,
      budgetProgress,
      budgetColor
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}