import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { registerSW } from 'virtual:pwa-register';
import { Workbox } from 'workbox-window';
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

// Register service worker for notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(err => {
        console.error('ServiceWorker registration failed: ', err);
      });
  });
}

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
  },
  onRegisterError(error) {
    console.error('Service worker registration failed:', error);
  }
});

// Advanced service worker error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const wb = new Workbox('/service-worker.js');
    
    // Track service worker state changes
    wb.addEventListener('activated', (event) => {
      // Check if there's a service worker update available
      if (event.isUpdate) {
        console.log('Service worker updated to latest version');
      }
    });
    
    // Handle service worker update found event
    wb.addEventListener('waiting', (event) => {
      console.log('New service worker is waiting to activate');
      // This could trigger a custom UI notification
    });
    
    // Handle service worker installation failure
    wb.addEventListener('redundant', (event) => {
      console.error('Service worker became redundant');
      // Show a warning to the user that offline functionality might be compromised
    });
    
    // Listen for unhandled exceptions in service worker
    wb.addEventListener('message', (event) => {
      if (event.data?.type === 'ERROR') {
        console.error('Service worker error:', event.data.error);
      }
    });
  });
}