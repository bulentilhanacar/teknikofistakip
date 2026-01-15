'use client';

// This file serves as an entrypoint for all Firebase-related functionality.
// It re-exports modules for easy access throughout the application.

export { 
    FirebaseProvider, 
    useFirebase, 
    useAuth, 
    useFirestore, 
    useFirebaseApp, 
    useUser,
    useMemoFirebase,
    googleProvider
} from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';