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
  if (!auth) {
    throw new Error('useAuth must be used within a FirebaseProvider.');
  }
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
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return { user, loading, error };
}
