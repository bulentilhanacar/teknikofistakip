// src/firebase/firestore/use-doc.tsx
'use client';
import {
  onSnapshot,
  type DocumentReference,
  type Unsubscribe,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';

export function useDoc<T>(docRef: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const unsubscribe: Unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data: T = {
            ...(snapshot.data() as T),
            id: snapshot.id,
          };
          setData(data);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
         if (err.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'get',
            });
            setError(permissionError);
            errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error('An unexpected error occurred in useDoc:', err);
            setError(err);
        }
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [docRef]);

  return { data, loading, error };
}
