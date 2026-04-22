# Firebase Authentication Setup Guide (CropTap PWA)

This guide covers the **Firebase Console setup** you need before coding auth.

## 1. Create or Select Your Firebase Project

1. Go to Firebase Console: https://console.firebase.google.com/
2. Click **Add project** (or open your existing project).
3. Set a project name (example: `croptap-prod` or `croptap-dev`).
4. Google Analytics is optional for auth setup. You can enable it now or later.

## 2. Register Your Web App in Firebase

1. In your project, click the **Web** icon (`</>`) to add a web app.
2. App nickname: `croptap-web` (or similar).
3. You can leave "Set up Firebase Hosting" unchecked for now.
4. Click **Register app**.
5. Firebase will show your Web config object. Copy these values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId` (only if Analytics enabled)

Keep these values ready for your `.env` file.

## 3. Enable Authentication Methods

1. In Firebase Console, go to **Build > Authentication**.
2. Click **Get started** if prompted.
3. Open **Sign-in method** tab.

### Email/Password

1. Select **Email/Password** provider.
2. Enable it.
3. Save.

### Google

1. Select **Google** provider.
2. Enable it.
3. Set a **Project support email**.
4. Save.

## 4. Configure Authorized Domains

Firebase Auth blocks sign-in from unknown domains. Add all domains you will use.

1. Go to **Authentication > Settings > Authorized domains**.
2. Ensure these are present:
   - `localhost` (for local development)
   - Your production domain (example: `croptap.app`)
   - Your preview/staging domain (if any)

If you deploy on Vercel/Netlify, add those preview domains too.

## 5. Create .env Keys for Vite (No Code Yet)

In your project root `.env`, prepare these keys (replace values with your Firebase config):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Notes:

- In Vite, client-side env vars must start with `VITE_`.
- Firebase web config values are not treated as private secrets, but keep your project controlled and rules strict.
- If Analytics is not enabled, `VITE_FIREBASE_MEASUREMENT_ID` can be omitted.
- On the Firebase free plan, skip Cloud Functions entirely.
- The current sync secret flow uses a client-derived, best-effort secret so the app can run without an upgraded Firebase plan.

## 6. Verify Firebase Project Settings (Recommended)

1. Open **Project settings** (gear icon).
2. Confirm your app is listed in **Your apps**.
3. Confirm your config values match exactly what you copied.
4. Confirm support email is set for Google provider.

## 7. Optional but Recommended Early Security Setup

Even before writing auth code, review:

1. **Authentication > Settings**
   - User account linking behavior
   - Password policy (if needed)
2. **App Check**
   - Plan to enable later for production protection.
3. **Firestore/Storage rules**
   - Ensure rules are not open in production.

## 8. Quick Checklist

- [ ] Firebase project created/selected
- [ ] Web app registered
- [ ] Web config values copied
- [ ] Email/Password enabled
- [ ] Google sign-in enabled
- [ ] Authorized domains configured
- [ ] `.env` keys prepared with `VITE_` prefix
- [ ] Support email and settings verified

## 9. What Comes Next (After This Setup)

After this Firebase console setup is done, the next implementation phase is:

1. Initialize Firebase app in `src/lib/firebase/`
2. Initialize Firebase Auth instance
3. Add auth provider helpers (Google provider)
4. Build auth services (sign up, sign in, sign out)
5. Add auth state listener and persistence strategy for PWA
6. Leave Cloud Functions unused unless you later upgrade Firebase

This guide intentionally stops before coding, as requested.
