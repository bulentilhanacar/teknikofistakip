// src/firebase/firestore/use-doc.tsx
'use client';
import {
  onSnapshot,
  doc,
  type DocumentReference,
  type Unsubscribe,
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';

export function useDoc<T>(docRef: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const docRefRef = useRef(docRef);

  useEffect(() => {
    if (!docRef) {
      setLoading(false);
      return;
    }
    const unsubscribe: Unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data: T = {
            ...(snapshot.data() as T),
            id: snapshot.id,
          };
          setData(data);
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [docRef]);

  return { data, loading, error };
}
