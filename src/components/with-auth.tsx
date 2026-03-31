'use client';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithAuth(props: P) {
    const { auth, user, loading } = useFirebase();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);

    const handleEmailLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError(null);
      
      // If user enters just 'admin', convert to 'admin@mydomain.com'
      const loginEmail = email.includes('@') ? email : `${email}@mydomain.com`;
      
      try {
        await signInWithEmailAndPassword(auth, loginEmail, password);
      } catch (error: any) {
        console.error('Email login error:', error);
        if (error.code === 'auth/operation-not-allowed') {
          setAuthError(`Email/Password login is not enabled in Firebase Console. Please enable it in the Authentication > Sign-in method tab.`);
        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          setAuthError('Invalid email/username or password.');
        } else {
          setAuthError(error.message);
        }
      }
    };

    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!user) {
      return (
        <div className="flex h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-grotesk">Farm Fresh Ledger</CardTitle>
              <CardDescription>
                Please sign in to manage your farm transactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email or Username</Label>
                  <Input 
                    id="email" 
                    type="text" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="admin"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required
                  />
                </div>
                {authError && <p className="text-xs text-destructive">{authError}</p>}
                <Button type="submit" className="w-full">Sign In</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
