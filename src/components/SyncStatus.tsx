import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { getSyncStatus, forcSync, isOnline } from '../lib/offlineSync';
import { Button } from './ui/button';

export default function SyncStatus() {
  const [syncStatus, setSyncStatus] = useState({
    pendingOperations: 0,
    lastSync: null as Date | null,
    isOnline: navigator.onLine
  });
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const updateStatus = () => {
    setSyncStatus(getSyncStatus());
  };

  useEffect(() => {
    // Update status initially and every 30 seconds
    updateStatus();
    const interval = setInterval(updateStatus, 30000);

    // Listen for online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline() || isManualSyncing) return;
    
    setIsManualSyncing(true);
    try {
      await forcSync();
      updateStatus();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'text-red-500';
    if (syncStatus.pendingOperations > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.pendingOperations > 0) return `${syncStatus.pendingOperations} pending`;
    return 'Synced';
  };

  const getIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    if (syncStatus.pendingOperations > 0) {
      return <CloudOff className="h-4 w-4" />;
    }
    return <Cloud className="h-4 w-4" />;
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {getIcon()}
        <span className="hidden sm:inline">{getStatusText()}</span>
      </div>
      
      {syncStatus.isOnline && syncStatus.pendingOperations > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualSync}
          disabled={isManualSyncing}
          className="h-6 px-2 text-xs"
        >
          {isManualSyncing ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            'Sync'
          )}
        </Button>
      )}
      
      {syncStatus.lastSync && (
        <span className="text-xs text-gray-500 hidden md:inline">
          Last: {syncStatus.lastSync.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
