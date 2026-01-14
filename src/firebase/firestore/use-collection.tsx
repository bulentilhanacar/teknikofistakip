// src/firebase/firestore/use-collection.tsx
'use client';
import {
  onSnapshot,
  type CollectionReference,
  type Query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * A hook for subscribing to a Firestore collection.
 * @param query The Firestore query to subscribe to.
 * @returns An object containing the data, loading state, and error.
 */
export function useCollection<T>(query: Query | CollectionReference | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const data: T[] = snapshot.docs.map((doc) => {
          const docData = doc.data() as T;
          return {
            ...docData,
            id: doc.id,
          };
        });
        setData(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        // Intercept permission errors to throw a more specific, actionable error.
        if (err.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
              path: 'path' in query ? query.path : 'unknown',
              operation: 'list',
            });
            setError(permissionError);
            errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error('An unexpected error occurred in useCollection:', err);
            setError(err);
        }
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
