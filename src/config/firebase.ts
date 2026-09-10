/**
 * Firebase Client Configuration
 * Client configuration read from Vite environment variables with project-provided fallbacks.
 * Note: Never expose Firebase Admin credentials or service account keys on the client.
 */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const firebaseConfig: FirebaseClientConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyAQclePrRzsnvsZSPF9s3c2pqXzy8gJpNo',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    'project-error-78.firebaseapp.com',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || 'project-error-78',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'project-error-78.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '757218203491',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:757218203491:web:aca03b8d3f3b1e94b7a556',
};
