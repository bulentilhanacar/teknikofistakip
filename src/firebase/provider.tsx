
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';
import { GoogleAuthProvider } from 'firebase/auth';


// Provider specific for client-side Firebase interactions
interface FirebaseClientContextState {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseClientContext = createContext<FirebaseClientContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const firebaseServices = useMemo(() => {
    if (firebaseConfig && firebaseConfig.apiKey) {
      try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        return { firebaseApp: app, auth, firestore };
      } catch (e) {
        console.error("Firebase initialization error:", e);
        return { firebaseApp: null, auth: null, firestore: null };
      }
    }
    console.warn("Firebase config is missing or incomplete.");
    return { firebaseApp: null, auth: null, firestore: null };
  }, []);

  return (
    <FirebaseClientContext.Provider value={firebaseServices}>
      {children}
    </FirebaseClientContext.Provider>
  );
};


// Hook to access Firebase services instances
const useFirebaseServices = () => {
  const context = useContext(FirebaseClientContext);
  if (context === undefined) {
    throw new Error('useFirebaseServices must be used within a FirebaseProvider.');
  }
  if (!context.firebaseApp || !context.auth || !context.firestore) {
    throw new Error('Firebase services not available. Check FirebaseProvider setup.');
  }
  return context as Required<FirebaseClientContextState>;
};

export const useFirebaseApp = () => useFirebaseServices().firebaseApp;
export const useFirestore = () => useFirebaseServices().firestore;
export const useAuth = () => useFirebaseServices().auth;
export const googleProvider = new GoogleAuthProvider();


// User-specific context
interface UserContextState {
  user: User | null;
  loading: boolean;
}

const UserContext = createContext<UserContextState | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const auth = useAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [auth]);

    return (
        <UserContext.Provider value={{ user, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
