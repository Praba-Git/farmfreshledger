'use client';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, auth: any) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || 'anonymous',
      email: auth?.currentUser?.email || 'none',
      emailVerified: auth?.currentUser?.emailVerified || false,
    },
    operationType,
    path
  };
  
  // Log as a string to prevent Next.js from showing it as an empty object in the error overlay
  // We use a safe stringify to avoid circular structure errors
  try {
    console.error(`Firestore Error Details: ${JSON.stringify(errInfo, null, 2)}`);
  } catch (e) {
    console.error('Firestore Error Details (safe):', errInfo.error, errInfo.operationType, errInfo.path);
  }
  
  return errInfo;
}
