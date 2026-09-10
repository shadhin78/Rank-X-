import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { firebaseAuth } from '@/src/lib/firebase';

export interface FirebaseAuthHookResult {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to subscribe to Firebase Auth state updates
 */
export function useFirebaseAuth(): FirebaseAuthHookResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(
        firebaseAuth,
        (firebaseUser) => {
          setUser(firebaseUser);
          setLoading(false);
        },
        (authError) => {
          console.error('[useFirebaseAuth error]:', authError);
          setError(authError);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('[useFirebaseAuth catch]:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, []);

  return { user, loading, error };
}
