"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase.auth.getSession();
      if (mounted) setUserId(data.session?.user.id ?? null);
      setLoading(false);
    };
    init();
    const { data: sub } = supabase?.auth.onAuthStateChange((_event: string, session: any) => {
      setUserId(session?.user.id ?? null);
    }) ?? { data: { subscription: { unsubscribe() {} } } };
    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    const res = await supabase.auth.signUp({ email, password });
    if (!res.error) {
      toast({
        title: 'Check your email',
        description: 'We sent you a confirmation link to complete sign up.',
      });
    }
    return res;
  };

  const signOut = async () => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    return supabase.auth.signOut();
  };

  return { userId, loading, signInWithEmail, signUpWithEmail, signOut };
}


