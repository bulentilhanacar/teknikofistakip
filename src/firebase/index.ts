// src/firebase/index.ts
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useUser, useAuth } from './auth/use-user';
import {
  FirebaseProvider,
  useFirebaseApp,
  useFirestore,
} from './provider';
import { FirebaseClientProvider } from './client-provider';
import { errorEmitter } from './error-emitter';

export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
} {
  const firebaseApp = initializeApp(firebaseConfig);
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  return { firebaseApp, firestore, auth };
}

export {
  useCollection,
  useDoc,
  useUser,
  useAuth,
  useFirebaseApp,
  useFirestore,
  FirebaseProvider,
  FirebaseClientProvider,
  errorEmitter,
};
