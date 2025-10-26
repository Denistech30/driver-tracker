import { db, transactionsCollectionPath } from '../firebase';
import type { Transaction } from '../storage';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';

export type { Unsubscribe };

export type TransactionInput = Omit<Transaction, 'id'> & { id?: string };

// Map Firestore doc to Transaction
function mapDocToTransaction(id: string, data: any): Transaction {
  return {
    id,
    type: data.type,
    amount: Number(data.amount) || 0,
    category: data.category,
    date: typeof data.date === 'string' ? data.date : (data.date?.toDate?.()?.toISOString?.() ?? ''),
    description: data.description ?? undefined,
  };
}

export function listenAllTransactions(uid: string, cb: (txs: Transaction[]) => void): Unsubscribe {
  if (!db) {
    console.warn('Firestore not available, returning empty unsubscribe');
    return () => {};
  }
  const q = query(collection(db, transactionsCollectionPath(uid)), orderBy('date', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const items: Transaction[] = snap.docs.map((d) => mapDocToTransaction(d.id, d.data()))
      cb(items);
    },
    (error) => {
      // Handle Firestore errors gracefully
      if (error.name === 'AbortError') {
        console.log('Firestore listener was aborted (component unmounted)');
      } else {
        console.error('Firestore listener error:', error);
      }
      // Call callback with empty array on error to prevent app crash
      cb([]);
    }
  );
}

export async function getAllTransactions(uid: string): Promise<Transaction[]> {
  if (!db) {
    console.warn('Firestore not available, returning empty array');
    return [];
  }
  const q = query(collection(db, transactionsCollectionPath(uid)), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDocToTransaction(d.id, d.data()));
}

export async function getTransaction(uid: string, id: string): Promise<Transaction | null> {
  if (!db) {
    console.warn('Firestore not available, returning null');
    return null;
  }
  const ref = doc(db, transactionsCollectionPath(uid), id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapDocToTransaction(snap.id, snap.data());
}

export async function upsertTransaction(uid: string, tx: TransactionInput): Promise<string> {
  const id = tx.id ?? crypto.randomUUID();
  if (!db) {
    console.warn('Firestore not available, skipping upsert');
    return id;
  }
  const ref = doc(db, transactionsCollectionPath(uid), id);
  await setDoc(ref, {
    type: tx.type,
    amount: tx.amount,
    category: tx.category,
    date: tx.date, // store as ISO string for compatibility
    description: tx.description ?? null,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });
  return id;
}

export async function updateTransactionDoc(uid: string, tx: Transaction): Promise<void> {
  if (!db) {
    console.warn('Firestore not available, skipping update');
    return;
  }
  const ref = doc(db, transactionsCollectionPath(uid), tx.id);
  await updateDoc(ref, {
    type: tx.type,
    amount: tx.amount,
    category: tx.category,
    date: tx.date,
    description: tx.description ?? null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTransaction(uid: string, id: string): Promise<void> {
  if (!db) {
    console.warn('Firestore not available, skipping delete');
    return;
  }
  const ref = doc(db, transactionsCollectionPath(uid), id);
  await deleteDoc(ref);
}
