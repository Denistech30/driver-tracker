import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { registerSW } from 'virtual:pwa-register';
import { updateLastActivityTime } from './lib/notificationService';
import './index.css';

// Initialize last activity time on app start
updateLastActivityTime();

// Track user activity
const handleUserActivity = () => {
  updateLastActivityTime();};

// Add event listeners for user activity
['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
  window.addEventListener(event, handleUserActivity, { passive: true });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  </React.StrictMode>
);

// One-time cleanup: unregister legacy custom service worker and delete its caches
async function cleanupLegacyServiceWorkers() {
  try {
    // Only run once per browser profile
    if (localStorage.getItem('swCleanupDone') === 'true') {
      return;
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        const script = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '';
        // Unregister any legacy SW named /sw.js to avoid conflicts
        if (script.endsWith('/sw.js')) {
          await reg.unregister();
          console.log('Unregistered legacy service worker:', script);
        }
      }
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        // Remove caches created by the legacy SW and stale workbox caches
        if (
          key.startsWith('xpense-tracker-') ||
          key === 'activity-cache' ||
          key === 'google-fonts-cache' ||
          key === 'images-cache' ||
          key === 'api-cache'
        ) {
          await caches.delete(key);
          console.log('Deleted legacy/stale cache:', key);
        }
      }
    }
    localStorage.setItem('swCleanupDone', 'true');
  } catch (e) {
    console.warn('Legacy SW cleanup skipped due to error:', e);
  }
}

// Run cleanup before registering the new PWA service worker
cleanupLegacyServiceWorkers();

// Register service worker for PWA functionality
const updateSW = registerSW({
  // Called when a new service worker has been installed and waiting to activate
  onNeedRefresh() {
    if (confirm('New version available! Update now for improved features and security?')) {
      updateSW(true);
    }
  },
  // Called when the service worker is ready to handle offline requests
  onOfflineReady() {
    console.log('Driver Tracker is ready for offline use');
    // Could display a toast notification here
    const offlineReadyToast = document.createElement('div');
    offlineReadyToast.className = 'offline-toast';
    offlineReadyToast.innerHTML = `
      <div class="offline-toast-content">
        <span>✅ Ready for offline use</span>
        <button>Dismiss</button>
      </div>
    `;
    
    document.body.appendChild(offlineReadyToast);
    
    // Add basic styles
    const style = document.createElement('style');
    style.textContent = `
      .offline-toast {
        position: fixed;
        bottom: 16px;
        right: 16px;
        background: #16a34a;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
      }
      .offline-toast-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .offline-toast button {
        background: transparent;
        border: 1px solid white;
        color: white;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
      }
      @keyframes slideIn {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    // Dismiss toast after 4 seconds or when button is clicked
    const dismissToast = () => {
      offlineReadyToast.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        document.body.removeChild(offlineReadyToast);
      }, 300);
    };
    
    setTimeout(dismissToast, 4000);
    offlineReadyToast.querySelector('button')?.addEventListener('click', dismissToast);
  },
  onRegistered(registration: ServiceWorkerRegistration | undefined) {
    console.log('Service Worker registered successfully');
    // Verify only one service worker registration remains post-load
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        if (regs.length > 1) {
          console.warn('Multiple service worker registrations found. Attempting to unregister extras...');
          regs.forEach(reg => {
            if (reg !== registration) {
              reg.unregister();
            }
          });
        }
      });
    }
  },
  onRegisterError(error) {
    console.error('Service worker registration failed:', error);
  }
});

// Resilience: auto-recover once if a stale cached entry causes chunk load failure
function setupChunkLoadRecovery() {
  const reloadOnceKey = 'chunkLoadRecoveryReloaded';
  const tryRecover = () => {
    if (localStorage.getItem(reloadOnceKey) === 'true') return;
    localStorage.setItem(reloadOnceKey, 'true');
    // Prefer updating SW to refresh cache, fallback to hard reload
    try {
      updateSW(true);
      // Give a tiny delay to let SW take control, then reload
      setTimeout(() => window.location.reload(), 250);
    } catch {
      window.location.reload();
    }
  };

  window.addEventListener('error', (e: ErrorEvent) => {
    const msg = String(e?.error?.message || e.message || '');
    if (msg.includes('ChunkLoadError') || msg.includes('Loading chunk') || msg.includes('Importing a module script failed')) {
      console.warn('Detected chunk load error, attempting recovery...');
      tryRecover();
    }
  });

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const msg = String((e?.reason && (e.reason.message || e.reason.toString())) || '');
    if (msg.includes('ChunkLoadError') || msg.includes('Loading chunk') || msg.includes('Importing a module script failed')) {
      console.warn('Detected chunk load error (promise), attempting recovery...');
      tryRecover();
    }
  });

  // Reset the guard flag after a successful load and some idle time
  window.addEventListener('load', () => {
    setTimeout(() => localStorage.removeItem(reloadOnceKey), 30000);
  });
}

setupChunkLoadRecovery();