import { useState, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { exportData, importData } from '../lib/backup';
import { languages } from '../lib/translations';
import PinModal from '../components/PinModal';

function Settings() {
  const { settings, updateSettings } = useSettings();
  const { auth, pinFeatureEnabled, setPinFeatureEnabled } = useAuth();
  const { t } = useTranslation();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States for controlling the PinModal for setup/change/disable
  const [showPinManagementModal, setShowPinManagementModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'setup' | 'change' | 'disable'>('setup');
  const [message, setMessage] = useState(''); // For success messages
  const [error, setError] = useState(''); // For error messages

  const currencies = [
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'FCFA', label: 'Central African CFA Franc (FCFA)' },
  ];

  const themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  const handleReset = () => {
    localStorage.removeItem('transactions');
    localStorage.removeItem('categories');
    localStorage.removeItem('settings');
    // Important: Also clear PIN and security question from local storage on full app reset
    localStorage.removeItem('pin');
    localStorage.removeItem('securityQuestion');
    localStorage.removeItem('securityAnswer');
    
    setIsResetDialogOpen(false);
    // Reload to reflect reset
    window.location.reload();
  };

  const handleExport = () => {
    try {
      exportData();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result as string;
        importData(data);
        window.location.reload();
      } catch (error) {
        console.error('Import failed:', error);
        setImportError('Failed to import data. The file may be corrupted or not a valid backup.');
      }
    };
    reader.readAsText(file);
  };

  // Handler for the "Enable PIN Protection" switch
  const handlePinToggle = async (checked: boolean) => {
    setMessage('');
    setError('');

    if (checked) {
      // User wants to enable PIN
      if (!auth.pin) { // If no PIN is currently set, prompt for setup
        setPinModalMode('setup');
        setShowPinManagementModal(true);
      } else {
        // PIN is already set, just ensure feature is marked enabled
        setPinFeatureEnabled(true); 
        setMessage('PIN protection is already active.');
      }
    } else {
      // User wants to disable PIN
      if (auth.pin) { // If a PIN exists, prompt for confirmation
        setPinModalMode('disable');
        setShowPinManagementModal(true);
      } else {
        // No PIN exists, so nothing to disable
        setPinFeatureEnabled(false); 
        setMessage('PIN protection is already disabled.');
      }
    }
  };

  // Callback from PinModal when setup/change/disable is complete
  const handlePinManagementSuccess = () => {
    setShowPinManagementModal(false);
    setMessage('PIN operation completed successfully!');
    setError('');
  };

  // Callback for closing the PinModal without success (e.g., user clicks cancel)
  const handlePinManagementClose = () => {
    setShowPinManagementModal(false);
    // If PIN was attempted to be enabled but cancelled, reflect that in the switch
    if (pinModalMode === 'setup' && !auth.pin) {
        setPinFeatureEnabled(false); // Ensure the switch goes back to off
    }
    setError(''); // Clear any previous errors
    setMessage('');
  };

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('settings.title')}</h2>
      
      {message && <p className="text-green-500 text-sm mb-4">{message}</p>}
      {error && <p className="text-destructive text-sm mb-4">{error}</p>}
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('settings.preferences')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="language" className="text-sm font-medium text-muted-foreground dark:text-gray-300">
              {t('common.language')}
            </label>
            <Select
              value={settings.language}
              onValueChange={(value) => updateSettings({ language: value })}
            >
              <SelectTrigger id="language" className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language.value} value={language.value}>
                    {language.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="currency" className="text-sm font-medium text-muted-foreground dark:text-gray-300">
              {t('common.currency')}
            </label>
            <Select
              value={settings.currency}
              onValueChange={(value: string) => updateSettings({ currency: value })}
            >
              <SelectTrigger id="currency" className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="theme" className="text-sm font-medium text-muted-foreground dark:text-gray-300">
              {t('common.theme')}
            </label>
            <Select
              value={settings.theme}
              onValueChange={(value: 'light' | 'dark') => updateSettings({ theme: value })}
            >
              <SelectTrigger id="theme" className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 pt-4 border-t mt-4">
            <h3 className="font-medium">PIN Management</h3>
            <div className="flex items-center justify-between">
                <Label htmlFor="enable-pin">Enable PIN Protection</Label>
                <Switch
                    id="enable-pin"
                    checked={pinFeatureEnabled} // Reflects AuthContext's actual PIN status
                    onCheckedChange={handlePinToggle}
                />
            </div>
            {pinFeatureEnabled && ( // Show change PIN button only if PIN is enabled
                <div className="grid grid-cols-1 gap-2 mt-2">
                    <Button onClick={() => { setPinModalMode('change'); setShowPinManagementModal(true); }}>
                        Change PIN
                    </Button>
                </div>
            )}
          </div>
          <div className="space-y-2 pt-4 border-t mt-4">
            <h3 className="font-medium">Data Management</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleExport}>
                Export Data
              </Button>
              <Button onClick={handleImportClick}>
                Import Data
              </Button>
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
            {importError && (
              <p className="text-sm text-destructive">{importError}</p>
            )}
          </div>
          <div className="pt-4 border-t mt-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setIsResetDialogOpen(true)}
            >
              Reset App
            </Button>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all transactions, categories, and settings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={handleReset}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* PinModal for PIN setup, change, or disable */}
      {showPinManagementModal && (
        <PinModal 
          mode={pinModalMode} 
          onClose={handlePinManagementClose} 
          onSuccess={handlePinManagementSuccess} 
          availableQuestions={settings.availableQuestions || [
            'What was your first car?',
            'What is your mother\'s maiden name?',
            'What was the name of your first pet?',
            'In which city were you born?',
            'What was your childhood nickname?'
          ]} 
        />
      )}
    </section>
  );
}

export default Settings;