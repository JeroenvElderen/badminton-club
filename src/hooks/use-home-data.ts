import { fetchPlayerProfile, playerProfileKey } from '@/lib/player-profile-query';
import { supabase } from '@/lib/supabase';
import type { QueryClient } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

export type Attendance = 'going' | 'maybe' | 'not-going';

type Profile = { id: string; full_name: string | null; display_name: string | null; avatar_url: string | null };
type ClubSession = { id: string; title: string; starts_at: string; ends_at: string; status: string };
type Court = { id: number; name: string; sort_order: number; is_active: boolean };
type Match = {
  id: string; session_id: string; court_id: number | null; round_number: number;
  match_type: 'singles' | 'doubles'; status: string; team_a_score: number;
  team_b_score: number; created_at: string;
};
type MatchPlayer = { match_id: string; player_id: string; team: 'A' | 'B'; position: number };

export type HomeData = {
  profile: Profile | null; session: ClubSession | null; courts: Court[];
  matches: Match[]; matchPlayers: MatchPlayer[]; nextMatch: Match | null;
  attendance: Attendance | null; attendingCount: number; restingCount: number;
  currentRound: number;
};

const initialData: HomeData = {
  profile: null, session: null, courts: [], matches: [], matchPlayers: [],
  nextMatch: null, attendance: null, attendingCount: 0, restingCount: 0, currentRound: 0,
};

