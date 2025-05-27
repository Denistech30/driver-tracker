import * as React from 'react';
import { hashValue } from '../lib/crypto';

interface AuthState {
  isAuthenticated: boolean;
  pin: string | null;
  securityQuestion: string | null;
  securityAnswer: string | null;
}

interface AuthContextType {
  auth: AuthState;
  login: (pin: string, question?: string, answer?: string) => boolean;
  resetPin: (newPin: string, question: string, answer: string) => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = React.useState<AuthState>(() => {
    try {
      const savedPin = localStorage.getItem('pin');
      const savedQuestion = localStorage.getItem('securityQuestion');
      const savedAnswer = localStorage.getItem('securityAnswer');
      
      // If no PIN is set, we need to prompt the user to set one
      const isFirstTimeUser = !savedPin;
      
      return {
        isAuthenticated: false, // Always require PIN setup on first use
        pin: savedPin,
        securityQuestion: savedQuestion,
        securityAnswer: savedAnswer,
      };
    } catch (error) {
      console.error('Error reading auth state from localStorage:', error);
      return {
        isAuthenticated: true, // Default to authenticated on error to prevent lockout
        pin: null,
        securityQuestion: null,
        securityAnswer: null,
      };
    }
  });

  React.useEffect(() => {
    if (auth.isAuthenticated) {
      localStorage.setItem('pin', auth.pin || '');
      if (auth.securityQuestion) localStorage.setItem('securityQuestion', auth.securityQuestion);
      if (auth.securityAnswer) localStorage.setItem('securityAnswer', auth.securityAnswer);
    } else {
      localStorage.removeItem('pin');
      localStorage.removeItem('securityQuestion');
      localStorage.removeItem('securityAnswer');
    }
  }, [auth]);

  const login = (pin: string, question?: string, answer?: string): boolean => {
    // Hash the input PIN and compare with stored hash
    const hashedPin = hashValue(pin);
    if (auth.pin && auth.pin === hashedPin) {
      setAuth((prev) => ({ ...prev, isAuthenticated: true }));
      return true;
    }
    
    // Hash the answer if provided and compare with stored hash
    if (question && answer && auth.securityQuestion === question) {
      const hashedAnswer = hashValue(answer);
      if (auth.securityAnswer === hashedAnswer) {
        setAuth((prev) => ({ ...prev, isAuthenticated: true }));
        return true;
      }
    }
    return false;
  };

  const resetPin = (newPin: string, question: string, answer: string) => {
    // Hash the new PIN and answer before storing
    const hashedPin = hashValue(newPin);
    const hashedAnswer = hashValue(answer);
    
    setAuth({
      isAuthenticated: true,
      pin: hashedPin,
      securityQuestion: question,
      securityAnswer: hashedAnswer,
    });
  };

  const logout = () => {
    setAuth({
      isAuthenticated: false,
      pin: null,
      securityQuestion: null,
      securityAnswer: null,
    });
  };

  const value = React.useMemo(
    () => ({ auth, login, resetPin, logout }),
    [auth]
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