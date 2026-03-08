import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
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