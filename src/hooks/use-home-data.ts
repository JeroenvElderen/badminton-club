
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';

export type Attendance = 'going' | 'maybe' | 'not-going';

type Profile = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type ClubSession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: string;
};

type Court = {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
};

type Match = {
  id: string;
  session_id: string;
  court_id: number | null;
  round_number: number;
  match_type: 'singles' | 'doubles';
  status: string;
  team_a_score: number;
  team_b_score: number;
  created_at: string;
};

type MatchPlayer = {
  match_id: string;
  player_id: string;
  team: 'A' | 'B';
  position: number;
};

export type HomeData = {
  profile: Profile | null;
  session: ClubSession | null;
  courts: Court[];
  matches: Match[];
  matchPlayers: MatchPlayer[];
  nextMatch: Match | null;
  attendance: Attendance | null;
  attendingCount: number;
  restingCount: number;
  currentRound: number;
};

const initialData: HomeData = {
  profile: null,
  session: null,
  courts: [],
  matches: [],
  matchPlayers: [],
  nextMatch: null,
  attendance: null,
  attendingCount: 0,
  restingCount: 0,
  currentRound: 0,
};

export function useHomeData(userId: string) {
  const [data, setData] = useState<HomeData>(initialData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef(true);
  const requestNumber = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++requestNumber.current;

    try {
      const now = new Date().toISOString();

      const [profileResult, sessionResult, courtsResult] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, display_name, avatar_url')
            .eq('id', userId)
            .maybeSingle(),

          supabase
            .from('club_sessions')
            .select('id, title, starts_at, ends_at, status')
            .in('status', ['scheduled', 'active'])
            .gt('ends_at', now)
            .order('starts_at', { ascending: true })
            .limit(1)
            .maybeSingle(),

          supabase
            .from('courts')
            .select('id, name, sort_order, is_active')
            .eq('is_active', true)
            .order('sort_order'),
        ]);

      for (const result of [
        profileResult,
        sessionResult,
        courtsResult,
      ]) {
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
          supabase
            .from('matches')
            .select(
              'id, session_id, court_id, round_number, match_type, status, team_a_score, team_b_score, created_at'
            )
            .eq('session_id', session.id)
            .neq('status', 'cancelled')
            .order('round_number')
            .order('created_at'),

          supabase
            .from('session_attendance')
            .select('player_id, status')
            .eq('session_id', session.id),
        ]);

        if (matchesResult.error) throw matchesResult.error;
        if (attendanceResult.error) throw attendanceResult.error;

        matches = (matchesResult.data ?? []) as Match[];

        const attendanceRows = attendanceResult.data ?? [];
        attendance =
          (attendanceRows.find(row => row.player_id === userId)
            ?.status as Attendance | undefined) ?? null;

        attendingCount = attendanceRows.filter(
          row => row.status === 'going'
        ).length;

        if (matches.length) {
          const matchIds = matches.map(match => match.id);

          const playersResult = await supabase
            .from('match_players')
            .select('match_id, player_id, team, position')
            .in('match_id', matchIds);

          if (playersResult.error) throw playersResult.error;

          matchPlayers = (playersResult.data ?? []) as MatchPlayer[];
        }
      }

      const assignedMatchIds = new Set(
        matchPlayers
          .filter(player => player.player_id === userId)
          .map(player => player.match_id)
      );

      const nextMatch =
        matches.find(
          match =>
            assignedMatchIds.has(match.id) &&
            match.status === 'in_progress'
        ) ??
        matches.find(
          match =>
            assignedMatchIds.has(match.id) &&
            match.status === 'scheduled'
        ) ??
        null;

      const liveMatches = matches.filter(
        match => match.status === 'in_progress'
      );

      const currentRound = liveMatches.length
        ? Math.max(...liveMatches.map(match => match.round_number))
        : matches.filter(match => match.status === 'scheduled').length
          ? Math.min(
              ...matches
                .filter(match => match.status === 'scheduled')
                .map(match => match.round_number)
            )
          : 0;

      const activePlayerIds = new Set(
        matchPlayers
          .filter(player =>
            liveMatches.some(match => match.id === player.match_id)
          )
          .map(player => player.player_id)
      );

      const nextData: HomeData = {
        profile: profileResult.data as Profile | null,
        session,
        courts,
        matches,
        matchPlayers,
        nextMatch,
        attendance,
        attendingCount,
        restingCount: Math.max(0, attendingCount - activePlayerIds.size),
        currentRound,
      };

      if (active.current && request === requestNumber.current) {
        setData(nextData);
        setError(null);
      }
    } catch (err) {
      if (active.current && request === requestNumber.current) {
        setError(
          err instanceof Error ? err.message : 'Unable to load club data'
        );
      }
    } finally {
      if (active.current && request === requestNumber.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    active.current = true;
    void refresh();

    const tables = [
      'profiles',
      'club_sessions',
      'session_attendance',
      'courts',
      'matches',
      'match_players',
    ];

    let channel: RealtimeChannel = supabase.channel(
      `riverside-home-${userId}`
    );

    for (const table of tables) {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        () => {
          void refresh();
        }
      );
    }

    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        void refresh();
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Riverside Realtime:', status);
      }
    });

    return () => {
      active.current = false;
      requestNumber.current += 1;
      void supabase.removeChannel(channel);
    };
  }, [refresh, userId]);

  const saveAttendance = useCallback(
    async (status: Attendance) => {
      if (!data.session) {
        throw new Error('No upcoming club session');
      }

      setSaving(true);

      try {
        const { error: saveError } = await supabase
          .from('session_attendance')
          .upsert(
            {
              session_id: data.session.id,
              player_id: userId,
              status,
            },
            { onConflict: 'session_id,player_id' }
          );

        if (saveError) throw saveError;

        await refresh();
      } finally {
        setSaving(false);
      }
    },
    [data.session, refresh, userId]
  );

  return {
    ...data,
    loading,
    saving,
    error,
    refresh,
    saveAttendance,
  };
}
