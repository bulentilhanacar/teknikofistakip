
'use client';

// This file serves as an entrypoint for all Firebase-related functionality.
// It re-exports modules for easy access throughout the application.

export { 
    FirebaseProvider, 
    useFirebase, 
    useAuth, 
    useFirestore, 
    useFirebaseApp,
} from './provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { FirestorePermissionError } from './errors';
export { useMemo } from 'react';

import { useMemo as useMemoOriginal, DependencyList } from 'react';
type MemoFirebase <T> = T & {__memo?: boolean};
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemoOriginal(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}
