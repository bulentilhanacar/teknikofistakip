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
  const [isUserLoading, setIsLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);
  const auth = useAuth();

  useEffect(() => {
    if (!auth) {
        // If auth is null, it means the provider is not ready yet.
        // We should remain in a loading state.
        setIsLoading(true);
        setUser(null);
        return;
    }
    
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setIsLoading(false);
        setUserError(null);
      },
      (error) => {
        console.error("Firebase Auth Error:", error);
        setUserError(error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return { user, isUserLoading, userError };
}
