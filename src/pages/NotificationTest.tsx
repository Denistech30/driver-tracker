import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  requestNotificationPermission, 
  testNotification, 
  updateLastActivityTime,
  getLastActivityTime,
  shouldShowNotification
} from '../lib/notificationService';

export default function NotificationTest() {
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [lastActivity, setLastActivity] = useState<string>('');
  const [shouldNotify, setShouldNotify] = useState<boolean>(false);

  const checkPermission = () => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('not supported');
    }
  };

  const requestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
  };

  const sendTestNotification = async () => {
    const success = await testNotification();
    console.log('Test notification result:', success);
  };

  const checkLastActivity = () => {
    const timestamp = getLastActivityTime();
    setLastActivity(new Date(timestamp).toLocaleString());
    setShouldNotify(shouldShowNotification());
  };

  const updateActivity = () => {
    updateLastActivityTime();
    checkLastActivity();
  };

  const simulateInactivity = () => {
    // Set last activity to 25 hours ago for testing
    const timestamp = Date.now() - (25 * 60 * 60 * 1000);
    localStorage.setItem('lastActivityTime', timestamp.toString());
    checkLastActivity();
  };

  React.useEffect(() => {
    checkPermission();
    checkLastActivity();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Notification System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Permission Status</h3>
            <p>Current status: <span className="font-mono">{permissionStatus}</span></p>
            <Button onClick={requestPermission} className="mt-2">
              Request Permission
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Test Notification</h3>
            <Button onClick={sendTestNotification} disabled={permissionStatus !== 'granted'}>
              Send Test Notification
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Activity Tracking</h3>
            <p>Last activity: <span className="font-mono">{lastActivity}</span></p>
            <p>Should notify: <span className="font-mono">{shouldNotify ? 'YES' : 'NO'}</span></p>
            <div className="space-x-2 mt-2">
              <Button onClick={updateActivity}>Update Activity</Button>
              <Button onClick={checkLastActivity}>Check Status</Button>
              <Button onClick={simulateInactivity} variant="outline">
                Simulate 25h Inactivity
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Service Worker Status</h3>
            <Button onClick={() => {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                  console.log('Service worker registration:', registration);
                  alert('Service worker is ready. Check console for details.');
                });
              } else {
                alert('Service worker not supported');
              }
            }}>
              Check Service Worker
            </Button>
          </div>

          <div className="bg-yellow-50 p-4 rounded">
            <h4 className="font-semibold text-yellow-800">Instructions for Testing:</h4>
            <ol className="list-decimal list-inside text-sm text-yellow-700 mt-2 space-y-1">
              <li>First, click "Request Permission" and allow notifications</li>
              <li>Click "Send Test Notification" to verify notifications work</li>
              <li>Click "Simulate 25h Inactivity" to test the 24-hour logic</li>
              <li>Check console logs for detailed debugging information</li>
              <li>For mobile testing, install the PWA and close the browser completely</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
