import React from 'react';

export default function Debug() {
  const envVars = {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
    VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Firebase Environment Variables Debug</h1>
      
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Environment Variables Status:</h2>
        
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="mb-2 p-2 bg-white dark:bg-gray-700 rounded">
            <div className="font-mono text-sm">
              <span className="font-bold">{key}:</span>{' '}
              <span className={value ? 'text-green-600' : 'text-red-600'}>
                {value ? '✅ SET' : '❌ NOT SET'}
              </span>
              {value && (
                <div className="text-xs text-gray-600 mt-1">
                  Value: {key.includes('API_KEY') ? `${value.substring(0, 10)}...` : value}
                </div>
              )}
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900 rounded">
          <h3 className="font-semibold">Firebase Configuration Status:</h3>
          <p className="text-sm">
            {envVars.VITE_FIREBASE_API_KEY && envVars.VITE_FIREBASE_AUTH_DOMAIN && envVars.VITE_FIREBASE_PROJECT_ID
              ? '✅ Firebase should be configured correctly'
              : '❌ Firebase configuration is incomplete'}
          </p>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Note:</strong> This debug page should be removed before production deployment.</p>
        <p>If variables show as "NOT SET", they weren't loaded from Netlify environment variables.</p>
      </div>
    </div>
  );
}
