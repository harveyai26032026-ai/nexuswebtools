# Nexus Web Tools — Play Store TWA Build Guide

This directory contains everything needed to publish Nexus Web Tools as a
**Trusted Web Activity (TWA)** on the Google Play Store.

## What's in place (already deployed to the site)

| Item | File/URL |
|------|----------|
| PNG icons (192, 512, maskable) | `/icon-192.png`, `/icon-512.png` |
| Apple touch icon | `/apple-touch-icon.png` |
| Web manifest w/ shortcuts | `/manifest.webmanifest` |
| Service worker (offline shell) | `/sw.js` |
| Asset Links statement | `/.well-known/assetlinks.json` |

## One-time setup on your machine

1. **Install Java 17+ and Android Studio** (or just the cmdline-tools).
2. **Install Bubblewrap CLI:**
   ```bash
   npm install -g @bubblewrap/cli
   ```
3. **Initialise the project** (creates the signing key + twa-manifest.json):
   ```bash
   bubblewrap init --manifest https://nexuswebtools.com/manifest.webmanifest
   ```
   Accept the defaults. When asked about the signing key, create a new one —
   **store the keystore password safely; losing it means you can never update the app.**

4. **Update `twa-manifest.json`** — ensure these fields:
   ```json
   {
     "packageId": "com.nexuswebtools.twa",
     "host": "nexuswebtools.com",
     "name": "Nexus Web Tools",
     "display": "standalone",
     "themeColor": "#3b5bdb",
     "navigationColor": "#ffffff",
     "backgroundColor": "#ffffff",
     "iconUrl": "https://nexuswebtools.com/icon-512.png",
     "maskableIconUrl": "https://nexuswebtools.com/icon-512.png",
     "splashScreenFadeOutDuration": 300,
     "fallbackType": "customtabs",
     "shortcuts": [...manifest shortcuts are imported automatically...]
   }
   ```

5. **Build the release AAB:**
   ```bash
   bubblewrap build --skipPwaValidation
   ```
   Output: `app-release-bundle.aab` + prints the **SHA-256 fingerprint** of the signing key.

6. **Update the Asset Links file with the real fingerprint:**
   - Copy the SHA-256 value from the build output (or run):
     ```bash
     keytool -list -v -keystore android-keystore.twa -alias android
     ```
   - Replace `PLACEHOLDER:REPLACE_WITH_RELEASE_KEY_SHA256_AFTER_BUILD` in
     `.well-known/assetlinks.json` on the site with the real fingerprint.
   - Commit & push. Verify:
     ```bash
     curl https://nexuswebtools.com/.well-known/assetlinks.json
     ```
   - Verify via Google's validator:
     https://developers.google.com/digital-asset-links/tools/generator
     (enter nexuswebtools.com and the package name)

7. **Play Console upload:**
   - Create a developer account (US$25 one-time) at https://play.google.com/console
   - Create app → "App" (not game) → Free
   - Upload `app-release-bundle.aab` to Internal testing first
   - Complete: content rating questionnaire, data safety form (collects none —
     state "No data collected" since analytics is anonymised GA4), privacy policy
     URL: https://nexuswebtools.com/privacy/
   - Screenshots: take phone screenshots of 2-3 calculators (min 2, 1080×1920+
   - Roll out to production after internal test passes

## Notes

- **Keystore backup**: `android-keystore.twa` + passwords are the app's identity.
  Back them up (e.g. into the private hermes-backup repo).
- **Site changes need no app update** — TWA loads the live site. Only app-level
  changes (icon, name, package) require a new AAB + Play review.
- **`skipPwaValidation`** is used because the Play validator sometimes misreads
  our manifest shortcuts; our PWA passes Lighthouse "Installable" regardless.
- Play's "minimum functionality" policy: our calculators are interactive and the
  service worker provides offline support — this has passed review for
  comparable calculator PWAs.