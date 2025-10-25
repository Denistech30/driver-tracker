import { db, categoriesCollectionPath } from '../firebase';
import type { Category } from '../categories';
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
  Unsubscribe,
} from 'firebase/firestore';

export type { Unsubscribe };

export type CategoryInput = Omit<Category, 'id'> & { id?: string };

function mapDocToCategory(id: string, data: any): Category {
  return {
    id,
    name: data.name,
    type: data.type,
    color: data.color ?? undefined,
  };
}

export function listenAllCategories(uid: string, cb: (items: Category[]) => void): Unsubscribe {
  const q = query(collection(db, categoriesCollectionPath(uid)), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const items: Category[] = snap.docs.map((d) => mapDocToCategory(d.id, d.data()));
      cb(items);
    },
    (error) => {
      // Handle Firestore errors gracefully
      if (error.name === 'AbortError') {
        console.log('Firestore categories listener was aborted (component unmounted)');
      } else {
        console.error('Firestore categories listener error:', error);
      }
      // Call callback with empty array on error to prevent app crash
      cb([]);
    }
  );
}

export async function getAllCategories(uid: string): Promise<Category[]> {
  const q = query(collection(db, categoriesCollectionPath(uid)), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDocToCategory(d.id, d.data()));
}

export async function upsertCategory(uid: string, input: CategoryInput): Promise<string> {
  const id = input.id ?? crypto.randomUUID();
  const ref = doc(db, categoriesCollectionPath(uid), id);
  await setDoc(ref, {
    name: input.name,
    type: input.type,
    color: input.color ?? null,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });
  return id;
}

export async function updateCategoryDoc(uid: string, cat: Category): Promise<void> {
  const ref = doc(db, categoriesCollectionPath(uid), cat.id);
  await updateDoc(ref, {
    name: cat.name,
    type: cat.type,
    color: cat.color ?? null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategoryDoc(uid: string, id: string): Promise<void> {
  const ref = doc(db, categoriesCollectionPath(uid), id);
  await deleteDoc(ref);
}
