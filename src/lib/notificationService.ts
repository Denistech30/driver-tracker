// Notification service for handling inactivity notifications
const NOTIFICATION_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LAST_ACTIVITY_KEY = 'lastActivityTime';

// Request notification permission with mobile PWA support
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('Notification permission already granted');
    await setupBackgroundSync();
    return true;
  }

  const permission = await Notification.requestPermission();
  console.log('Notification permission result:', permission);
  
  // If permission granted, ensure service worker is ready for background notifications
  if (permission === 'granted' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker ready for background notifications');
      await setupBackgroundSync();
    } catch (error) {
      console.log('Service worker not available for background notifications:', error);
    }
  }
  
  return permission === 'granted';
};

// Setup background sync for mobile PWA support
const setupBackgroundSync = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Register for background sync if available
      if ('sync' in registration) {
        console.log('Registering background sync for inactivity check');
        await (registration as any).sync.register('inactivity-check');
      }
      
      // Register for periodic background sync if available (Chrome)
      if ('periodicSync' in registration) {
        console.log('Registering periodic background sync');
        try {
          await (registration as any).periodicSync.register('inactivity-check', {
            minInterval: 24 * 60 * 60 * 1000 // 24 hours
          });
        } catch (error) {
          console.log('Periodic background sync not available or permission denied:', error);
        }
      }
    } catch (error) {
      console.error('Error setting up background sync:', error);
    }
  }
};

// Function to open IndexedDB for better service worker compatibility
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('XpenseDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
};

// Function to save to IndexedDB
const saveToIndexedDB = async (key: string, value: number): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    await store.put({ key, value });
  } catch (error) {
    console.log('Could not save to IndexedDB:', error);
  }
};

// Update last activity time with better mobile support
export const updateLastActivityTime = (): void => {
  if (typeof window !== 'undefined') {
    const timestamp = Date.now();
    
    // Save to localStorage for immediate access
    localStorage.setItem(LAST_ACTIVITY_KEY, timestamp.toString());
    
    // Save to IndexedDB for service worker access
    saveToIndexedDB(LAST_ACTIVITY_KEY, timestamp);
    
    // Also update in service worker if possible
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_LAST_ACTIVITY',
        timestamp: timestamp
      });
    }
    
    console.log('Updated last activity time:', new Date(timestamp).toISOString());
  }
};

// Test notification function for debugging
export const testNotification = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications.');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Test Notification', {
        body: 'This is a test notification to verify the system is working.',
        icon: '/icons/icon-192x192.png',
        tag: 'test-notification'
      });
      console.log('Test notification sent successfully');
      return true;
    } else {
      new Notification('Test Notification', {
        body: 'This is a test notification to verify the system is working.',
        icon: '/icons/icon-192x192.png'
      });
      return true;
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
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
