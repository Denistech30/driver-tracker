// Firebase utility functions to handle null checks
import { db } from './firebase';
import type { Firestore } from 'firebase/firestore';

// Helper to ensure db is not null
export function getFirestore(): Firestore {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
}

// Helper to check if Firestore is available
export function isFirestoreAvailable(): boolean {
  return db !== null;
}
