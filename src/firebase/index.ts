'use client';

export { 
    FirebaseProvider, 
    useFirebase, 
    useAuth, 
    useFirestore, 
    useFirebaseApp, 
    useUser,
    googleProvider
} from './provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export { FirestorePermissionError } from './errors';
export * from './error-emitter';
export { useMemo } from 'react';

import { useMemo as useMemoOriginal, DependencyList } from 'react';
type MemoFirebase <T> = T & {__memo?: boolean};
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemoOriginal(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}
