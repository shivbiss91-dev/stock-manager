import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
} from 'firebase/firestore';

/**
 * Firebase Client Configuration for StockVista ERP.
 * Credentials are securely loaded via Vite environment variables.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

/**
 * Validates whether required Firebase configuration values are provided.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.trim() !== '' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId.trim() !== ''
  );
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;

if (isFirebaseConfigured()) {
  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    googleProviderInstance = new GoogleAuthProvider();
  } catch (error) {
    console.warn('[Firebase] Initialization error:', error);
  }
} else {
  // Graceful fallback when keys are not yet pasted into .env.local
  // Application continues running with local storage without throwing runtime errors
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const googleAuthProvider = googleProviderInstance;

/**
 * Syncs an array of ERP documents to a cloud Firestore collection.
 */
export async function syncToFirestore<T extends { id: string }>(
  collectionName: string,
  records: T[]
): Promise<boolean> {
  if (!dbInstance) return false;
  try {
    const colRef = collection(dbInstance, collectionName);
    const promises = records.map((rec) => {
      const docRef = doc(colRef, rec.id);
      return setDoc(docRef, rec, { merge: true });
    });
    await Promise.all(promises);
    return true;
  } catch (err) {
    console.error(`[Firebase] Failed to sync ${collectionName}:`, err);
    return false;
  }
}

/**
 * Fetches all documents from a Firestore collection.
 */
export async function fetchFromFirestore<T>(collectionName: string): Promise<T[]> {
  if (!dbInstance) return [];
  try {
    const colRef = collection(dbInstance, collectionName);
    const snap = await getDocs(query(colRef));
    return snap.docs.map((d) => d.data() as T);
  } catch (err) {
    console.error(`[Firebase] Failed to fetch ${collectionName}:`, err);
    return [];
  }
}

/**
 * Sets up a real-time snapshot listener on a Firestore collection.
 */
export function subscribeToFirestore<T>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!dbInstance) return () => {};
  try {
    const colRef = collection(dbInstance, collectionName);
    const unsubscribe = onSnapshot(
      query(colRef),
      (snap) => {
        const items = snap.docs.map((d) => d.data() as T);
        onData(items);
      },
      (err) => {
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error(`[Firebase] Failed to subscribe to ${collectionName}:`, e);
    return () => {};
  }
}
