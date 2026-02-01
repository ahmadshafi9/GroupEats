// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "REDACTED_API_KEY",
  authDomain: "groupeats-60549.firebaseapp.com",
  projectId: "groupeats-60549",
  storageBucket: "groupeats-60549.firebasestorage.app",
  messagingSenderId: "REDACTED_SENDER_ID",
  appId: "REDACTED_APP_ID",
  measurementId: "REDACTED_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore - React Native has offline persistence enabled by default
// No need to manually enable it like on web
export const db = getFirestore(app);

// Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Storage
export const storage = getStorage(app);