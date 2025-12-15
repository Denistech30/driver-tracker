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

// Helper function to get localStorage categories (for offline support)
function getLocalStorageCategories(): Category[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultCategories;
  } catch (error) {
    console.error('Failed to get categories from localStorage:', error);
    return defaultCategories;
  }
}

// Helper function to save to localStorage (for offline support)
function saveCategoriesToLocalStorage(categories: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Failed to save categories to localStorage:', error);
  }
}

export function getCategories(): Category[] {
  try {
    const uid = auth?.currentUser?.uid;
    
    // For authenticated users, use localStorage for offline support
    // (Real categories should come from useCategories hook with Firestore listener)
    if (uid) {
      return getLocalStorageCategories();
    }
    
    // For non-authenticated users, use localStorage
    return getLocalStorageCategories();
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
    const categories = getLocalStorageCategories();
    categories.push(newCategory);
    saveCategoriesToLocalStorage(categories);
    
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
    
    // Always update localStorage first (for offline support)
    const categories = getLocalStorageCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index !== -1) {
      const existingColor = categories[index].color || '#6b7280';
      categories[index] = { id, name, type, color: color || existingColor };
      saveCategoriesToLocalStorage(categories);
    }
    
    if (uid && isOnline() && auth && repoUpdate) {
      // Update in Firestore if online and authenticated
      void repoUpdate(uid, { id, name, type, color: color ?? undefined });
    } else if (uid) {
      // Queue for offline sync if authenticated but offline
      addToOfflineQueue({
        type: 'category',
        operation: 'update',
        data: { id, name, type, color: color ?? undefined }
      });
    }
  } catch (error) {
    console.error('Failed to update category:', error);
  }
}

export function deleteCategory(id: string): void {
  try {
    const uid = auth?.currentUser?.uid;
    
    // Always delete from localStorage first (for offline support)
    const categories = getLocalStorageCategories();
    const updated = categories.filter((c) => c.id !== id);
    saveCategoriesToLocalStorage(updated);
    
    if (uid && isOnline() && auth && repoDelete) {
      // Delete from Firestore if online and authenticated
      void repoDelete(uid, id);
    } else if (uid) {
      // Queue for offline sync if authenticated but offline
      addToOfflineQueue({
        type: 'category',
        operation: 'delete',
        data: { id }
      });
    }
  } catch (error) {
    console.error('Failed to delete category:', error);
  }
}