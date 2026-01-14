// src/firebase/provider.tsx
'use client';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { createContext, useContext } from 'react';

// Define the context shape
interface FirebaseContextType {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

// Create the context with a default value
const FirebaseContext = createContext<FirebaseContextType>({
  firebaseApp: null,
  firestore: null,
  auth: null,
});

/**
 * Provides the Firebase context to its children.
 * @param children The child components to render.
 * @param firebaseApp The Firebase app instance.
 * @param firestore The Firestore instance.
 * @param auth The Auth instance.
 * @returns The Firebase provider component.
 */
export function FirebaseProvider({
  children,
  firebaseApp,
  firestore,
  auth,
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}) {
  return (
    <FirebaseContext.Provider value={{ firebaseApp, firestore, auth }}>
      {children}
    </FirebaseContext.Provider>
  );
}

/**
 * A hook to access the Firebase context.
 * @returns The Firebase context.
 */
export function useFirebase() {
  return useContext(FirebaseContext);
}

/**
 * A hook to access the Firebase app instance.
 * @returns The Firebase app instance.
 */
export function useFirebaseApp() {
  const { firebaseApp } = useFirebase();
  if (!firebaseApp) {
    throw new Error(
      'useFirebaseApp must be used within a FirebaseProvider.'
    );
  }
  return firebaseApp;
}

/**
 * A hook to access the Firestore instance.
 * @returns The Firestore instance.
 */
export function useFirestore() {
  const { firestore } = useFirebase();
  if (!firestore) {
    throw new Error('useFirestore must be used within a FirebaseProvider.');
  }
  return firestore;
}
