/**
 * Native runtime helpers — thin wrappers around Capacitor plugins so the
 * rest of the app can call them without caring whether we're on web,
 * iOS, or Android.
 *
 * Every export is a no-op on web, so `import { haptic } from '@/lib/native'`
 * is safe to call from anywhere.
 */
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
export const isIos = platform === 'ios';
export const isAndroid = platform === 'android';

// ─── Haptics ──────────────────────────────────────────────────────────
// Imported lazily so the web bundle doesn't pull in plugin code it'll
// never use. iOS and Android pay the load cost once on first use.
let _haptics: typeof import('@capacitor/haptics') | null = null;
async function loadHaptics() {
  if (!isNative) return null;
  if (!_haptics) _haptics = await import('@capacitor/haptics');
  return _haptics;
}

/** Light tap — for selecting a tab, toggling a switch, picking a card. */
export async function hapticLight() {
  const m = await loadHaptics();
  if (!m) return;
  m.Haptics.impact({ style: m.ImpactStyle.Light }).catch(() => {});
}

/** Medium tap — confirming an action, finishing a question. */
export async function hapticMedium() {
  const m = await loadHaptics();
  if (!m) return;
  m.Haptics.impact({ style: m.ImpactStyle.Medium }).catch(() => {});
}

/** Heavy tap — major moments only (book complete, level up). */
export async function hapticHeavy() {
  const m = await loadHaptics();
  if (!m) return;
  m.Haptics.impact({ style: m.ImpactStyle.Heavy }).catch(() => {});
}

/** Selection feedback for scrubbing through a list / picker. */
export async function hapticSelect() {
  const m = await loadHaptics();
  if (!m) return;
  m.Haptics.selectionChanged().catch(() => {});
}

/** Notification-style — success/warning/error feedback. */
export async function hapticSuccess() {
  const m = await loadHaptics();
  if (!m) return;
  m.Haptics.notification({ type: m.NotificationType.Success }).catch(() => {});
}

// ─── Status bar ────────────────────────────────────────────────────────
let _statusBar: typeof import('@capacitor/status-bar') | null = null;
async function loadStatusBar() {
  if (!isNative) return null;
  if (!_statusBar) _statusBar = await import('@capacitor/status-bar');
  return _statusBar;
}

/** Light status bar — dark icons, light background. Use on light screens. */
export async function statusBarLight(bgColor = '#FDF8F7') {
  const m = await loadStatusBar();
  if (!m) return;
  m.StatusBar.setStyle({ style: m.Style.Light }).catch(() => {});
  if (isAndroid) m.StatusBar.setBackgroundColor({ color: bgColor }).catch(() => {});
}

/** Dark status bar — light icons, dark background. Use on book reader, etc. */
export async function statusBarDark(bgColor = '#1A0F14') {
  const m = await loadStatusBar();
  if (!m) return;
  m.StatusBar.setStyle({ style: m.Style.Dark }).catch(() => {});
  if (isAndroid) m.StatusBar.setBackgroundColor({ color: bgColor }).catch(() => {});
}

// ─── Splash screen ────────────────────────────────────────────────────
let _splash: typeof import('@capacitor/splash-screen') | null = null;
async function loadSplash() {
  if (!isNative) return null;
  if (!_splash) _splash = await import('@capacitor/splash-screen');
  return _splash;
}

/** Hide the native splash. Call once after the first real screen mounts. */
export async function hideSplash() {
  const m = await loadSplash();
  if (!m) return;
  m.SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
}

// ─── App / hardware back button ───────────────────────────────────────
let _app: typeof import('@capacitor/app') | null = null;
async function loadApp() {
  if (!isNative) return null;
  if (!_app) _app = await import('@capacitor/app');
  return _app;
}

/** Wire Android hardware back to react-router history. Call once. */
export async function setupHardwareBack() {
  const m = await loadApp();
  if (!m) return;
  m.App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack && window.history.length > 1) {
      window.history.back();
    } else {
      m.App.exitApp().catch(() => {});
    }
  }).catch(() => {});
}

// ─── Native share sheet ───────────────────────────────────────────────
let _share: typeof import('@capacitor/share') | null = null;

/** Open the native share sheet. Falls back to navigator.share on web. */
export async function nativeShare(opts: { title?: string; text: string; url?: string }) {
  if (isNative) {
    if (!_share) _share = await import('@capacitor/share');
    return _share.Share.share(opts).catch(() => {});
  }
  const navWithShare = navigator as Navigator & {
    share?: (data: { title?: string; text: string; url?: string }) => Promise<void>;
  };
  if (typeof navigator !== 'undefined' && navWithShare.share) {
    return navWithShare.share(opts).catch(() => {});
  }
  // No share support — caller should have used a copy-to-clipboard fallback.
}
