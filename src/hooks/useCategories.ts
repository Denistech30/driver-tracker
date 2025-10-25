import { useEffect, useState } from 'react';
import type { Category } from '../lib/categories';
import { useFirebaseUser } from './useFirebaseUser';
import { listenAllCategories, type Unsubscribe } from '../lib/repositories/categoriesRepo';
import { getCategories as getLocalCategories } from '../lib/categories';

export function useCategories(): { categories: Category[]; loading: boolean } {
  const { user } = useFirebaseUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsub: Unsubscribe | null = null;
    setLoading(true);

    if (user?.uid) {
      unsub = listenAllCategories(user.uid, (items) => {
        setCategories(items);
        setLoading(false);
      });
    } else {
      // Fallback to local storage/defaults when not signed in
      setCategories(getLocalCategories());
      setLoading(false);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [user?.uid]);

  return { categories, loading };
}
