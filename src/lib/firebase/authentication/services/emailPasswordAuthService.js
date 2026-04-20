import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { ensureFirebaseAuthConfig, firebaseAuth } from "../config/firebaseAuth";

let persistenceSetupPromise;

function ensurePersistenceSetup() {
  if (!persistenceSetupPromise) {
    persistenceSetupPromise = setPersistence(
      firebaseAuth,
      browserLocalPersistence,
    ).catch((error) => {
      persistenceSetupPromise = null;
      throw error;
    });
  }

  return persistenceSetupPromise;
}

export function getAuthErrorMessage(error) {
  if (!error || typeof error !== "object") {
    return "Authentication failed. Please try again.";
  }

  switch (error.code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/missing-password":
      return "Password is required.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "This email is already registered.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and retry.";
    default:
      return error.message || "Authentication failed. Please try again.";
  }
}

export async function signInWithEmailPassword({ email, password }) {
  ensureFirebaseAuthConfig();
  await ensurePersistenceSetup();

  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    email,
    password,
  );

  return credential.user;
}

export async function registerWithEmailPassword({
  email,
  password,
  displayName,
}) {
  ensureFirebaseAuthConfig();
  await ensurePersistenceSetup();

  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email,
    password,
  );

  if (displayName && displayName.trim()) {
    await updateProfile(credential.user, {
      displayName: displayName.trim(),
    });
  }

  return credential.user;
}

export async function signOutFirebaseUser() {
  ensureFirebaseAuthConfig();
  await signOut(firebaseAuth);
}

export function subscribeToFirebaseAuthState(onChange, onError) {
  ensureFirebaseAuthConfig();
  return onAuthStateChanged(firebaseAuth, onChange, onError);
}
