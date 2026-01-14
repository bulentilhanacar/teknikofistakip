// src/firebase/firestore/use-collection.tsx
'use client';
import {
  collection,
  onSnapshot,
  query,
  where,
  type CollectionReference,
  type Query,
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';

/**
 * A hook for subscribing to a Firestore collection.
 * @param query The Firestore query to subscribe to.
 * @returns An object containing the data, loading state, and error.
 */
export function useCollection<T>(query: Query | CollectionReference | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryRef = useRef(query);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }
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
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
