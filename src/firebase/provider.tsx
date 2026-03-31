'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { initializeFirebase } from './index';

interface FirebaseContextType {
  auth: any;
  firestore: Firestore;
  user: User | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const sdks = useMemo(() => initializeFirebase(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(sdks.auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [sdks.auth]);

  const value = useMemo(() => ({
    auth: sdks.auth,
    firestore: sdks.firestore,
    user,
    loading
  }), [sdks, user, loading]);

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useUser() {
  const { user, loading } = useFirebase();
  const [claims, setClaims] = useState<any>(null);

  useEffect(() => {
    if (user) {
      user.getIdTokenResult().then((result) => {
        setClaims(result.claims);
      });
    } else {
      setClaims(null);
    }
  }, [user]);

  return { user, loading, claims };
}
