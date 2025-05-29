import * as React from 'react';
import { hashValue, compareHash } from '../lib/crypto';

interface AuthState {
  isAuthenticated: boolean; // True if user is currently logged in/app is unlocked
  pin: string | null; // Stored PIN hash
  securityQuestion: string | null; // Stored security question
  securityAnswer: string | null; // Stored security answer hash
  recoveryEmail: string | null; // Email address for account recovery
}

interface AuthContextType {
  auth: AuthState;
  verifyPin: (pin: string) => Promise<boolean>;
  verifySecurityQuestion: (question: string, answer: string) => Promise<boolean>;
  setPinAndSecurityQuestion: (newPin: string, question: string, answer: string, email: string) => Promise<boolean>;
  disablePin: () => void; // Function to clear PIN and security question
  isAppLocked: boolean; // Is the app currently in a locked state (showing PIN modal)?
  lockApp: () => void; // Function to force the app to lock
  unlockApp: () => void; // Function to unlock the app (called on successful PIN entry)
  pinFeatureEnabled: boolean; // Is the PIN feature generally active (user has set a PIN)?
  setPinFeatureEnabled: (enabled: boolean) => void; // To update this state from Settings
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize auth state from localStorage
  const [auth, setAuth] = React.useState<AuthState>(() => {
    try {
      const savedPin = localStorage.getItem('pin');
      const savedQuestion = localStorage.getItem('securityQuestion');
      const savedAnswer = localStorage.getItem('securityAnswer');
      const savedEmail = localStorage.getItem('recoveryEmail');

      // If a PIN is set, the app starts locked (isAuthenticated: false) requiring PIN entry.
      // If no PIN is set, the app starts unlocked (isAuthenticated: true), implying first-time use or PIN disabled.
      const hasPinSet = !!savedPin;
      return {
        isAuthenticated: !hasPinSet, 
        pin: savedPin,
        securityQuestion: savedQuestion,
        securityAnswer: savedAnswer,
        recoveryEmail: savedEmail,
      };
    } catch (error) {
      console.error('Error reading auth state from localStorage:', error);
      // On error, default to locked to be safe, but allow app to start if no PIN was ever set.
      return {
        isAuthenticated: false, // Default to NOT authenticated to prevent accidental lockout if PIN exists
        pin: null, // Clear PIN data on error to prevent inconsistent state
        securityQuestion: null,
        securityAnswer: null,
        recoveryEmail: null,
      };
    }
  });

  // isAppLocked controls the visibility of the PinModal for unlocking
  const [isAppLocked, setIsAppLocked] = React.useState(!auth.isAuthenticated); // Locked if not authenticated initially
  // pinFeatureEnabled indicates if a PIN is set by the user (regardless of current lock state)
  const [pinFeatureEnabled, setPinFeatureEnabled] = React.useState(!!auth.pin); 

  // Effect to update localStorage whenever auth state related to PIN/security changes
  React.useEffect(() => {
    localStorage.setItem('pin', auth.pin || '');
    if (auth.securityQuestion) localStorage.setItem('securityQuestion', auth.securityQuestion);
    else localStorage.removeItem('securityQuestion');

    if (auth.securityAnswer) localStorage.setItem('securityAnswer', auth.securityAnswer);
    else localStorage.removeItem('securityAnswer');
    
    if (auth.recoveryEmail) localStorage.setItem('recoveryEmail', auth.recoveryEmail);
    else localStorage.removeItem('recoveryEmail');

    // Sync pinFeatureEnabled with whether a PIN actually exists
    setPinFeatureEnabled(!!auth.pin);
  }, [auth.pin, auth.securityQuestion, auth.securityAnswer, auth.recoveryEmail]);

  // Authenticates the user with a PIN (used for unlocking the app)
  const verifyPin = async (pin: string): Promise<boolean> => {
    if (!auth.pin) return false; // No PIN set to verify against
    const match = await compareHash(pin, auth.pin);
    if (match) {
      setAuth((prev) => ({ ...prev, isAuthenticated: true }));
      setIsAppLocked(false); // Unlock the app
      return true;
    }
    return false;
  };

  // Authenticates the user with security question/answer (used for unlocking)
  const verifySecurityQuestion = async (question: string, answer: string): Promise<boolean> => {
    if (!auth.securityQuestion || !auth.securityAnswer || auth.securityQuestion !== question) return false;
    const match = await compareHash(answer, auth.securityAnswer);
    if (match) {
      setAuth((prev) => ({ ...prev, isAuthenticated: true }));
      setIsAppLocked(false); // Unlock the app
      return true;
    }
    return false;
  };

  // Sets or changes the PIN and security question (used for setup and change flows)
  const setPinAndSecurityQuestion = async (newPin: string, question: string, answer: string, email: string): Promise<boolean> => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }
      
      const hashedPin = await hashValue(newPin);
      const hashedAnswer = await hashValue(answer);
      
      setAuth({
        isAuthenticated: true, // User is authenticated after setting/resetting PIN
        pin: hashedPin,
        securityQuestion: question,
        securityAnswer: hashedAnswer,
        recoveryEmail: email,
      });
      setIsAppLocked(false); // Ensure app is unlocked after setting/changing PIN
      return true;
    } catch (error) {
      console.error("Error setting/resetting PIN and security question:", error);
      return false;
    }
  };

  // Disables the PIN protection
  const disablePin = () => {
    setAuth((prev) => ({
      ...prev,
      pin: null, // Clear the PIN hash
      securityQuestion: null, // Clear security question/answer
      securityAnswer: null,
      recoveryEmail: null, // Clear recovery email
    }));
    // App remains authenticated if it was already, just without PIN protection
    setIsAppLocked(false); // Ensure app is unlocked when PIN is disabled
  };

  // Forces the app into a locked state, requiring PIN entry
  const lockApp = () => {
    setAuth((prev) => ({ ...prev, isAuthenticated: false })); // Mark as not authenticated
    setIsAppLocked(true); // Show the PIN modal
  };

  // Function to explicitly unlock the app (used by PinModal on success)
  const unlockApp = () => {
    setAuth((prev) => ({ ...prev, isAuthenticated: true }));
    setIsAppLocked(false);
  };

  const value = React.useMemo(
    () => ({
      auth,
      verifyPin,
      verifySecurityQuestion,
      setPinAndSecurityQuestion,
      disablePin,
      isAppLocked,
      lockApp,
      unlockApp,
      pinFeatureEnabled,
      setPinFeatureEnabled,
    }),
    [auth, isAppLocked, pinFeatureEnabled]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}