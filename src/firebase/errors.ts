// src/firebase/errors.ts
/**
 * Represents a detailed Firestore permission error.
 * This class is intended to be used in a development environment to provide
 * rich, contextual information about why a Firestore request was denied.
 */
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(
      context,
      null,
      2
    )}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to ensure the stack trace is captured correctly
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FirestorePermissionError);
    }
  }
}
