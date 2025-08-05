import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute, setCatchHandler } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Force HTTPS in production
if (self.location.protocol === 'http:' && !self.location.hostname.includes('localhost')) {
  self.location.replace(
    self.location.href.replace('http://', 'https://')
  );
}

// Precache assets from Vite build
precacheAndRoute(self.__WB_MANIFEST);

// Cache static assets (CSS, JS, images) with improved strategy
registerRoute(
  ({ request }) => 
    request.destination === 'style' || 
    request.destination === 'script' || 
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true // Auto cleanup if storage quota is exceeded
      })
    ]
  })
);

// Cache images with CacheFirst strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 14 * 24 * 60 * 60, // 14 days
        purgeOnQuotaError: true
      })
    ]
  })
);

// Cache data with NetworkFirst but fall back to cache
registerRoute(
  ({ url }) => url.pathname === '/data',
  new NetworkFirst({
    cacheName: 'data-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
        purgeOnQuotaError: true
      })
    ],
    networkTimeoutSeconds: 3 // Fall back to cache if network is slow
  })
);

// Install event - precache important URLs
self.addEventListener('install', (event) => {
  console.log('Service worker installing');
  // Precache the offline page
  event.waitUntil(
    caches.open('offline-fallback').then((cache) => {
      return cache.addAll([
        '/', // Homepage
        '/offline.html' // Dedicated offline page (you'll need to create this)
      ]);
    }).then(() => {
      // Initialize last activity time on install
      console.log('Initializing last activity time');
      return saveLastActivityTime(Date.now());
    })
  );
  
  self.skipWaiting();
});

// Add background sync event for better mobile support
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  if (event.tag === 'inactivity-check') {
    event.waitUntil(
      (async () => {
        try {
          if (await shouldSendNotification()) {
            await sendInactivityNotification();
          }
        } catch (error) {
          console.error('Error in background sync:', error);
        }
      })()
    );
  }
});

// Add periodic background sync if available (for better mobile support)
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic background sync event:', event.tag);
  if (event.tag === 'inactivity-check') {
    event.waitUntil(
      (async () => {
        try {
          if (await shouldSendNotification()) {
            await sendInactivityNotification();
          }
        } catch (error) {
          console.error('Error in periodic background sync:', error);
        }
      })()
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [
    'static-resources',
    'image-cache',
    'data-cache',
    'offline-fallback'
  ];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
      console.log('Service worker activated');
      // Start the inactivity check timer
      startInactivityTimer();
      // Try to register for background sync if available
      if (self.registration.sync) {
        console.log('Background sync available');
      } else {
        console.log('Background sync not available');
      }
    })
  );
});

// Background notification functionality
const NOTIFICATION_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LAST_ACTIVITY_KEY = 'lastActivityTime';
const NOTIFICATION_TIMER_KEY = 'notificationTimer';

// Function to get last activity time from IndexedDB or localStorage
const getLastActivityTime = async () => {
  try {
    // Try to get from IndexedDB first (more reliable for service workers)
    const db = await openDB();
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const result = await store.get(LAST_ACTIVITY_KEY);
    
    if (result && result.value) {
      return result.value;
    }
  } catch (error) {
    console.log('IndexedDB not available, falling back to localStorage simulation');
  }
  
  // Fallback: simulate localStorage access (service workers can't directly access localStorage)
  return Date.now(); // Default to current time if no data found
};

// Function to open IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('XpenseDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
};

// Function to save last activity time to IndexedDB
const saveLastActivityTime = async (timestamp) => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    await store.put({ key: LAST_ACTIVITY_KEY, value: timestamp });
  } catch (error) {
    console.log('Could not save to IndexedDB:', error);
  }
};

// Function to check if notification should be sent
const shouldSendNotification = async () => {
  const lastActivityTime = await getLastActivityTime();
  const timeSinceLastActivity = Date.now() - lastActivityTime;
  return timeSinceLastActivity >= NOTIFICATION_INTERVAL_MS;
};

