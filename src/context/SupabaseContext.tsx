import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

interface SupabaseContextType {
  user: User | null;
  isAuthReady: boolean;
  signIn: (email?: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setIsAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthReady(true);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email?: string, password?: string) => {
    if (!supabase) {
      console.warn('Supabase is not configured. Authentication is disabled.');
      return;
    }
    if (email && password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      console.warn('Supabase is not configured. Authentication is disabled.');
      return;
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOutUser = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <SupabaseContext.Provider value={{ user, isAuthReady, signIn, signUp, signOut: signOutUser }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) throw new Error('useSupabase must be used within a SupabaseProvider');
  return context;
};
