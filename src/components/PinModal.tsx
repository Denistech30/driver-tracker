import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

function PinModal() {
  const { auth, login, resetPin } = useAuth();
  const { settings } = useSettings();
  
  // Initialize state with default security question
  const [pin, setPin] = useState('');
  const [useQuestion, setUseQuestion] = useState(false);
  const defaultQuestion = settings?.availableQuestions?.[0] || '';
  const [question, setQuestion] = useState(defaultQuestion);
  const [answer, setAnswer] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isResetMode, setIsResetMode] = useState(!auth.pin);
  const [error, setError] = useState('');

  // Set initial security question when settings are loaded
  useEffect(() => {
    if (settings?.availableQuestions?.length > 0 && !question) {
      setQuestion(settings.availableQuestions[0]);
    }
    if (!auth.pin) {
      setIsResetMode(true);
    }
  }, [settings, auth.pin, question]);

  // Handle auto-login for PIN
  useEffect(() => {
    if (pin.length === 4 && !isResetMode && !useQuestion) {
      handleLogin();
    }
  }, [pin, isResetMode, useQuestion]);

  const handleLogin = () => {
    const success = useQuestion ? login(pin, question, answer) : login(pin);
    if (!success) {
      setError('Invalid PIN or answer');
      setPin('');
      setAnswer('');
    }
  };

  const handleReset = () => {
    if (newPin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }
    if (!question) {
      setError('Please select a security question');
      return;
    }
    if (!answer.trim()) {
      setError('Please provide an answer to your security question');
      return;
    }

    resetPin(newPin, question, answer);
    setIsResetMode(false);
    setPin('');
    setNewPin('');
    setQuestion('');
    setAnswer('');
    setError('');
  };

  // Handle missing settings
  if (!settings?.availableQuestions?.length) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl">
          <div className="text-center">Loading settings...</div>
        </div>
      </div>
    );
  }

  // Don't show if already authenticated
  if (auth.isAuthenticated) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-in fade-in-50 slide-in-from-bottom-10 duration-300">
        <div className="mb-4 flex items-center border-b pb-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold">{isResetMode ? 'Set Up PIN' : 'Enter PIN'}</h2>
        </div>
        <div className="space-y-4 p-6">
          {error && <p className="text-destructive text-sm">{error}</p>}
          {!isResetMode ? (
            <>
              {!useQuestion ? (
                <div className="space-y-2">
                  <Label htmlFor="pin" className="flex justify-between">
                    <span>4-Digit PIN</span>
                    <span className="text-xs text-muted-foreground">{pin.length}/4</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="pin"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                        setPin(value);
                      }}
                      placeholder="Enter 4-digit PIN"
                      className="text-center text-lg pr-10"
                      autoFocus
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {pin.length === 4 && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                          <path d="M20 6L9 17l-5-5"></path>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="question">Security Question</Label>
                    <Select value={question} onValueChange={setQuestion}>
                      <SelectTrigger id="question">
                        <SelectValue placeholder="Select a question" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings.availableQuestions.map((q) => (
                          <SelectItem key={q} value={q}>
                            {q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="answer">Answer</Label>
                    <Input
                      id="answer"
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Enter answer"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <Button
                  variant="link"
                  onClick={() => setUseQuestion(!useQuestion)}
                  className="text-primary"
                >
                  {useQuestion ? 'Use PIN' : 'Use Security Question'}
                </Button>
                <Button
                  variant="link"
                  onClick={() => setIsResetMode(true)}
                  className="text-primary"
                >
                  Set Up PIN
                </Button>
              </div>
              {useQuestion && (
                <Button onClick={handleLogin} className="w-full">
                  Submit
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="newPin" className="flex justify-between">
                  <span>New 4-Digit PIN</span>
                  <span className="text-xs text-muted-foreground">{newPin.length}/4</span>
                </Label>
                <div className="relative">
                  <Input
                    id="newPin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                      setNewPin(value);
                    }}
                    placeholder="Enter new PIN"
                    className="text-center text-lg pr-10"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {newPin.length === 4 && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newQuestion">Security Question</Label>
                <Select 
                  value={question || settings.availableQuestions[0]} 
                  onValueChange={setQuestion}
                >
                  <SelectTrigger id="newQuestion">
                    <SelectValue placeholder={settings.availableQuestions[0]} />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.availableQuestions.map((q) => (
                      <SelectItem key={q} value={q}>
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newAnswer">Answer</Label>
                <Input
                  id="newAnswer"
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter answer"
                />
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsResetMode(false);
                    setError('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleReset}>Save</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PinModal;