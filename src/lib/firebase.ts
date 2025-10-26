import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getAnalytics, isSupported as analyticsIsSupported, type Analytics } from 'firebase/analytics';

// Check if Firebase environment variables are configured
const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

// Read config from Vite env to avoid hardcoding
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || undefined,
};

// Initialize or reuse app only if Firebase is configured
let app: any = null;
if (isFirebaseConfigured) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
}

// Initialize Firestore with offline persistence (only if Firebase is configured)
let db: Firestore | null = null;
if (app && isFirebaseConfigured) {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({}),
      }),
    });
  } catch {
    // Fallback to default Firestore instance if initializeFirestore already called elsewhere
    try {
      db = getFirestore(app);
    } catch (error) {
      console.warn('Firestore initialization failed:', error);
    }
  }
}

// Initialize Auth and persist sessions in local storage (only if Firebase is configured)
let auth: Auth | null = null;
if (app && isFirebaseConfigured) {
  try {
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(() => {
      // Non-fatal if persistence cannot be set (private browsing, etc.)
    });
  } catch (error) {
    console.warn('Auth initialization failed:', error);
  }
}

// Initialize Analytics only when supported, not during SSR, and only in production
let analytics: Analytics | null = null;
if (app && isFirebaseConfigured) {
  (async () => {
    try {
      if (import.meta.env.MODE === 'production' && (await analyticsIsSupported())) {
        analytics = getAnalytics(app);
      }
    } catch {
      // Ignore analytics init errors (e.g., unsupported environment)
    }
  })();
}

// Utilities to help construct user-scoped paths
export const userCollectionPath = (uid: string) => `users/${uid}`;
export const transactionsCollectionPath = (uid: string) => `${userCollectionPath(uid)}/transactions`;
export const categoriesCollectionPath = (uid: string) => `${userCollectionPath(uid)}/categories`;
export const settingsDocPath = (uid: string) => `${userCollectionPath(uid)}/settings/settings`;

export { app, auth, db };
export type { Analytics };
