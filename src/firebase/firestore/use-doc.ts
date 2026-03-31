'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, DocumentReference, DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../errors';
import { useFirebase } from '../provider';

export function useDoc<T = DocumentData>(ref: DocumentReference<DocumentData> | null) {
  const { auth } = useFirebase();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = onSnapshot(ref, (snapshot: DocumentSnapshot<DocumentData>) => {
      if (snapshot.exists()) {
        setData({ id: snapshot.id, ...snapshot.data() } as T);
      } else {
        setData(null);
      }
      setIsLoading(false);
    }, (err) => {
      const errInfo = handleFirestoreError(err, OperationType.GET, ref.path, auth);
      setError(new Error(errInfo.error));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [ref, auth]);

  return { data, isLoading, error };
}
