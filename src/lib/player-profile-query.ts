import { supabase } from '@/lib/supabase';

export type PlayerProfile = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export const playerProfileKey = (userId: string) =>
  ['riverside', 'player-profile', userId] as const;

export async function fetchPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as PlayerProfile | null;
}
