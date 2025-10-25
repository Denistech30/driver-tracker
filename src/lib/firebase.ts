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

// Initialize or reuse app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence
let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager({}),
    }),
  });
} catch {
  // Fallback to default Firestore instance if initializeFirestore already called elsewhere
  db = getFirestore(app);
}

// Initialize Auth and persist sessions in local storage
const auth: Auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Non-fatal if persistence cannot be set (private browsing, etc.)
});

// Initialize Analytics only when supported, not during SSR, and only in production
let analytics: Analytics | null = null;
(async () => {
  try {
    if (import.meta.env.MODE === 'production' && (await analyticsIsSupported())) {
      analytics = getAnalytics(app);
    }
  } catch {
    // Ignore analytics init errors (e.g., unsupported environment)
  }
})();

// Utilities to help construct user-scoped paths
export const userCollectionPath = (uid: string) => `users/${uid}`;
export const transactionsCollectionPath = (uid: string) => `${userCollectionPath(uid)}/transactions`;
export const categoriesCollectionPath = (uid: string) => `${userCollectionPath(uid)}/categories`;
export const settingsDocPath = (uid: string) => `${userCollectionPath(uid)}/settings/settings`;

export { app, auth, db };
export type { Analytics };
