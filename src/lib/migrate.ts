import { upsertTransaction } from './repositories/transactionsRepo';
import { upsertCategory } from './repositories/categoriesRepo';
import { getSettings as getSettingsDoc, setSettings, updateSettings, type SettingsDoc } from './repositories/settingsRepo';
import type { Transaction } from './storage';
import type { Category } from './categories';

const flagKey = (uid: string) => `migratedToFirestore-${uid}`;

export async function runLocalToFirestoreMigration(uid: string): Promise<boolean> {
  try {
    if (localStorage.getItem(flagKey(uid))) return false;

    const txRaw = localStorage.getItem('transactions');
    const catRaw = localStorage.getItem('categories');
    const settingsRaw = localStorage.getItem('settings');

    const txs: Transaction[] = txRaw ? JSON.parse(txRaw) : [];
    const cats: Category[] = catRaw ? JSON.parse(catRaw) : [];
    const legacySettings = settingsRaw ? JSON.parse(settingsRaw) : null;

    for (const t of txs) {
      await upsertTransaction(uid, { ...t });
    }

    for (const c of cats) {
      await upsertCategory(uid, { ...c });
    }

    const existing = (await getSettingsDoc(uid)) || undefined;
    const budgetMonthly: Record<string, number> = { ...(existing?.budgetMonthly || {}) };
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (key.startsWith('budget-')) {
        const val = Number(localStorage.getItem(key) || '0');
        const ym = key.replace('budget-', '');
        if (!Number.isNaN(val)) budgetMonthly[ym] = val;
      }
    }

    const settingsPatch: Partial<SettingsDoc> = {};
    if (legacySettings) {
      settingsPatch.language = legacySettings.language ?? existing?.language ?? 'en-US';
      settingsPatch.currency = legacySettings.currency ?? existing?.currency ?? 'USD';
      settingsPatch.theme = legacySettings.theme ?? existing?.theme ?? 'light';
      settingsPatch.availableQuestions = Array.isArray(legacySettings.availableQuestions)
        ? legacySettings.availableQuestions
        : existing?.availableQuestions ?? [];
    }
    settingsPatch.budgetMonthly = budgetMonthly;

    if (existing) {
      await updateSettings(uid, settingsPatch);
    } else {
      await setSettings(uid, {
        language: settingsPatch.language || 'en-US',
        currency: settingsPatch.currency || 'USD',
        theme: (settingsPatch.theme as any) || 'light',
        availableQuestions: settingsPatch.availableQuestions || [],
        budgetMonthly,
      });
    }

    localStorage.setItem(flagKey(uid), String(Date.now()));
    return true;
  } catch {
    return false;
  }
}
