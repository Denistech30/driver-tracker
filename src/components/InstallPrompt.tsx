import React from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { X } from 'lucide-react';

interface InstallPromptProps {
  className?: string;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ className }) => {
  const {
    canInstall,
    promptInstall,
    dismiss,
    isIOS,
    showIOSHelp,
    dismissIOS,
  } = useInstallPrompt();

  const commonCard = 'fixed z-[1000] left-1/2 -translate-x-1/2 max-w-sm w-[92vw] bottom-20 sm:bottom-24 rounded-xl shadow-lg border bg-white/95 dark:bg-gray-900/95 backdrop-blur p-4';
  const btn = 'inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90 active:opacity-80 transition';
  const muted = 'text-xs text-gray-600 dark:text-gray-300';
  const closeBtn = 'p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800';

  if (!canInstall && !(isIOS && showIOSHelp)) return null;

  return (
    <div className={className}>
      {/* Android/Desktop Install Prompt */}
      {canInstall && (
        <div className={commonCard} role="dialog" aria-live="polite" aria-label="Install app">
          <div className="flex items-start gap-3">
            <img src="/pwa-192x192 (2).png" alt="Xpense" className="h-9 w-9 rounded" />
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-gray-100">Install Xpense</div>
              <div className={muted}>Get lightning-fast access and offline support by installing the app.</div>
              <div className="mt-3 flex gap-2">
                <button
                  className={btn}
                  onClick={async () => {
                    const outcome = await promptInstall();
                    if (outcome === 'dismissed') {
                      // Respectful cooldown
                      dismiss(7);
                    }
                  }}
                >
                  Install
                </button>
                <button
                  className="px-3 py-2 text-sm rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => dismiss(7)}
                >
                  Not now
                </button>
              </div>
            </div>
            <button className={closeBtn} aria-label="Close" onClick={() => dismiss(30)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Add to Home Screen Instructions */}
      {isIOS && showIOSHelp && (
        <div className={commonCard} role="dialog" aria-live="polite" aria-label="Add to Home Screen">
          <div className="flex items-start gap-3">
            <img src="/pwa-192x192 (2).png" alt="Xpense" className="h-9 w-9 rounded" />
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-gray-100">Add to Home Screen</div>
              <div className={muted}>
                On iPhone/iPad, open this site in Safari, tap the Share icon, then choose "Add to Home Screen".
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="px-3 py-2 text-sm rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => dismissIOS(7)}
                >
                  Got it
                </button>
              </div>
            </div>
            <button className={closeBtn} aria-label="Close" onClick={() => dismissIOS(30)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallPrompt;
