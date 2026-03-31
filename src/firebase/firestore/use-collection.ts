'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../errors';
import { useFirebase } from '../provider';

export function useCollection<T = DocumentData>(q: Query<DocumentData> | null) {
  const { auth } = useFirebase();
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!q) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      setData(docs);
      setIsLoading(false);
    }, (err) => {
      const errInfo = handleFirestoreError(err, OperationType.LIST, q.toString(), auth);
      setError(new Error(errInfo.error));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [q, auth]);

  return { data, isLoading, error };
}
