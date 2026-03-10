import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

// Fallbacks so build succeeds when env vars are not set (e.g. on Vercel before config). Set real values in Vercel env for production.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'placeholder',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'placeholder.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'placeholder',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'placeholder.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '0',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:0:web:0',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-XXXX',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

function initAuth() {
  if (Platform.OS === "web") {
    return initializeAuth(app, { persistence: browserLocalPersistence });
  }
  try {
    // Firebase 12: React Native persistence may be in a separate path; avoid top-level import for web build.
    const { getReactNativePersistence } = require("firebase/auth/react-native");
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return initializeAuth(app, {});
  }
}

export const auth = initAuth();

export const storage = getStorage(app);