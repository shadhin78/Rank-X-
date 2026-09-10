import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/src/config/firebase';

/**
 * Singleton Firebase Client Initialization Layer
 * Initializes Firebase SDK only once across the application lifecycle.
 */

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }

  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('[StudyRank Firebase Initialization Error]:', error);
  // Re-throw or capture to allow grace handling
  throw error;
}

export const firebaseApp = app;
export const firebaseAuth = auth;
export const firestoreDb = db;

export interface FirebaseStatus {
  isInitialized: boolean;
  projectId: string;
  authDomain: string;
  appId: string;
}

export function getFirebaseStatus(): FirebaseStatus {
  return {
    isInitialized: !!firebaseApp,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    appId: firebaseConfig.appId,
  };
}
