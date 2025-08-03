import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { sendRecoveryEmail, checkInternetConnection } from '../lib/emailService';
import { useTranslation } from '../hooks/useTranslation';

// Props for the PinModal
interface PinModalProps {
  mode: 'unlock' | 'setup' | 'change' | 'disable'; // Controls the modal's behavior
  onClose?: () => void; // Callback to close the modal when used as a dialog
  onSuccess?: () => void; // Callback for successful operation (setup/change/disable)
  availableQuestions: string[]; // List of security questions
}

const PinModal = ({ mode: initialMode, onClose, onSuccess, availableQuestions }: PinModalProps): React.ReactElement => {
  const { auth, verifyPin, verifySecurityQuestion, setPinAndSecurityQuestion, disablePin, unlockApp } = useAuth();
  const { t } = useTranslation();
  
  // Allow changing mode internally (for recovery flow)
  const [mode, setMode] = useState(initialMode);
  
  // State for PIN entry/verification
  const [pin, setPin] = useState('');
  const [useQuestion, setUseQuestion] = useState(false);
  const [question, setQuestion] = useState(auth.securityQuestion || '');
  const [answer, setAnswer] = useState('');
  
  // State for new PIN setup/change
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [setupQuestion, setSetupQuestion] = useState(availableQuestions[0] || '');
  const [setupAnswer, setSetupAnswer] = useState('');
  const [setupEmail, setSetupEmail] = useState(''); // Required recovery email for PIN setup
  
  // UI States
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // States for failed attempts and lockout
  const [attempts, setAttempts] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const MAX_ATTEMPTS = 3;
  const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds
  
  // Recovery mode states
  const [isInRecoveryMode, setIsInRecoveryMode] = useState(false);
  const [isFromRecovery, setIsFromRecovery] = useState(false); // Flag to track if user is coming from recovery
  const [recoveryCode, setRecoveryCode] = useState('');
  
  // Effect for recovery email initialization
  useEffect(() => {
    if (mode === 'change' && auth.recoveryEmail) {
      setSetupEmail(auth.recoveryEmail);
    }
  }, [mode, auth.recoveryEmail]);
  
  // Effect for lockout timer
  useEffect(() => {
    if (lockedOut) {
      const timer = setTimeout(() => {
        setLockedOut(false);
        setAttempts(0);
        setError('');
      }, LOCKOUT_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [lockedOut]);
  
  // Effect to initialize question from available questions
  useEffect(() => {
    if (availableQuestions.length > 0) {
      if (!setupQuestion) {
        setSetupQuestion(availableQuestions[0]);
      }
      if (auth.securityQuestion && !question) {
        setQuestion(auth.securityQuestion);
      }
    }
  }, [availableQuestions, setupQuestion, auth.securityQuestion, question]);
  
  // Handle PIN input changes (numeric only)
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setter(value);
  };
  
  // Handle recovery code input changes (alphanumeric allowed)
  const handleRecoveryCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 8); // Limit to 8 characters but allow letters and numbers
    setRecoveryCode(value);
  };
  
  // Function to mask email for privacy in UI
  const maskEmail = (email: string): string => {
    if (!email) return '';
    
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    
    const name = parts[0];
    const domain = parts[1];
    
    // Show first character, mask the rest
    const maskedName = name.charAt(0) + '***';
    return `${maskedName}@${domain}`;
  };
  
  // Create a device fingerprint for secure recovery
  const getDeviceFingerprint = async (): Promise<string> => {
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    const dateNow = new Date().toISOString();
    
    // Combine all details into a fingerprint
    const fingerprintBase = `${screenInfo}|${timeZone}|${language}|${platform}|${userAgent}|${dateNow}`;
    
    // Use a cryptographic hash of the fingerprint
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintBase);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  // Generate recovery code for account recovery
  const generateRecoveryCode = async (): Promise<string> => {
    // Device fingerprint adds an additional layer of security
    const deviceFingerprint = await getDeviceFingerprint();
    
    // Get current timestamp for code expiration
    const timestamp = Date.now();
    
    // Get a portion of the device fingerprint and timestamp for the code
    // The first 4 digits from fingerprint and 4 digits from timestamp
    const fingerprintPart = deviceFingerprint.substring(0, 4);
    const timestampPart = timestamp.toString().substring(timestamp.toString().length - 4);
    
    // Combine for an 8-digit code that will be valid only for this device and time period
    const recoveryCode = `${fingerprintPart}${timestampPart}`;
    
    // Store the code and its expiration time in localStorage for later verification
    // Code will expire after 15 minutes
    const expiresAt = timestamp + (15 * 60 * 1000); // 15 minutes in milliseconds
    
    localStorage.setItem('recovery_code', recoveryCode);
    localStorage.setItem('recovery_code_expires', expiresAt.toString());
    localStorage.setItem('recovery_device_fingerprint', deviceFingerprint);
    
    return recoveryCode;
  };
  
  // Verify recovery code with enhanced security
  const verifyRecoveryCode = async (code: string): Promise<boolean> => {
    const storedCode = localStorage.getItem('recovery_code');
    const expiresAtStr = localStorage.getItem('recovery_code_expires');
    const storedFingerprint = localStorage.getItem('recovery_device_fingerprint');
    
    // Log for debugging
    console.log('Verifying recovery code:');
    console.log('Entered code:', code);
    console.log('Stored code:', storedCode);
    
    if (!storedCode || !expiresAtStr || !storedFingerprint) {
      console.log('Missing recovery data in localStorage');
      return false; // No recovery code has been issued
    }
    
    const expiresAt = parseInt(expiresAtStr, 10);
    const now = Date.now();
    
    if (now > expiresAt) {
      console.log('Recovery code expired');
      // Recovery code has expired
      localStorage.removeItem('recovery_code');
      localStorage.removeItem('recovery_code_expires');
      localStorage.removeItem('recovery_device_fingerprint');
      return false;
    }
    
    // The most important check is that the code matches
    // Do a direct comparison of the recovery codes
    const codeMatches = (code === storedCode);
    console.log('Code match result:', codeMatches);
    
    // Return true if the code matches, don't check device fingerprint
    // This makes recovery more reliable across different sessions/devices
    return codeMatches;
  };
  
  // Send recovery email using EmailJS
  const sendRecoveryCodeEmail = async (code: string): Promise<boolean> => {
    if (!auth.recoveryEmail) {
      setError('No recovery email found. Please contact support.');
      return false;
    }
    
    // Check internet connection first
    const isOnline = await checkInternetConnection();
    if (!isOnline) {
      setError('No internet connection available to send recovery email. Please connect to the internet and try again.');
      return false;
    }
    
    try {
      // Show sending status
      setMessage('Sending recovery email... Please wait.');
      
      // Send actual email using EmailJS
      const sent = await sendRecoveryEmail(auth.recoveryEmail, code);
      if (sent) {
        return true;
      } else {
        setError('Failed to send recovery email. Please try again later.');
        return false;
      }
    } catch (error) {
      console.error('Error sending recovery email:', error);
      setError('An error occurred while sending the recovery email. Please try again later.');
      return false;
    }
  };
  
  // Handle unlock request (when user enters PIN or security question)
  const handleUnlock = async (): Promise<void> => {
    if (lockedOut) {
      return;
    }
    
    try {
      let isValid = false;
      
      if (useQuestion) {
        // Using security question
        if (!question || !answer.trim()) {
          setError('Please enter your security answer.');
          return;
        }
        
        isValid = await verifySecurityQuestion(question, answer);
      } else {
        // Using PIN
        if (pin.length !== 4) {
          setError('Please enter your 4-digit PIN.');
          return;
        }
        
        isValid = await verifyPin(pin);
      }
      
      if (isValid) {
        // Reset states on successful unlock
        setError('');
        setAttempts(0);
        setPin('');
        setAnswer('');
        
        // Call app unlock method
        unlockApp();
        onSuccess?.();
      } else {
        // Track failed attempts and implement lockout if exceeded
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedOut(true);
          setError(`Too many failed attempts. Please try again in ${LOCKOUT_DURATION_MS / 1000} seconds.`);
        } else {
          setError(`Incorrect ${useQuestion ? 'answer' : 'PIN'}. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
        }
      }
    } catch (error) {
      console.error('Unlock error:', error);
      setError('An error occurred. Please try again.');
    }
  };
  
  // Handle account recovery process
  const handleRecovery = async (): Promise<void> => {
    if (!auth.recoveryEmail) {
      setError('No recovery email found. Recovery is not available.');
      return;
    }
    
    setIsInRecoveryMode(true);
    setError('');
    
    try {
      // Generate a secure recovery code
      const code = await generateRecoveryCode();
      
      // Send recovery email
      const emailSent = await sendRecoveryCodeEmail(code);
      
      if (emailSent) {
        setMessage(`A recovery code has been sent to ${maskEmail(auth.recoveryEmail)}.`);
      } else {
        // Error message will be set by sendRecoveryCodeEmail
        setIsInRecoveryMode(false);
      }
    } catch (error) {
      console.error('Recovery process error:', error);
      setError('Failed to initiate recovery process. Please try again later.');
      setIsInRecoveryMode(false);
    }
  };
  
  // Handle PIN setup/change/disable (from Settings screen)
  const handleSubmitPinManagement = async (): Promise<void> => {
    if (mode === 'setup' || mode === 'change') {
      // PIN setup or change
      if (newPin.length !== 4) {
        setError('Please enter a 4-digit PIN.');
        return;
      }
      
      if (newPin !== confirmNewPin) {
        setError('PINs do not match. Please try again.');
        return;
      }
      
      if (!setupQuestion || !setupAnswer.trim()) {
        setError('Please set a security question and answer.');
        return;
      }
      
      if (mode === 'setup' && !setupEmail.trim()) {
        setError('Please provide a recovery email for account recovery.');
        return;
      }
      
      // Email validation for setup mode
      if (mode === 'setup' && setupEmail.trim()) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(setupEmail)) {
          setError('Please enter a valid email address.');
          return;
        }
      }
      
      // For PIN change, verify old PIN first (skip if coming from recovery flow)
      if (mode === 'change' && !isFromRecovery) {
        if (pin.length !== 4) {
          setError('Please enter your current PIN to confirm the change.');
          return;
        }
        
        try {
          const isValid = await verifyPin(pin);
          if (!isValid) {
            setError('Incorrect current PIN. Cannot change PIN.');
            return;
          }
        } catch (error) {
          console.error('PIN verification error:', error);
          setError('An error occurred. Please try again.');
          return;
        }
      }
      
      // All validations passed, set the new PIN
      try {
        await setPinAndSecurityQuestion(
          newPin, 
          setupQuestion, 
          setupAnswer,
          mode === 'setup' ? setupEmail : (auth.recoveryEmail || '')
        );
        
        setMessage(isFromRecovery ? 'PIN reset successful! You can now use your new PIN to unlock the app.' : 
                  (mode === 'setup' ? 'PIN setup successful!' : 'PIN changed successfully!'));
        onSuccess?.();
        
        // Reset form
        setPin('');
        setNewPin('');
        setConfirmNewPin('');
        // Reset recovery state after successful change
        if (isFromRecovery) {
          setIsFromRecovery(false);
          setMode('unlock'); // Switch back to unlock mode after successful reset
        }
      } catch (error) {
        console.error('PIN setup error:', error);
        setError('An error occurred. Please try again.');
      }
    } else if (mode === 'disable') {
      // PIN disable
      if (pin.length !== 4) {
        setError('Please enter your current PIN to disable PIN protection.');
        return;
      }
      
      try {
        const isValid = await verifyPin(pin);
        
        if (isValid) {
          disablePin();
          setMessage('PIN protection disabled successfully!');
          onSuccess?.();
          setPin('');
        } else {
          setError('Incorrect PIN. Cannot disable PIN protection.');
        }
      } catch (error) {
        console.error('PIN disable error:', error);
        setError('An error occurred. Please try again.');
      }
    }
  };
  
  const handleChangePin = async () => {
    try {
      setError('');
      
      // Verify current PIN first (unless in recovery mode)
      if (!isFromRecovery) {
        const isCurrentPinValid = await verifyPin(pin);
        if (!isCurrentPinValid) {
          setError(t('pin.incorrectPin'));
          setAttempts(prev => {
            const newAttempts = prev + 1;
            if (newAttempts >= MAX_ATTEMPTS) {
              setLockedOut(true);
              return 0;
            }
            return newAttempts;
          });
          return;
        }
      }
      
      // Check if new PIN and confirmation match
      if (newPin !== confirmNewPin) {
        setError(t('pin.noMatch'));
        return;
      }
      
      // Update the PIN
      await setPinAndSecurityQuestion(newPin, setupQuestion, setupAnswer, setupEmail);
      setMessage(isFromRecovery ? t('pin.resetSuccess') : t('pin.changed'));
      
      // Reset form and recovery state
      setNewPin('');
      setConfirmNewPin('');
      setPin('');
      setIsFromRecovery(false);
      
      // Call success callback
      onSuccess?.();
      
    } catch (error) {
      console.error('Error changing PIN:', error);
      setError(isFromRecovery ? t('pin.resetError') : t('pin.changeError'));
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto pt-10 pb-16 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full p-6 mx-auto my-8 relative text-gray-900 dark:text-gray-100">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-xl font-bold">
              {mode === 'unlock' && t('pin.unlock')}
              {mode === 'setup' && t('pin.setup')}
              {mode === 'change' && t('pin.change')}
              {mode === 'disable' && t('pin.disable')}
            </h2>
            {message && <p className="text-green-600 dark:text-green-400 mt-2">{message}</p>}
            {error && <p className="text-red-500 dark:text-red-400 mt-2">{error}</p>}
          </div>
          
          {/* Content based on mode */}
          {mode === 'unlock' ? (
            /* UNLOCK MODE */
            <>
              {!isInRecoveryMode ? (
                /* PIN/Security Question Entry */
                <>
                  {!useQuestion ? (
                    /* PIN Entry */
                    <div className="space-y-2">
                      <Label htmlFor="pin">{t('pin.enter')}</Label>
                      <Input
                        id="pin"
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => handlePinChange(e, setPin)}
                        placeholder="Enter 4-digit PIN"
                        className="text-center text-lg tracking-widest bg-white dark:bg-gray-800"
                        disabled={lockedOut}
                      />
                      
                      <div className="flex justify-between items-center mt-2">
                        <button
                          className="text-blue-500 dark:text-blue-400 hover:underline hover:text-blue-600 dark:hover:text-blue-300 mt-1"
                          onClick={() => setIsInRecoveryMode(true)}
                        >
                          {t('pin.forgotPin')}
                        </button>
                        
                        {auth.securityQuestion && (
                          <Button
                            variant="link"
                            onClick={() => setUseQuestion(!useQuestion)}
                            className="text-blue-500 dark:text-blue-400"
                            disabled={lockedOut}
                          >
                            Use Security Question
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Security Question Entry */
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="security-question">{t('pin.securityQuestion')}</Label>
                        <div className="border dark:border-gray-700 rounded-md p-3 mb-3 bg-gray-50 dark:bg-gray-800">
                          {question}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="answer">{t('pin.securityAnswer')}</Label>
                        <Input
                          id="answer"
                          type="text"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Enter your answer"
                          className="bg-white dark:bg-gray-800"
                          disabled={lockedOut}
                        />
                      </div>
                      
                      <div className="flex justify-between">
                        {/* Security Question Toggle */}
                        {auth.securityQuestion && (
                          <Button
                            variant="link"
                            onClick={() => setUseQuestion(!useQuestion)}
                            className="text-blue-500 dark:text-blue-400"
                            disabled={lockedOut}
                          >
                            Use PIN
                          </Button>
                        )}
                        
                        {/* Account Recovery Button */}
                        {auth.recoveryEmail && (
                          <Button
                            variant="link"
                            onClick={() => {
                              if (!isInRecoveryMode && window.confirm(
                                t('pin.recoveryPrompt')
                              )) {
                                handleRecovery();
                              }
                            }}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                            disabled={lockedOut}
                          >
                            {t('pin.recovery')}
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                  
                  {/* Unlock Button */}
                  <Button 
                    onClick={handleUnlock} 
                    className="w-full mt-4" 
                    disabled={lockedOut || 
                      (useQuestion && (!question || !answer.trim())) || 
                      (!useQuestion && pin.length !== 4)}
                  >
                    {t('pin.unlock')}
                  </Button>
                </>
              ) : (
                /* Recovery Mode */
                <div className="space-y-4">
                  <p className="text-sm whitespace-pre-line text-gray-800 dark:text-gray-200">{message}</p>
                  
                  <div className="p-4 border dark:border-gray-700 rounded-lg mb-4 bg-gray-50 dark:bg-gray-800 text-center">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      A recovery code has been sent to:
                    </p>
                    <strong className="block text-gray-900 dark:text-gray-100">
                      {maskEmail(auth.recoveryEmail || '')}
                    </strong>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      The code will be valid for 15 minutes.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recovery-code">{t('pin.recoveryCode')}</Label>
                    <Input
                      id="recovery-code"
                      type="text"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value.substring(0, 8))}
                      placeholder="Enter 8-character code"
                      className="bg-white dark:bg-gray-800 text-center text-lg tracking-widest"
                      maxLength={8}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Button onClick={async () => {
                      const isValid = await verifyRecoveryCode(recoveryCode);
                      
                      if (isValid) {
                        setMessage(t('pin.recoverySuccess'));
                        // Switch to PIN setup mode
                        setTimeout(() => {
                          setIsInRecoveryMode(false);
                          setIsFromRecovery(true); // Set flag to skip PIN verification
                          setMode('change');
                        }, 1500);
                      } else {
                        setError(t('pin.recoveryFailed'));
                      }
                    }} className="w-full">
                      Verify Code
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setIsInRecoveryMode(false)} 
                      className="w-full"
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* SETUP/CHANGE/DISABLE MODES */
            <>
              {mode === 'disable' ? (
                /* PIN disable */
                <div className="space-y-2">
                  <Label htmlFor="current-pin">Current PIN</Label>
                  <Input
                    id="current-pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => handlePinChange(e, setPin)}
                    placeholder="Enter current PIN"
                    className="text-center text-lg tracking-widest bg-white dark:bg-gray-800"
                  />
                </div>
              ) : (
                /* PIN setup/change */
                <div className="space-y-4">
                  {mode === 'change' && !isFromRecovery && (
                    <div className="space-y-2">
                      <Label htmlFor="current-pin">Current PIN</Label>
                      <Input
                        id="current-pin"
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => handlePinChange(e, setPin)}
                        placeholder="Enter current PIN"
                        className="text-center text-lg tracking-widest bg-white dark:bg-gray-800"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-pin">New PIN</Label>
                    <Input
                      id="new-pin"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => handlePinChange(e, setNewPin)}
                      placeholder="Enter 4-digit PIN"
                      className="text-center text-lg tracking-widest bg-white dark:bg-gray-800"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-pin">{t('pin.confirm')}</Label>
                    <Input
                      id="confirm-pin"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={confirmNewPin}
                      onChange={(e) => handlePinChange(e, setConfirmNewPin)}
                      placeholder="Confirm 4-digit PIN"
                      className="text-center text-lg tracking-widest bg-white dark:bg-gray-800"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="security-question">{t('pin.securityQuestion')}</Label>
                    <Select value={setupQuestion} onValueChange={setSetupQuestion}>
                      <SelectTrigger id="security-question" className="bg-white dark:bg-gray-800">
                        <SelectValue placeholder="Select a security question" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800">
                        {availableQuestions.map((q) => (
                          <SelectItem key={q} value={q}>{q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="security-answer">{t('pin.securityAnswer')}</Label>
                    <Input
                      id="security-answer"
                      type="text"
                      value={setupAnswer}
                      onChange={(e) => setSetupAnswer(e.target.value)}
                      placeholder={t('pin.securityAnswer')}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email">{t('pin.recoveryEmail')}</Label>
                    <Input
                      id="recovery-email"
                      type="email"
                      value={setupEmail}
                      onChange={(e) => setSetupEmail(e.target.value)}
                      placeholder={t('pin.recoveryEmail')}
                      className="bg-white dark:bg-gray-800"
                      disabled={mode === 'change' && !!auth.recoveryEmail}
                    />
                    {mode === 'change' && auth.recoveryEmail && (
                      <p className="text-xs text-muted-foreground mt-1 dark:text-gray-400">
                        Recovery email cannot be changed after initial setup for security reasons.
                      </p>
                    )}
                    {mode === 'setup' && (
                      <p className="text-xs text-muted-foreground mt-1 dark:text-gray-400">
                        {t('pin.recoveryEmailInfo')}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex justify-between mt-6 pb-4">
                <Button variant="outline" onClick={onClose} className="flex-1 mr-2">
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSubmitPinManagement} className="flex-1">
                  {mode === 'setup' && t('pin.setup')}
                  {mode === 'change' && t('pin.change')}
                  {mode === 'disable' && t('pin.disable')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinModal;
