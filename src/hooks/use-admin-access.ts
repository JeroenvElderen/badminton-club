import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export function useAdminAccess(userId: string | null) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsAdmin(false);
    setError(null);
    if (!userId) {
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    void supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!active) return;
        setIsAdmin(!queryError && !!data);
        setError(queryError?.message ?? null);
        setLoading(false);
      });
    return () => { active = false; };
  }, [userId]);

  return { isAdmin, loading, error };
}
