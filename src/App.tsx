import React, { useEffect, useRef, useCallback, useState } from 'react';
import { initEmailService } from './lib/emailService';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PinModal from './components/PinModal';
import Overview from './pages/Overview';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import Reports from './pages/Reports';
import Calendar from './pages/Calendar';
import Categories from './pages/Categories';
import Settings from './pages/Settings';
import NotificationTest from './pages/NotificationTest';
import { Toaster } from './components/ui/toaster';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useSettings } from './contexts/SettingsContext';
import { BudgetProvider } from './contexts/BudgetContext';
import useInactivityNotification from './hooks/useInactivityNotification';

// AppContent handles routing and app lock logic
function AppContent() {
  // Initialize inactivity notifications
  useInactivityNotification();
  
  return (
    <BudgetProvider>
      <AppContentInner />
    </BudgetProvider>
  );
}

function AppContentInner() {
  const { isAppLocked, lockApp, auth, pinFeatureEnabled } = useAuth();
  const { settings } = useSettings(); 

  // --- App State & Refs ---
  const inactivityTimeoutRef = useRef<number | null>(null);
  const appBackgroundTime = useRef<number | null>(null);
  const INACTIVITY_DURATION_MS = 5 * 60 * 1000; // 5 minutes of inactivity
  // Minimum time in background to trigger lock (milliseconds) - set to 0 for immediate lock
  const MIN_BACKGROUND_TIME_TO_LOCK = 0;

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    // Only set timer if app is currently authenticated AND PIN feature is enabled
    // AND the app is not already locked.
    if (auth.isAuthenticated && pinFeatureEnabled && !isAppLocked) {
      inactivityTimeoutRef.current = window.setTimeout(() => {
        console.log("Inactivity detected. Locking app.");
        lockApp(); // Trigger app lock via AuthContext
      }, INACTIVITY_DURATION_MS);
    }
  }, [auth.isAuthenticated, pinFeatureEnabled, isAppLocked, lockApp]);

  

  // --- App Lifecycle Listeners ---
  // Define memoized handlers to avoid dependency issues
  const handleUserActivity = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);
  
  useEffect(() => {
    // Attach activity listeners for inactivity timeout
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(event => document.addEventListener(event, handleUserActivity));

    // Use the refs defined at the top level of the component 

    // Detect app visibility changes (e.g., coming from background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // App went to background, record the time and clear inactivity timer
        appBackgroundTime.current = Date.now();
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
      } else { // 'visible'
        // App came to foreground
        const timeInBackground = appBackgroundTime.current ? Date.now() - appBackgroundTime.current : 0;
        
        // If PIN is enabled and app is authenticated, lock immediately
        if (pinFeatureEnabled && auth.isAuthenticated && timeInBackground >= MIN_BACKGROUND_TIME_TO_LOCK) {
          console.log(`App resumed after ${timeInBackground}ms. Forcing lock.`);
          // Use setTimeout with 0 delay to ensure this runs immediately after render
          setTimeout(() => {
            lockApp(); // Trigger app lock
          }, 0);
        }
        
        // Reset the background time
        appBackgroundTime.current = null;
        
        // Always reset inactivity timer when app becomes visible
        resetInactivityTimer();
      }
    };

    // Add both visibilitychange and focus/blur listeners for better detection
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Backup method for detecting app return using focus/blur
    const handleBlur = () => {
      appBackgroundTime.current = Date.now();
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
    window.addEventListener('blur', handleBlur);
    
    const handleFocus = () => {
      const timeInBackground = appBackgroundTime.current ? Date.now() - appBackgroundTime.current : 0;
      
      if (pinFeatureEnabled && auth.isAuthenticated && timeInBackground >= MIN_BACKGROUND_TIME_TO_LOCK) {
        console.log(`App refocused after ${timeInBackground}ms. Forcing lock.`);
        setTimeout(() => {
          lockApp(); // Trigger app lock
        }, 0);
      }
      
      appBackgroundTime.current = null;
      resetInactivityTimer();
    };
    window.addEventListener('focus', handleFocus);

    // Initial reset of the timer when component mounts
    resetInactivityTimer();

    // Cleanup listeners when component unmounts
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      activityEvents.forEach(event => document.removeEventListener(event, handleUserActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [handleUserActivity, pinFeatureEnabled, auth.isAuthenticated, lockApp, resetInactivityTimer]);


  return (
    <>
      {/* PinModal for unlocking the app, rendered only when app is locked and PIN feature is enabled */}
      {isAppLocked && pinFeatureEnabled && (
        <PinModal mode="unlock" availableQuestions={settings.availableQuestions || []} />
      )}

      {/* Render main app content only if app is NOT locked OR PIN feature is not enabled */}
      {(!isAppLocked || !pinFeatureEnabled) && (
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="add-transaction" element={<AddTransaction />} />
            <Route path="transactions/edit/:transactionId" element={<AddTransaction />} />
            <Route path="reports" element={<Reports />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="categories" element={<Categories />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notification-test" element={<NotificationTest />} />
          </Route>
        </Routes>
      )}
      <Toaster />
    </>
  );
}

// Wrapper to provide contexts to the entire application
function App() {
  // Initialize EmailJS service when the app starts
  useEffect(() => {
    // Initialize the email service
    initEmailService();
    console.log('EmailJS service initialized');
  }, []);

  return (
    <AppContent />
  );
}

export default App;