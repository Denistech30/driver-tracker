import { db, settingsDocPath } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export type Theme = 'light' | 'dark';

export interface SettingsDoc {
  language: string;
  currency: string;
  theme: Theme;
  availableQuestions: string[];
  // Optional legacy field; we will prefer budgetMonthly map
  budget?: number;
  budgetMonthly?: Record<string, number>; // { 'YYYY-MM': number }
  updatedAt?: any;
  createdAt?: any;
}

export async function getSettings(uid: string): Promise<SettingsDoc | null> {
  const ref = doc(db, settingsDocPath(uid));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as SettingsDoc;
  // Ensure defaults for missing fields
  return {
    language: data.language ?? 'en-US',
    currency: data.currency ?? 'USD',
    theme: (data.theme as Theme) ?? 'light',
    availableQuestions: Array.isArray(data.availableQuestions) ? data.availableQuestions : [],
    budget: typeof data.budget === 'number' ? data.budget : undefined,
    budgetMonthly: data.budgetMonthly ?? {},
    updatedAt: data.updatedAt,
    createdAt: data.createdAt,
  };
}

export async function setSettings(uid: string, settings: SettingsDoc): Promise<void> {
  const ref = doc(db, settingsDocPath(uid));
  await setDoc(ref, {
    ...settings,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });
}

export async function updateSettings(uid: string, patch: Partial<SettingsDoc>): Promise<void> {
  const ref = doc(db, settingsDocPath(uid));
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  } as any);
}

export async function setMonthlyBudget(uid: string, yearMonth: string, amount: number): Promise<void> {
  const ref = doc(db, settingsDocPath(uid));
  await setDoc(ref, {
    budgetMonthly: { [yearMonth]: amount },
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });
}

export async function getMonthlyBudget(uid: string, yearMonth: string): Promise<number> {
  const ref = doc(db, settingsDocPath(uid));
  const snap = await getDoc(ref);
  const data = (snap.exists() ? (snap.data() as SettingsDoc) : null);
  return data?.budgetMonthly?.[yearMonth] ?? 0;
}
