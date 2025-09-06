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
  
  // If permission granted, ensure service worker is ready for background notifications
  if (permission === 'granted' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker ready for background notifications');
    } catch (error) {
      console.log('Service worker not available for background notifications:', error);
    }
  }
  
  return permission === 'granted';
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

// Update last activity time
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
