// Service Worker for background tasks and notifications
const CACHE_NAME = 'xpense-tracker-v1';
const NOTIFICATION_TITLE = 'Track Your Expenses';
const NOTIFICATION_OPTIONS = {
  body: "It's been a while! Don't forget to track your transactions.",
  icon: '/icons/icon-192x192.png',
  badge: '/icons/icon-192x192.png',
};

// Install event - cache important files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
      ]);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_LAST_ACTIVITY') {
    // Update last activity time in IndexedDB
    const timestamp = event.data.timestamp || Date.now();
    updateLastActivityTimeInSW(timestamp);
  }
});

// Check for inactivity and show notification if needed
const checkInactivityAndNotify = async () => {
  const lastActivityTime = await getLastActivityTimeFromSW();
  const now = Date.now();
  
  if (now - lastActivityTime >= 24 * 60 * 60 * 1000) { // 24 hours
    self.registration.showNotification(NOTIFICATION_TITLE, NOTIFICATION_OPTIONS);
  }
};

// Get last activity time from IndexedDB or fallback to current time
const getLastActivityTimeFromSW = async () => {
  try {
    const cache = await caches.open('activity-cache');
    const response = await cache.match('last-activity');
    if (response) {
      const data = await response.json();
      return data.timestamp;
    }
  } catch (error) {
    console.error('Error reading from cache:', error);
  }
  return Date.now();
};

// Update last activity time in IndexedDB
const updateLastActivityTimeInSW = async (timestamp) => {
  try {
    const cache = await caches.open('activity-cache');
    await cache.put(
      'last-activity',
      new Response(JSON.stringify({ timestamp }), {
        headers: { 'Content-Type': 'application/json' },
      })
    );
  } catch (error) {
    console.error('Error updating activity time:', error);
  }
};

// Check for inactivity every hour
setInterval(checkInactivityAndNotify, 60 * 60 * 1000);

// Initial check
checkInactivityAndNotify();
