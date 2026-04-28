# MyPhonicsBooks — Native App Build Guide

This is the practical playbook for getting the iOS and Android apps built and
into the App Store / Play Store. Capacitor wraps the existing web app, so
everything you see in the browser already works — these steps are about
turning that bundle into a signed, store-ready binary.

---

## One-time setup

### Bundle identity (ALREADY SET — confirm before first build)
| Field        | Value                          | Where it lives                |
| ------------ | ------------------------------ | ----------------------------- |
| App ID       | `uk.co.myphonicsbooks.app`     | `capacitor.config.ts`         |
| Display name | `MyPhonicsBooks`               | `capacitor.config.ts`         |
| Bundle dir   | `dist/`                        | `capacitor.config.ts`         |

Changing the App ID after first store submission orphans every existing
install — leave it alone.

### Tooling

**Required on dev machine:**
- Node 20+ + npm
- Git

**For iOS builds (Mac only):**
- macOS 13+ with Xcode 15+
- An Apple Developer Program account (£79/yr)
- A signing certificate + provisioning profile (Xcode auto-manages)

**For Android builds (any OS):**
- [Android Studio](https://developer.android.com/studio) Hedgehog or newer
- JDK 17 (Android Studio bundles one)
- A keystore for release signing (we'll create it below)

---

## Daily dev loop

When you change web code and want to test it on a phone:

```bash
# 1. Build the web bundle
npm run build

# 2. Copy the bundle into the native projects
npx cap sync

# 3. Open the platform you want to test
npx cap open ios       # opens Xcode
npx cap open android   # opens Android Studio
```

Inside Xcode / Android Studio, hit Run on a simulator or connected device.

**Faster live-reload alternative** (web changes hot-reload onto a tethered
device instead of full rebuilding):

```bash
# Terminal 1
npm run dev -- --host    # bind dev server to LAN

# Terminal 2 — point Capacitor at your dev server
# Edit capacitor.config.ts: server.url = 'http://<your-laptop-IP>:5173'
npx cap sync
npx cap open ios   # or android
```
Remove the `server.url` before any release build.

---

## iOS — first release

1. **Open the project**
   ```bash
   npm run build && npx cap sync ios && npx cap open ios
   ```

2. **In Xcode**, click the project root → "Signing & Capabilities" tab:
   - Check **Automatically manage signing**
   - Select your **Team** (Apple Developer account)
   - Bundle Identifier should already say `uk.co.myphonicsbooks.app` — leave it

3. **Set version + build number**
   - Click the App target → "General" tab
   - Version: `1.0.0` (semver — bump for each release)
   - Build: `1` (must increase every upload, even for the same version)

4. **Privacy strings** — open `ios/App/App/Info.plist` and confirm these
   keys exist (Capacitor adds them, but check):
   - `NSMicrophoneUsageDescription` — only if you add voice features later
   - `NSUserTrackingUsageDescription` — only if you add ad tracking
   - For the read-aloud feature, no special key is needed.

5. **App icon** — already populated by `@capacitor/assets`.
   Confirm at `ios/App/App/Assets.xcassets/AppIcon.appiconset`.

6. **Test on a real device** — plug in iPhone, select it from the device
   dropdown, hit Run. Reading audio + haptics only work on real hardware
   (simulator doesn't vibrate, and TTS files come from the web bundle so
   they need network on first install).

7. **Archive for App Store**
   - Product menu → Destination → "Any iOS Device (arm64)"
   - Product → Archive
   - When the Organizer window opens, click **Distribute App** → **App Store Connect** → **Upload**.

8. **App Store Connect** (https://appstoreconnect.apple.com/)
   - Create a new app entry with the bundle ID above
   - Fill in:
     - App name
     - Subtitle (optional)
     - Description (paste from landing page)
     - Keywords (e.g. `phonics, learn to read, kids reading, decodable`)
     - Screenshots (we'll generate from the dev preview — 6.7" iPhone needed minimum)
     - Privacy policy URL: `https://myphonicsbooks.vercel.app/privacy`
     - Age rating: 4+ (educational)
     - Category: Education (primary) / Books (secondary)
   - Submit for review

⚠️ **In-App Purchase question.** If users can buy the £1 Founders Club from
inside the iOS app, Apple's rule 3.1.1 says it MUST go through StoreKit
(Apple takes 30%). Workarounds:
- a) Strip the buy CTAs from the app on iOS — users sign up on web, then
     log in to the app for content. (Spotify / Netflix model.)
- b) Add StoreKit IAP for the Founders Club specifically. ~2 days work.
This is a business call — flag with Lynden before submitting.

---

## Android — first release

1. **Open the project**
   ```bash
   npm run build && npx cap sync android && npx cap open android
   ```

2. **Wait for Gradle sync to finish** (status bar bottom of Android Studio).

3. **Generate a release keystore** (one-time, keep it safe — losing it
   means you can never update this app under the same listing):
   ```bash
   keytool -genkey -v -keystore mpb-release.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias mpb-release
   ```
   Store this file outside the repo (e.g. 1Password) and write down the
   passwords. Add `*.jks` to `.gitignore` (already done).

4. **Create `android/keystore.properties`** (gitignored):
   ```properties
   storeFile=/absolute/path/to/mpb-release.jks
   storePassword=...
   keyAlias=mpb-release
   keyPassword=...
   ```

5. **Set version** in `android/app/build.gradle`:
   ```gradle
   defaultConfig {
       versionCode 1            // increase every upload
       versionName "1.0.0"      // semver
   }
   ```

6. **Build signed bundle**
   - Android Studio menu: Build → Generate Signed Bundle / APK → Android App Bundle
   - Pick the keystore from step 3, type the password
   - Build variant: **release**
   - Click Finish — `.aab` lands in `android/app/release/`

7. **Google Play Console** (https://play.google.com/console)
   - One-time $25 developer registration fee
   - Create a new app — name, default language, app/game = App, free/paid = Free
   - Internal testing track first → upload `.aab`, add yourself as a tester
   - Once tested, promote to **Production** track and submit for review

---

## Submission checklists (run through before each release)

### Pre-flight
- [ ] `npm run build` produces no errors
- [ ] `npx cap sync` produces no warnings
- [ ] Bundle version + build number incremented
- [ ] Tested on a real device (not just simulator)
- [ ] No `console.log` calls left in production code paths
- [ ] Status bar looks right on a notched device (top padding correct)
- [ ] Bottom nav has breathing room above home indicator (iOS)
- [ ] Hardware back button on Android exits the app from /library, not earlier
- [ ] All deep links you use (e.g. ?ref=) survive a cold-start launch

### Screenshots needed
- iOS: 6.7" iPhone (e.g. 15 Pro Max, 1290×2796) — 3 to 10 screens
- iOS: 6.5" iPhone (e.g. 11 Pro Max, 1242×2688) — same screens
- iPad 12.9" (if supporting iPad — recommended)
- Android: phone screenshots, 1080×1920 minimum, 8 max

Easiest way: use the Vercel preview at the right viewport size, or run
the simulator and use ⌘S to save screenshots.

### Store listing copy (write once, paste both stores)

**Short tagline (30 chars max for iOS):**
> Decodable phonics, world stories.

**Description:**
```
MyPhonicsBooks turns every reading session into an adventure.
33 carefully decodable books across 6 reading levels, with stories
set in Japan, Kenya, Morocco, Egypt, Mexico — and tap-any-word audio
in a real human voice (no robotic TTS).

• 33 books across 6 phonics levels
• Tap any word to hear it sounded out, phoneme by phoneme
• Free reading assessment matches your child to the right level
• Comprehension quizzes after every book
• Progress dashboard for parents + child-mode for kids
• UK Year 1 Phonics Screening Check aligned

For children aged 4–8 learning to read.
```

**Keywords (iOS):** `phonics, decodable books, learn to read, kids reading, year 1, screening check, reading assessment, early literacy`

---

## Troubleshooting

### "It runs in Xcode but the splash never goes away"
Capacitor is showing the splash and JS hasn't run `hideSplash()` yet.
Look for JS errors in Safari's Web Inspector (Develop menu → your device).

### "Status bar overlaps the header"
- Confirm `<meta name="viewport" content="...viewport-fit=cover">` is in
  `index.html`
- Confirm header has `pt-safe` class
- iOS only reports insets if `viewport-fit=cover` is set

### "App Store rejected for IAP"
Re-read the Apple guidance above. Pull buy buttons out of the iOS bundle
or implement StoreKit.

### "I lost my Android keystore"
You're locked out of updating that listing. Apple has Play App Signing
recovery in some cases — contact Google support. Always back up the
keystore in two places.