// Function to send notification with better mobile support
const sendInactivityNotification = async () => {
  try {
    // Check if we have permission
    if (!self.registration || !self.registration.showNotification) {
      console.error('Service worker registration or showNotification not available');
      return false;
    }
    
    // Show notification with mobile-optimized settings
    await self.registration.showNotification('Track Your Expenses', {
      body: "It's been 24 hours! Don't forget to track your daily transactions.",
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'inactivity-reminder',
      requireInteraction: false, // Changed to false for better mobile compatibility
      silent: false,
      vibrate: [200, 100, 200], // Add vibration for mobile
      timestamp: Date.now(),
      actions: [
        {
          action: 'open-app',
          title: 'Open App',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'dismiss',
          title: 'Later'
        }
      ],
      data: {
        type: 'inactivity-reminder',
        timestamp: Date.now()
      }
    });
    
    console.log('Notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Function to start the inactivity timer with mobile-friendly approach
const startInactivityTimer = () => {
  // Clear any existing timer
  if (self.notificationTimer) {
    clearInterval(self.notificationTimer);
  }
  
  // Use a more frequent check (every 30 minutes) for better mobile compatibility
  // Mobile browsers may throttle or kill longer intervals
  self.notificationTimer = setInterval(async () => {
    try {
      console.log('Checking for inactivity notification...');
      if (await shouldSendNotification()) {
        console.log('Sending inactivity notification');
        await sendInactivityNotification();
      } else {
        console.log('No notification needed yet');
      }
    } catch (error) {
      console.error('Error in inactivity check:', error);
    }
  }, 30 * 60 * 1000); // Check every 30 minutes for better mobile compatibility
  
  // Also do an immediate check
  setTimeout(async () => {
    try {
      if (await shouldSendNotification()) {
        await sendInactivityNotification();
      }
    } catch (error) {
      console.error('Error in immediate inactivity check:', error);
    }
  }, 5000); // Check after 5 seconds
};

// Listen for messages from the main app
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'UPDATE_LAST_ACTIVITY') {
    await saveLastActivityTime(event.data.timestamp);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open-app') {
    // Open the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        // Open new window if app is not open
        return self.clients.openWindow('/');
      })
    );
  }
  // For 'dismiss' action, just close the notification (already done above)
});

// Offline fallback with secure HTML template using DOMPurify concepts
const createOfflineResponse = () => {
  const offlineHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're Offline - Driver Tracker</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          padding: 16px;
          background-color: #f9fafb;
          color: #111827;
        }
        .offline-container {
          max-width: 480px;
          text-align: center;
          padding: 32px;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .icon {
          color: #E11D48;
          font-size: 48px;
          margin-bottom: 16px;
        }
        h1 {
          margin: 0 0 16px 0;
          font-size: 24px;
        }
        p {
          margin: 0 0 24px 0;
          color: #6b7280;
          line-height: 1.5;
        }
        button {
          background-color: #E11D48;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
        }
        button:hover {
          background-color: #be123c;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="icon">⚠️</div>
        <h1>You're offline</h1>
        <p>The Driver Tracker app requires an internet connection to function properly. Please check your connection and try again.</p>
        <button onclick="window.location.reload()">Try again</button>
      </div>
      <script>
        // Safe script to detect when connection is restored
        window.addEventListener('online', () => window.location.reload());
      </script>
    </body>
    </html>
  `;
  
  return new Response(offlineHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};

// Set catch handler for navigation requests
setCatchHandler(async ({ request }) => {
  // Respond with custom offline page for navigate requests
  if (request.mode === 'navigate') {
    try {
      // Try to serve the offline.html page first
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) return offlinePage;
      
      // Fall back to generated response if offline.html is not available
      return createOfflineResponse();
    } catch (error) {
      return createOfflineResponse();
    }
  }
  
  // Return empty response for other requests
  return new Response();
});