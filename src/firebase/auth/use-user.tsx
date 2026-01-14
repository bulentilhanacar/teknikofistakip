// src/firebase/auth/use-user.tsx
'use client';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useFirebase } from '../provider';

/**
 * A hook to access the Firebase Auth instance.
 * @returns The Firebase Auth instance.
 */
export function useAuth() {
  const { auth } = useFirebase();
   // The 'auth/configuration-not-found' error is thrown here if not configured.
   // We will not throw an error here, but let the onAuthStateChanged handle it.
  return auth;
}

/**
 * A hook to get the current user.
 * @returns An object containing the user, loading state, and error.
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const auth = useAuth();

  useEffect(() => {
    if (!auth) {
        // If auth is null, it means the provider is not ready.
        // We shouldn't treat this as an error, but as a loading state.
        setLoading(true);
        return;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Firebase Auth Error:", error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return { user, loading, error };
}
