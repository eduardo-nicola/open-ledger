"use client";

import {
  FirebaseError,
  getApp,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";

import { firebaseConfig, isFirebaseConfigured } from "@/services/firebase/config";

const CONFIG_ERROR =
  "Firebase is not configured. Copy .env.example to .env.local and set all NEXT_PUBLIC_FIREBASE_* variables.";

function getOrCreateDefaultApp(): FirebaseApp {
  try {
    return getApp();
  } catch (err) {
    if (err instanceof FirebaseError && err.code === "app/no-app") {
      return initializeApp(firebaseConfig);
    }
    throw err;
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(CONFIG_ERROR);
  }
  return getOrCreateDefaultApp();
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export const googleProvider = new GoogleAuthProvider();
