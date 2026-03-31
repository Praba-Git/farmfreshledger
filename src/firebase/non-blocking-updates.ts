'use client';

import { updateDoc, DocumentReference, DocumentData } from 'firebase/firestore';

export async function updateDocNonBlocking(ref: DocumentReference<DocumentData>, data: any) {
  try {
    await updateDoc(ref, data);
  } catch (error) {
    console.error('Non-blocking update failed:', error);
  }
}
