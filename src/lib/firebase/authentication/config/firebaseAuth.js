import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

import { initializeFirestoreWithCache } from "../../firestore/initFirestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredConfigKeys = ["apiKey", "authDomain", "projectId", "appId"];

export const firebaseProjectId = firebaseConfig.projectId || "";

export function ensureFirebaseAuthConfig() {
  const missingKeys = requiredConfigKeys.filter(
    (key) => !firebaseConfig[key] || String(firebaseConfig[key]).trim() === "",
  );

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase config: ${missingKeys.join(", ")}. Set VITE_FIREBASE_* values in .env.`,
    );
  }
}

const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export { firebaseApp };
export const firebaseAuth = getAuth(firebaseApp);

const { firestore, status } = initializeFirestoreWithCache(firebaseApp);

export const firebaseDb = firestore;
export const firestoreCacheStatus = status;
