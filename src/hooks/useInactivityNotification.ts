import { useEffect } from 'react';
import { 
  requestNotificationPermission, 
  updateLastActivityTime, 
  shouldShowNotification, 
  showNotification 
} from '../lib/notificationService';

const useInactivityNotification = () => {
  useEffect(() => {
    // Initialize last activity time
    updateLastActivityTime();

    // Request notification permission on mount
    requestNotificationPermission();

    // Check for inactivity and show notification if needed
    const checkInactivity = () => {
      if (shouldShowNotification()) {
        showNotification(
          "Track Your Expenses",
          {
            body: "It's been a while! Don't forget to track your transactions.",
            icon: '/icons/icon-192x192.png',
          }
        );
      }
    };

    // Check every hour
    const intervalId = setInterval(checkInactivity, 60 * 60 * 1000);
    
    // Initial check
    checkInactivity();

    // Set up activity listeners
    const handleUserActivity = () => {
      updateLastActivityTime();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Clean up
    return () => {
      clearInterval(intervalId);
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, []);
};

export default useInactivityNotification;
