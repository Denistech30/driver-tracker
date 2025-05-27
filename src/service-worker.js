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
  // Precache the offline page
  event.waitUntil(
    caches.open('offline-fallback').then((cache) => {
      return cache.addAll([
        '/', // Homepage
        '/offline.html' // Dedicated offline page (you'll need to create this)
      ]);
    })
  );
  
  self.skipWaiting();
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
    })
  );
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