import { auth } from './firebase';
import {
  getAllCategories as repoGetAll,
  upsertCategory as repoUpsert,
  updateCategoryDoc as repoUpdate,
  deleteCategoryDoc as repoDelete,
} from './repositories/categoriesRepo';
import { addToOfflineQueue, isOnline } from './offlineSync';

export interface Category {
  id: string;
  name: string;
  type: 'revenue' | 'expense';
  color?: string;
}

const STORAGE_KEY = 'categories';

const defaultCategories: Category[] = [
  { id: '1', name: 'Delivery', type: 'revenue', color: '#4f46e5' },
  { id: '2', name: 'Tips', type: 'revenue', color: '#10b981' },
  { id: '3', name: 'Other', type: 'revenue', color: '#6366f1' },
  { id: '4', name: 'Fuel', type: 'expense', color: '#ef4444' },
  { id: '5', name: 'Maintenance', type: 'expense', color: '#f97316' },
  { id: '6', name: 'Tolls', type: 'expense', color: '#ec4899' },
  { id: '7', name: 'Insurance', type: 'expense', color: '#8b5cf6' },
  { id: '8', name: 'Other', type: 'expense', color: '#6b7280' },
];

export function getCategories(): Category[] {
  try {
    const uid = auth?.currentUser?.uid;
    // Note: synchronous API; return cache/localStorage immediately.
    // Firestore async fetching should be done by callers if needed.
    const saved = localStorage.getItem(STORAGE_KEY);
    const local = saved ? JSON.parse(saved) : defaultCategories;
    // If signed in, we will not block here; recommend using repo/listener for live data.
    return local;
  } catch (error) {
    console.error('Failed to get categories:', error);
    return defaultCategories;
  }
}

export function addCategory(name: string, type: 'revenue' | 'expense', color: string = '#6b7280'): void {
  try {
    const uid = auth?.currentUser?.uid;
    const id = crypto.randomUUID();
    const newCategory: Category = { id, name, type, color };
    
    // Always save to localStorage first (for offline support)
    const categories = getCategories();
    categories.push(newCategory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    
    if (uid && isOnline() && auth && repoUpsert) {
      // Save to Firestore if online and authenticated
      void repoUpsert(uid, newCategory);
    } else if (uid) {
      // Queue for offline sync if authenticated but offline
      addToOfflineQueue({
        type: 'category',
        operation: 'create',
        data: newCategory
      });
    }
  } catch (error) {
    console.error('Failed to add category:', error);
  }
}

export function updateCategory(id: string, name: string, type: 'revenue' | 'expense', color?: string): void {
  try {
    const uid = auth?.currentUser?.uid;
    if (uid) {
      void repoUpdate(uid, { id, name, type, color: color ?? undefined });
    } else {
      const categories = getCategories();
      const index = categories.findIndex((c) => c.id === id);
      if (index !== -1) {
        const existingColor = categories[index].color || '#6b7280';
        categories[index] = { id, name, type, color: color || existingColor };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
      }
    }
  } catch (error) {
    console.error('Failed to update category:', error);
  }
}

export function deleteCategory(id: string): void {
  try {
    const uid = auth?.currentUser?.uid;
    if (uid) {
      void repoDelete(uid, id);
    } else {
      const categories = getCategories();
      const updated = categories.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Failed to delete category:', error);
  }
}