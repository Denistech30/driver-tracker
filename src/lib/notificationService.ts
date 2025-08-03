// Notification service for handling inactivity notifications
const NOTIFICATION_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LAST_ACTIVITY_KEY = 'lastActivityTime';

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Update last activity time
export const updateLastActivityTime = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    // Also update in service worker if possible
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_LAST_ACTIVITY',
        timestamp: Date.now()
      });
    }
  }
};

// Get last activity time
export const getLastActivityTime = (): number => {
  if (typeof window === 'undefined') return Date.now();
  const lastTime = localStorage.getItem(LAST_ACTIVITY_KEY);
  return lastTime ? parseInt(lastTime, 10) : Date.now();
};

// Check if notification should be shown
export const shouldShowNotification = (): boolean => {
  const lastActivityTime = getLastActivityTime();
  return Date.now() - lastActivityTime >= NOTIFICATION_INTERVAL_MS;
};

// Show notification
export const showNotification = (title: string, options?: NotificationOptions): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  }
};
