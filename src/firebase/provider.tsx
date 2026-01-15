
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
}

// Return type for useFirebase()
export interface FirebaseServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}


// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);


/**
 * FirebaseProvider manages and provides Firebase services.
 */
export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {

  const firebaseServices = useMemo(() => {
    if (firebaseConfig && firebaseConfig.apiKey) {
      try {
        const firebaseApp = initializeApp(firebaseConfig);
        const auth = getAuth(firebaseApp);
        const firestore = getFirestore(firebaseApp);
        return { firebaseApp, auth, firestore, servicesAvailable: true };
      } catch (e) {
        console.error("Firebase initialization error:", e);
        return { firebaseApp: null, auth: null, firestore: null, servicesAvailable: false };
      }
    }
    console.warn("Firebase config is missing or incomplete.");
    return { firebaseApp: null, auth: null, firestore: null, servicesAvailable: false };
  }, []);


  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    return {
      areServicesAvailable: firebaseServices.servicesAvailable,
      firebaseApp: firebaseServices.firebaseApp,
      firestore: firebaseServices.firestore,
      auth: firebaseServices.auth,
    };
  }, [firebaseServices]);
  
  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServices => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};
