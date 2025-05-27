import * as React from 'react';

interface Settings {
  language: string;
  currency: string;
  theme: 'light' | 'dark';
  availableQuestions: string[];
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = React.createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'settings';

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
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<Settings>(defaultSettings);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Initialize settings from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save settings to localStorage
  React.useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      
      // Apply theme to document
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Apply language to document
      document.documentElement.lang = settings.language.split('-')[0];
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings, isInitialized]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
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