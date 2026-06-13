/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import localFirebaseConfig from '../firebase-applet-config.json';

// Dynamic Firebase configuration using env variables, falling back to local config files
export const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || localFirebaseConfig.apiKey || "",
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || localFirebaseConfig.authDomain || "",
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || localFirebaseConfig.projectId || "",
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || localFirebaseConfig.storageBucket || "",
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || localFirebaseConfig.messagingSenderId || "",
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || localFirebaseConfig.appId || "",
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_DATABASE_ID as string) || localFirebaseConfig.firestoreDatabaseId || "(default)"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