async function fetchHomeData(userId: string, queryClient: QueryClient): Promise<HomeData> {
  const now = new Date().toISOString();
  const [profileResult, sessionResult, courtsResult] = await Promise.all([
    queryClient.fetchQuery({ queryKey: playerProfileKey(userId), queryFn: () => fetchPlayerProfile(userId), staleTime: 60_000 }),
    supabase.from('club_sessions').select('id, title, starts_at, ends_at, status')
      .in('status', ['scheduled', 'active']).gt('ends_at', now)
      .order('starts_at', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('courts').select('id, name, sort_order, is_active')
      .eq('is_active', true).order('sort_order'),
  ]);
  for (const result of [sessionResult, courtsResult]) {
    if (result.error) throw result.error;
  }

  const session = sessionResult.data as ClubSession | null;
  const courts = (courtsResult.data ?? []) as Court[];
  let matches: Match[] = [];
  let matchPlayers: MatchPlayer[] = [];
  let attendance: Attendance | null = null;
  let attendingCount = 0;

  if (session) {
    const [matchesResult, attendanceResult] = await Promise.all([
      supabase.from('matches')
        .select('id, session_id, court_id, round_number, match_type, status, team_a_score, team_b_score, created_at')
        .eq('session_id', session.id).neq('status', 'cancelled')
        .order('round_number').order('created_at'),
      supabase.from('session_attendance').select('player_id, status').eq('session_id', session.id),
    ]);
    if (matchesResult.error) throw matchesResult.error;
    if (attendanceResult.error) throw attendanceResult.error;

    matches = (matchesResult.data ?? []) as Match[];
    const attendanceRows = attendanceResult.data ?? [];
    attendance = (attendanceRows.find(row => row.player_id === userId)?.status as Attendance | undefined) ?? null;
    attendingCount = attendanceRows.filter(row => row.status === 'going').length;

    if (matches.length) {
      const playersResult = await supabase.from('match_players')
        .select('match_id, player_id, team, position')
        .in('match_id', matches.map(match => match.id));
      if (playersResult.error) throw playersResult.error;
      matchPlayers = (playersResult.data ?? []) as MatchPlayer[];
    }
  }

  const assignedMatchIds = new Set(matchPlayers.filter(player => player.player_id === userId).map(player => player.match_id));
  const nextMatch = matches.find(match => assignedMatchIds.has(match.id) && match.status === 'in_progress')
    ?? matches.find(match => assignedMatchIds.has(match.id) && match.status === 'scheduled') ?? null;
  const liveMatches = matches.filter(match => match.status === 'in_progress');
  const scheduledMatches = matches.filter(match => match.status === 'scheduled');
  const currentRound = liveMatches.length
    ? Math.max(...liveMatches.map(match => match.round_number))
    : scheduledMatches.length ? Math.min(...scheduledMatches.map(match => match.round_number)) : 0;
  const liveMatchIds = new Set(liveMatches.map(match => match.id));
  const activePlayerIds = new Set(matchPlayers.filter(player => liveMatchIds.has(player.match_id)).map(player => player.player_id));

  return {
    profile: profileResult as Profile | null, session, courts, matches, matchPlayers,
    nextMatch, attendance, attendingCount,
    restingCount: Math.max(0, attendingCount - activePlayerIds.size), currentRound,
  };
}

export function useHomeData(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['riverside', 'home', userId] as const;
  const [saving, setSaving] = useState(false);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchHomeData(userId, queryClient),
    enabled: Boolean(userId),
    staleTime: 60_000,
    placeholderData: previousData => previousData,
  });

  const refresh = useCallback(async () => {
    if (!userId) return;
    await queryClient.invalidateQueries({ queryKey: playerProfileKey(userId), exact: true, refetchType: 'active' });
    await queryClient.invalidateQueries({ queryKey, exact: true, refetchType: 'active' });
  }, [queryClient, userId]);

  const sessionId = query.data?.session?.id;
  const matchIds = query.data?.matches.map(match => match.id) ?? [];
  // Primitive dependency avoids rebuilding the subscription for identical match lists.
  const matchIdsKey = matchIds.join('|');

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`riverside-home-${userId}-${Math.random().toString(36).slice(2)}`);
    const invalidate = () => { void queryClient.invalidateQueries({ queryKey, exact: true }); };

    // Only the signed-in user's profile is relevant to Home.
    channel.on('postgres_changes', {
      event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}`,
    }, () => {
      void queryClient.invalidateQueries({ queryKey: playerProfileKey(userId), exact: true });
      invalidate();
    });

    // A newly scheduled session or a changed active session can change Home's next session.
    channel.on('postgres_changes', {
      event: '*', schema: 'public', table: 'club_sessions',
    }, invalidate);

    // Court changes are infrequent, but affect the court overview.
    channel.on('postgres_changes', {
      event: '*', schema: 'public', table: 'courts',
    }, invalidate);

    if (sessionId) {
      channel.on('postgres_changes', {
        event: '*', schema: 'public', table: 'session_attendance', filter: `session_id=eq.${sessionId}`,
      }, invalidate);
      channel.on('postgres_changes', {
        event: '*', schema: 'public', table: 'matches', filter: `session_id=eq.${sessionId}`,
      }, invalidate);

      // Supabase Realtime filters do not support filtering by a list of match IDs.
      // Ignore events for matches not shown in Home. DELETE events can have only
      // their primary key; checking old.match_id handles those when provided.
      const relevantMatchIds = new Set(matchIdsKey ? matchIdsKey.split('|') : []);
      channel.on('postgres_changes', {
        event: '*', schema: 'public', table: 'match_players',
      }, payload => {
        const next = payload.new as { match_id?: string } | undefined;
        const previous = payload.old as { match_id?: string } | undefined;
        if ((next?.match_id && relevantMatchIds.has(next.match_id)) ||
            (previous?.match_id && relevantMatchIds.has(previous.match_id))) {
          invalidate();
        }
      });
    }

    channel.subscribe(status => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Riverside Home Realtime:', status);
      }
    });
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient, userId, sessionId, matchIdsKey]);

  const saveAttendance = useCallback(async (status: Attendance) => {
    const session = query.data?.session;
    if (!session) throw new Error('No upcoming club session');
    setSaving(true);
    try {
      const { error } = await supabase.from('session_attendance').upsert({
        session_id: session.id, player_id: userId, status,
      }, { onConflict: 'session_id,player_id' });
      if (error) throw error;
      await refresh();
    } finally {
      setSaving(false);
    }
  }, [query.data?.session, refresh, userId]);

  return {
    ...(query.data ?? initialData),
    loading: query.isPending,
    saving,
    error: query.error instanceof Error ? query.error.message : null,
    refresh,
    saveAttendance,
  };
}
