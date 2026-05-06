/**
 * AddToHomeScreenPrompt — fires at the highest-conversion moment (right
 * after a Founders Club purchase) to lock in the daily-use habit by
 * getting the customer to put the app on their home screen.
 *
 * Why now and not later:
 *   - They've just paid £1. Commitment is at its peak.
 *   - If they don't install, they'll forget the URL by tomorrow.
 *   - Once on the home screen, opening it is one tap. The kid never
 *     has to type a URL.
 *
 * Detection:
 *   - If already standalone (display-mode media query OR navigator.standalone
 *     on iOS legacy), don't show — they're already installed.
 *   - On Android Chrome we can use the beforeinstallprompt event for a
 *     native install dialog.
 *   - On iOS Safari we have to show manual instructions — there's no
 *     programmatic API.
 */
import { useEffect, useState } from 'react';
import { Smartphone, Share, Plus, X } from 'lucide-react';
import { hapticLight } from '@/lib/native';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AddToHomeScreenPrompt() {
  const [dismissed, setDismissed] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  // Detect whether already installed
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));

  // Detect platform for the right instructions
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIos = /iPhone|iPad|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
  const isAndroid = /android/i.test(ua);
  const isMobile = isIos || isAndroid;

  useEffect(() => {
    // Capture Chrome / Android's native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Don't render if already installed, dismissed, or this is a desktop
  // browser (less useful — they're not gonna pin a tab to their dock).
  if (isStandalone || dismissed || !isMobile) return null;

  const handleAndroidInstall = async () => {
    hapticLight();
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setDismissed(true);
    setDeferred(null);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-fuchsia-50 to-pink-50 border-2 border-fuchsia-300 p-5 mb-5 text-left relative shadow-card">
      <button
        onClick={() => { hapticLight(); setDismissed(true); }}
        className="absolute top-3 right-3 w-7 h-7 rounded-full hover:bg-white/60 flex items-center justify-center text-muted-foreground"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-fuchsia-500 text-white flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-6">
          <h3 className="font-display font-extrabold text-base text-foreground leading-tight">
            One last step — make it 1 tap away
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Save MyPhonicsBooks to your home screen. Tomorrow, hand the phone to your child — they tap the icon and start reading. No logging in. No typing.
          </p>
        </div>
      </div>

      {isAndroid && deferred ? (
        <button
          onClick={handleAndroidInstall}
          className="w-full py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-extrabold text-sm shadow-button active:scale-[0.97] transition-transform"
        >
          Install on home screen
        </button>
      ) : isIos ? (
        <ol className="space-y-2.5 text-xs text-foreground bg-white rounded-xl p-3 border border-fuchsia-200">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-fuchsia-500 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">1</span>
            <span className="leading-relaxed">Tap the <Share className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" /> <strong>Share</strong> button at the bottom of Safari</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-fuchsia-500 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">2</span>
            <span className="leading-relaxed">Scroll down → tap <Plus className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" /> <strong>"Add to Home Screen"</strong></span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-fuchsia-500 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">3</span>
            <span className="leading-relaxed">Tap <strong>Add</strong> in the top-right. Done!</span>
          </li>
        </ol>
      ) : (
        <p className="text-xs text-muted-foreground">
          Open this page in Chrome (Android) or Safari (iPhone) on your phone to install the app to your home screen.
        </p>
      )}
    </div>
  );
}
