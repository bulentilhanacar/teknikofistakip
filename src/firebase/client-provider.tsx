// src/firebase/client-provider.tsx
'use client';
import { useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from '.';

/**
 * Provides the Firebase context to client-side components.
 */
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firebaseApp, firestore, auth } = useMemo(
    () => initializeFirebase(),
    []
  );

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      {children}
    </FirebaseProvider>
  );
}
