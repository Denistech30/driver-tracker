// Offline Sync Manager
import { Transaction } from './storage';
import { Category } from './categories';
import { auth, db } from './firebase';
import { 
  upsertTransaction as repoUpsertTransaction,
  deleteTransaction as repoDeleteTransaction 
} from './repositories/transactionsRepo';
import { 
  upsertCategory as repoUpsertCategory,
  deleteCategoryDoc as repoDeleteCategory 
} from './repositories/categoriesRepo';
import { 
  setSettings as repoUpsertSettings 
} from './repositories/settingsRepo';

// Types for offline operations
export interface OfflineOperation {
  id: string;
  type: 'transaction' | 'category' | 'settings';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount?: number;
}

const OFFLINE_QUEUE_KEY = 'offline-sync-queue';
const LAST_SYNC_KEY = 'last-sync-timestamp';

// Queue management
export function addToOfflineQueue(operation: Omit<OfflineOperation, 'id' | 'timestamp'>) {
  const queue = getOfflineQueue();
  const newOperation: OfflineOperation = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    ...operation
  };
  
  queue.push(newOperation);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  
  console.log('Added to offline queue:', newOperation);
}

export function getOfflineQueue(): OfflineOperation[] {
  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Failed to get offline queue:', error);
    return [];
  }
}

export function clearOfflineQueue() {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  console.log('Offline queue cleared');
}

export function removeFromQueue(operationId: string) {
  const queue = getOfflineQueue();
  const filteredQueue = queue.filter(op => op.id !== operationId);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filteredQueue));
}

export function updateOperationInQueue(operationId: string, updatedOperation: OfflineOperation) {
  const queue = getOfflineQueue();
  const updatedQueue = queue.map(op => op.id === operationId ? updatedOperation : op);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
}

// Network status detection
export function isOnline(): boolean {
  return navigator.onLine;
}

// Sync operations
export async function syncOfflineOperations(): Promise<void> {
  if (!isOnline() || !auth?.currentUser || !db) {
    console.log('Cannot sync: offline, no auth, or no Firebase');
    return;
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    console.log('No offline operations to sync');
    return;
  }

  console.log(`Syncing ${queue.length} offline operations...`);
  
  const uid = auth.currentUser.uid;
  let successCount = 0;
  let errorCount = 0;

  // Sort by timestamp to maintain order
  const sortedQueue = queue.sort((a, b) => a.timestamp - b.timestamp);

  for (const operation of sortedQueue) {
    try {
      await processOfflineOperation(uid, operation);
      removeFromQueue(operation.id);
      successCount++;
      console.log('Synced operation:', operation.id);
    } catch (error) {
      console.error('Failed to sync operation:', operation.id, error);
      errorCount++;
      
      // Increment retry count for failed operations
      const updatedOperation = { ...operation, retryCount: (operation.retryCount || 0) + 1 };
      
      // Remove operations that have failed too many times (5 retries) or are too old (7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const maxRetries = 5;
      
      if (operation.timestamp < sevenDaysAgo || updatedOperation.retryCount >= maxRetries) {
        removeFromQueue(operation.id);
        console.log(`Removed failed operation: ${operation.id} (${updatedOperation.retryCount >= maxRetries ? 'max retries' : 'too old'})`);
        
        // Show user notification for permanently failed operations
        showSyncErrorNotification(operation, updatedOperation.retryCount >= maxRetries ? 'max_retries' : 'expired');
      } else {
        // Update the operation with retry count
        updateOperationInQueue(operation.id, updatedOperation);
      }
    }
  }

  // Update last sync timestamp
  localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  
  console.log(`Sync completed: ${successCount} success, ${errorCount} errors`);
  
  // Show user notification if there were operations synced
  if (successCount > 0) {
    showSyncNotification(successCount);
  }
}

async function processOfflineOperation(uid: string, operation: OfflineOperation): Promise<void> {
  switch (operation.type) {
    case 'transaction':
      await processTransactionOperation(uid, operation);
      break;
    case 'category':
      await processCategoryOperation(uid, operation);
      break;
    case 'settings':
      await processSettingsOperation(uid, operation);
      break;
    default:
      throw new Error(`Unknown operation type: ${operation.type}`);
  }
}

async function processTransactionOperation(uid: string, operation: OfflineOperation): Promise<void> {
  switch (operation.operation) {
    case 'create':
    case 'update':
      await repoUpsertTransaction(uid, operation.data);
      break;
    case 'delete':
      await repoDeleteTransaction(uid, operation.data.id);
      break;
  }
}

async function processCategoryOperation(uid: string, operation: OfflineOperation): Promise<void> {
  switch (operation.operation) {
    case 'create':
    case 'update':
      await repoUpsertCategory(uid, operation.data);
      break;
    case 'delete':
      await repoDeleteCategory(uid, operation.data.id);
      break;
  }
}

async function processSettingsOperation(uid: string, operation: OfflineOperation): Promise<void> {
  switch (operation.operation) {
    case 'create':
    case 'update':
      await repoUpsertSettings(uid, operation.data);
      break;
    // Settings typically don't get deleted
  }
}

// Auto-sync setup
export function setupAutoSync() {
  // Sync when coming back online
  window.addEventListener('online', () => {
    console.log('Connection restored, syncing...');
    setTimeout(syncOfflineOperations, 1000); // Small delay to ensure connection is stable
  });

  // Sync when app becomes visible (user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isOnline()) {
      syncOfflineOperations();
    }
  });

  // Periodic sync (every 5 minutes when online)
  setInterval(() => {
    if (isOnline()) {
      syncOfflineOperations();
    }
  }, 5 * 60 * 1000);

  // Initial sync
  if (isOnline()) {
    setTimeout(syncOfflineOperations, 2000); // Wait for app to initialize
  }
}

// User notification for successful sync
function showSyncNotification(count: number) {
  // Create a simple toast notification
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
  toast.textContent = `✓ Synced ${count} item${count > 1 ? 's' : ''} to cloud`;
  
  document.body.appendChild(toast);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// User notification for sync errors
function showSyncErrorNotification(operation: OfflineOperation, reason: 'max_retries' | 'expired') {
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300 max-w-sm';
  
  const reasonText = reason === 'max_retries' 
    ? 'Failed to sync after multiple attempts' 
    : 'Sync operation expired';
  
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <span>⚠️</span>
      <div>
        <div class="font-semibold">Sync Failed</div>
        <div class="text-sm opacity-90">${reasonText}: ${operation.type} ${operation.operation}</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Auto-remove after 5 seconds (longer for error messages)
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 5000);
}

// Get sync status
export function getSyncStatus() {
  const queue = getOfflineQueue();
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
  
  return {
    pendingOperations: queue.length,
    lastSync: lastSync ? new Date(parseInt(lastSync)) : null,
    isOnline: isOnline()
  };
}

// Force sync (for manual sync button)
export async function forcSync(): Promise<boolean> {
  try {
    await syncOfflineOperations();
    return true;
  } catch (error) {
    console.error('Force sync failed:', error);
    return false;
  }
}
