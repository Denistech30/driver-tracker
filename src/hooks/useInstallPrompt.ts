import { useEffect, useMemo, useRef, useState } from 'react';

// Types for the beforeinstallprompt event (not in standard TS DOM lib)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string } | undefined>;
  prompt: () => Promise<void>;
}

const DISMISS_UNTIL_KEY = 'installPromptDismissUntil';
const DISMISS_UNTIL_IOS_KEY = 'installPromptIOSDismissUntil';

function isStandaloneDisplay(): boolean {
  try {
    // PWA installed display-mode detection
    // @ts-ignore
    const navStandalone = typeof navigator !== 'undefined' && !!(navigator as any).standalone;
    const mqStandalone = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    return !!(navStandalone || mqStandalone);
  } catch {
    return false;
  }
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /iphone|ipad|ipod/i.test(ua);
}

function isDismissed(key: string): boolean {
  try {
    const until = localStorage.getItem(key);
    if (!until) return false;
    const ts = parseInt(until, 10);
    return Number.isFinite(ts) && Date.now() < ts;
  } catch {
    return false;
  }
}

function setDismissDays(key: string, days: number) {
  try {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(key, String(until));
  } catch {
    // ignore
  }
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(isStandaloneDisplay());
  const [isIOSDevice, setIsIOSDevice] = useState<boolean>(isIOS());

  const dismissed = useMemo(() => isDismissed(DISMISS_UNTIL_KEY), []);
  const dismissedIOS = useMemo(() => isDismissed(DISMISS_UNTIL_IOS_KEY), []);

  const canInstall = !!deferredPrompt && !installed && !isIOSDevice && !dismissed;
  const showIOSHelp = isIOSDevice && !installed && !dismissedIOS;

  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  promptRef.current = deferredPrompt;

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
    window.addEventListener('appinstalled', onInstalled);

    // Update flags on visibility changes (helps reflect installation status quickly)
    const onVisibility = () => {
      setInstalled(isStandaloneDisplay());
      setIsIOSDevice(isIOS());
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    const evt = promptRef.current;
    if (!evt) return 'unavailable';
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      setDeferredPrompt(null); // can only prompt once
      return choice?.outcome ?? 'dismissed';
    } catch {
      return 'dismissed';
    }
  }

  function dismiss(days = 7) {
    setDismissDays(DISMISS_UNTIL_KEY, days);
  }

  function dismissIOS(days = 7) {
    setDismissDays(DISMISS_UNTIL_IOS_KEY, days);
  }

  return {
    canInstall,
    promptInstall,
    dismiss,
    isStandalone: installed,
    isIOS: isIOSDevice,
    showIOSHelp,
    dismissIOS,
  } as const;
}
