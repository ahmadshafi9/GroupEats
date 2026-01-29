// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB5TchliypbjYP24aAPk50FgIIJv7__t5s",
  authDomain: "groupeats-60549.firebaseapp.com",
  projectId: "groupeats-60549",
  storageBucket: "groupeats-60549.firebasestorage.app",
  messagingSenderId: "412628177163",
  appId: "1:412628177163:web:86a5b2e57531a2c6f8120e",
  measurementId: "G-S0LB83G602"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const storage = getStorage(app);