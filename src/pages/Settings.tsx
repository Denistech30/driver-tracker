import { useState, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { exportData, importData } from '../lib/backup';
import { languages } from '../lib/translations';

function Settings() {
  const { settings, updateSettings } = useSettings();
  const { auth, resetPin } = useAuth();
  const { t } = useTranslation();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isPinResetDialogOpen, setIsPinResetDialogOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [pinResetError, setPinResetError] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePinReset = () => {
    setPinResetError(null);
    
    // Validate inputs
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinResetError('PIN must be 4 digits');
      return;
    }

    if (!securityQuestion) {
      setPinResetError('Please select a security question');
      return;
    }

    if (!securityAnswer.trim()) {
      setPinResetError('Please provide an answer to your security question');
      return;
    }

    // Reset the PIN
    resetPin(newPin, securityQuestion, securityAnswer);
    
    // Clear form and close dialog
    setNewPin('');
    setSecurityQuestion('');
    setSecurityAnswer('');
    setIsPinResetDialogOpen(false);
  };

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('settings.title')}</h2>
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
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={() => setIsPinResetDialogOpen(true)}>
                Reset PIN
              </Button>
            </div>
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
      
      <AlertDialog open={isPinResetDialogOpen} onOpenChange={setIsPinResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset PIN</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new 4-digit PIN and update your security question.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-pin">New PIN (4 digits)</Label>
              <Input
                id="new-pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="security-question">Security Question</Label>
              <Select value={securityQuestion} onValueChange={setSecurityQuestion}>
                <SelectTrigger id="security-question" className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                  <SelectValue placeholder="Select a security question" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pet">What was your first pet's name?</SelectItem>
                  <SelectItem value="school">What elementary school did you attend?</SelectItem>
                  <SelectItem value="city">In what city were you born?</SelectItem>
                  <SelectItem value="mother">What is your mother's maiden name?</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="security-answer">Answer</Label>
              <Input
                id="security-answer"
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            {pinResetError && (
              <p className="text-sm text-destructive">{pinResetError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePinReset}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default Settings;