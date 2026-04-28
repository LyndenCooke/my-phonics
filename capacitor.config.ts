import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor config — wraps the web build into iOS + Android shells.
 *
 * Bundle IDs follow reverse-domain convention. We use `co.uk` because the
 * primary domain is myphonicsbooks.co.uk; the App Store / Play Store don't
 * care which TLD you pick as long as it's stable for the lifetime of the
 * app (changing it later orphans installed users).
 *
 * The webDir points at Vite's build output. `npx cap sync` copies dist/
 * into the native projects.
 */
const config: CapacitorConfig = {
  appId: 'uk.co.myphonicsbooks.app',
  appName: 'MyPhonicsBooks',
  webDir: 'dist',

  // Allow http on Android dev builds only — production goes through HTTPS
  // via the embedded WebView (Capacitor handles this transparently).
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },

  // ─── Splash screen ───
  // We hide programmatically from main.tsx after the first real screen
  // has rendered, so first paint is instant. Static config below is the
  // FALLBACK for if JS doesn't run (which would mean a much bigger problem).
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false,           // we hide via JS (see main.tsx)
      backgroundColor: '#FDF8F7',      // brand cream — same as body bg
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      // Default style — we override per-route in NativeShell
      style: 'DARK',                   // dark icons on light bg
      backgroundColor: '#FDF8F7',
      overlaysWebView: false,
    },
    Keyboard: {
      // Push the entire webview up when the keyboard opens. Avoids the
      // common "input hidden behind keyboard" bug.
      resize: 'body',
      style: 'LIGHT',
      resizeOnFullScreen: true,
    },
  },

  ios: {
    contentInset: 'never',             // we handle safe-area in CSS
    scrollEnabled: true,
    backgroundColor: '#FDF8F7',
    // Block accidental zoom-on-double-tap, which screams "this is a webview"
    limitsNavigationsToAppBoundDomains: false,
  },

  android: {
    backgroundColor: '#FDF8F7',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // flip to true when debugging
  },
};

export default config;
