import { useSettings } from '../contexts/SettingsContext';
import { getTranslation, TranslationKey } from '../lib/translations';

export function useTranslation() {
  const { settings } = useSettings();
  
  // Function to translate a key
  const t = (key: TranslationKey): string => {
    return getTranslation(settings.language, key);
  };
  
  return { t };
}
