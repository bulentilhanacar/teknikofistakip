
'use client';

// This file serves as an entrypoint for all Firebase-related functionality.
// It re-exports modules for easy access throughout the application.

export { 
    FirebaseProvider, 
    useFirebaseApp, 
    useFirestore,
    useAuth,
    useUser,
    googleProvider
} from './provider';

export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { FirestorePermissionError } from './errors';


import { useMemo as useMemoOriginal, DependencyList } from 'react';
type MemoFirebase <T> = T & {__memo?: boolean};
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemoOriginal(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}
