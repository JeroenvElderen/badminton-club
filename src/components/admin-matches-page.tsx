import { useHomeData } from '@/hooks/use-home-data';
import { supabase } from '@/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

type Filter = 'Live Now' | 'Upcoming' | 'Completed';
type Match = { id: string; session_id: string; court_id: string | null; round_number: number | null; match_type: string | null; status: string; team_a_score: number | null; team_b_score: number | null; created_at?: string };
type Member = { match_id: string; player_id: string; team: string };
type Profile = { id: string; full_name: string | null; display_name: string | null };
type Court = { id: string; name: string | null; sort_order: number | null };
const C = { bg: '#031B16', card: '#06251E', tile: '#0A3028', border: '#145744', green: '#00D995', white: '#F6FBF8', muted: '#A6B8B1', amber: '#FFB53F' };

export default function AdminMatchesPage({ userId }: { userId: string }) {
  const home = useHomeData(userId);
  const [filter, setFilter] = useState<Filter>('Live Now');
  const [matches, setMatches] = useState<Match[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const sessionId = home.session?.id;

  const load = useCallback(async () => {
    if (!sessionId) { setMatches([]); setMembers([]); setLoading(false); setRefreshing(false); return; }
    try {
      setError(null);
      const [matchResult, courtResult] = await Promise.all([
        supabase.from('matches').select('id,session_id,court_id,round_number,match_type,status,team_a_score,team_b_score,created_at').eq('session_id', sessionId).order('round_number', { ascending: true }),
        supabase.from('courts').select('id,name,sort_order'),
      ]);
      if (matchResult.error) throw matchResult.error;
      if (courtResult.error) throw courtResult.error;
      const matchRows = (matchResult.data ?? []) as Match[];
      setMatches(matchRows);
      setCourts((courtResult.data ?? []) as Court[]);
      if (!matchRows.length) { setMembers([]); setProfiles([]); return; }
      const ids = matchRows.map(m => m.id);
      const playerResult = await supabase.from('match_players').select('match_id,player_id,team').in('match_id', ids);
      if (playerResult.error) throw playerResult.error;
      const players = (playerResult.data ?? []) as Member[];
      setMembers(players);
      const profileIds = [...new Set(players.map(p => p.player_id))];
      if (profileIds.length) {
        const profileResult = await supabase.from('profiles').select('id,full_name,display_name').in('id', profileIds);
        if (profileResult.error) throw profileResult.error;
        setProfiles((profileResult.data ?? []) as Profile[]);
      } else setProfiles([]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load matches.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [sessionId]);

  useEffect(() => { setLoading(true); void load(); }, [load]);
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase.channel(`admin-matches-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `session_id=eq.${sessionId}` }, () => { void load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_players' }, () => { void load(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [sessionId, load]);

  const live = matches.filter(m => m.status === 'in_progress');
  const upcoming = matches.filter(m => ['scheduled', 'pending', 'upcoming'].includes(m.status));
  const completed = matches.filter(m => m.status === 'completed');
  const visible = filter === 'Live Now' ? live : filter === 'Upcoming' ? upcoming : completed;
  const round = Math.max(0, ...live.map(m => m.round_number ?? 0), home.currentRound ?? 0);
  const maxRound = Math.max(0, ...matches.map(m => m.round_number ?? 0));
  const profileById = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);
  const courtById = useMemo(() => new Map(courts.map(c => [c.id, c])), [courts]);
  const names = (matchId: string, team: string) => members.filter(p => p.match_id === matchId && p.team.toUpperCase() === team).map(p => {
    const profile = profileById.get(p.player_id);
    return profile?.display_name?.trim() || profile?.full_name?.trim().split(' ')[0] || 'Player';
  }).join(' / ') || 'Players pending';

  const changeScore = async (match: Match, team: 'A' | 'B', delta: number) => {
    if (busy || match.status !== 'in_progress') return;
    const column = team === 'A' ? 'team_a_score' : 'team_b_score';
    // Parenthesize the score before applying delta; a null score starts at zero.
    const nextScore = Math.max(0, ((team === 'A' ? match.team_a_score : match.team_b_score) ?? 0) + delta);
    if (nextScore === (team === 'A' ? match.team_a_score : match.team_b_score)) return;
    setBusy(match.id);
    try {
      const { error: updateError } = await supabase.from('matches').update({ [column]: nextScore }).eq('id', match.id).eq('session_id', sessionId!);
      if (updateError) throw updateError;
      setMatches(prev => prev.map(m => m.id === match.id ? { ...m, [column]: nextScore } : m));
    } catch (e) { Alert.alert('Score not updated', e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(null); }
  };

  const finishMatch = (match: Match) => Alert.alert('Finish match?', 'This will mark the match as completed.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Finish Match', onPress: async () => {
      setBusy(match.id);
      const { error: updateError } = await supabase.from('matches').update({ status: 'completed' }).eq('id', match.id).eq('session_id', sessionId!);
      setBusy(null);
      if (updateError) Alert.alert('Could not finish match', updateError.message);
      else void load();
    } },
  ]);

  const placeholder = (feature: string) => Alert.alert(feature, 'Round generation and activation will be connected to the club’s scheduling rules in the next step. No matches have been changed.');

  return <View style={s.root}>
    <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={C.green} onRefresh={() => { setRefreshing(true); void load(); }} />}>
      <View style={s.filters}>{(['Live Now', 'Upcoming', 'Completed'] as Filter[]).map(item => {
        const count = item === 'Live Now' ? live.length : item === 'Upcoming' ? upcoming.length : completed.length;
        return <Pressable key={item} style={[s.filter, filter === item && s.filterActive]} onPress={() => setFilter(item)}>
          {item === 'Live Now' && <View style={[s.dot, { backgroundColor: filter === item ? C.green : C.muted }]} />}
          <Text style={[s.filterText, filter === item && s.filterTextActive]}>{item}</Text>
          <View style={[s.count, filter === item && s.countActive]}><Text style={s.countText}>{count}</Text></View>
        </Pressable>;
      })}</View>
      <View style={s.roundPanel}>
        <View style={s.roundHeading}><Text style={s.roundTitle}>Round {round || '–'} of {maxRound || '–'}</Text><Text style={s.muted}>{matches.length} matches</Text></View>
        <View style={s.track}><View style={[s.fill, { width: `${maxRound ? Math.min(100, round / maxRound * 100) : 0}%` }]} /></View>
      </View>
      {loading && <ActivityIndicator size="large" color={C.green} style={{ marginTop: 30 }} />}
      {!!error && <Pressable style={s.card} onPress={() => void load()}><Text style={s.error}>{error}</Text><Text style={s.muted}>Tap to retry</Text></Pressable>}
      {!loading && !error && !sessionId && <View style={s.card}><Text style={s.cardTitle}>No selected club night</Text><Text style={s.muted}>Create or select a club night before managing matches.</Text></View>}
      {!loading && !error && !!sessionId && !visible.length && <View style={s.card}><Text style={s.cardTitle}>No {filter.toLowerCase()} matches</Text><Text style={s.muted}>Matches will appear here when they are scheduled for this club night.</Text></View>}
      {visible.map(match => {
        const isLive = match.status === 'in_progress';
        const isFinished = match.status === 'completed';
        const court = match.court_id ? courtById.get(match.court_id) : undefined;
        return <View key={match.id} style={s.card}>
          <View style={s.cardTop}>
            <View style={s.courtHeading}><View style={[s.dot, { backgroundColor: isFinished ? C.amber : isLive ? C.green : C.muted }]} /><Text style={s.cardTitle}>{court?.name || 'Court unassigned'}</Text></View>
            <View style={[s.pill, isFinished && s.finishedPill]}><Text style={[s.pillText, isFinished && { color: C.amber }]}>{isLive ? '● Live' : isFinished ? '✓ Finished' : 'Upcoming'}</Text></View>
            <Pressable onPress={() => isLive ? finishMatch(match) : Alert.alert('Match details', `Round ${match.round_number ?? '–'} · ${match.match_type || 'Doubles'}\nStatus: ${match.status}`)} hitSlop={12}><Ionicons name="ellipsis-vertical" size={20} color={C.white} /></Pressable>
          </View>
          <View style={s.teams}>
            <View style={s.team}><Text style={s.teamName} numberOfLines={2}>{names(match.id, 'A')}</Text></View>
            <Text style={s.vs}>vs</Text>
            <View style={s.team}><Text style={s.teamName} numberOfLines={2}>{names(match.id, 'B')}</Text></View>
            <Text style={s.score}>{match.team_a_score ?? 0} - {match.team_b_score ?? 0}</Text>
          </View>
          <Text style={s.meta}>Round {match.round_number ?? '–'} · {match.match_type || 'Doubles'}</Text>
          {isLive && <View style={s.scoreActions}>
            <Pressable disabled={busy === match.id} style={s.scoreButton} onPress={() => void changeScore(match, 'A', -1)}><Ionicons name="remove" size={20} color={C.white} /></Pressable>
            <Pressable disabled={busy === match.id} style={s.scoreMain} onPress={() => Alert.alert('Update score', 'Choose a team to award one point.', [
              { text: `+1 ${names(match.id, 'A')}`, onPress: () => void changeScore(match, 'A', 1) },
              { text: `+1 ${names(match.id, 'B')}`, onPress: () => void changeScore(match, 'B', 1) },
              { text: 'Cancel', style: 'cancel' },
            ])}><Text style={s.scoreMainText}>{busy === match.id ? 'Saving…' : 'Update Score'}</Text></Pressable>
            <Pressable disabled={busy === match.id} style={s.scoreButton} onPress={() => void changeScore(match, 'B', 1)}><Ionicons name="add" size={20} color={C.white} /></Pressable>
          </View>}
          {isLive && <Text style={s.scoreHint}>− subtracts from Team A · + adds to Team B. Use Update Score for either team.</Text>}
        </View>;
      })}
      <View style={s.bottomActions}>
        <Pressable style={s.secondaryAction} onPress={() => placeholder('Generate Next Round')}><Ionicons name="shuffle-outline" size={22} color={C.white} /><Text style={s.bottomActionText}>Generate Next Round</Text></Pressable>
        <Pressable style={s.primaryAction} onPress={() => placeholder('Start Next Round')}><Ionicons name="play" size={22} color={C.white} /><Text style={s.bottomActionText}>Start Next Round</Text></Pressable>
      </View>
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg }, scroll: { flex: 1 }, content: { padding: 13, paddingBottom: 30, gap: 10 },
  filters: { flexDirection: 'row', borderRadius: 13, borderWidth: 1, borderColor: C.border, overflow: 'hidden', backgroundColor: '#051F19' },
  filter: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, paddingHorizontal: 3 },
  filterActive: { backgroundColor: '#007D60', borderRadius: 12, borderWidth: 1, borderColor: C.green },
  filterText: { color: C.white, fontSize: 12, fontWeight: '600' }, filterTextActive: { fontWeight: '800' },
  count: { backgroundColor: '#29453D', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 }, countActive: { backgroundColor: '#05B78D' }, countText: { color: C.white, fontSize: 11, fontWeight: '800' },
  dot: { width: 11, height: 11, borderRadius: 6 }, roundPanel: { backgroundColor: C.card, borderRadius: 15, borderWidth: 1, borderColor: C.border, padding: 14, gap: 12 },
  roundHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, roundTitle: { color: C.white, fontSize: 20, fontWeight: '800' }, muted: { color: C.muted, fontSize: 12 },
  track: { height: 10, borderRadius: 6, backgroundColor: '#25483E', overflow: 'hidden' }, fill: { height: '100%', backgroundColor: C.green, borderRadius: 6 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 15, padding: 13, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, courtHeading: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }, cardTitle: { color: C.white, fontSize: 17, fontWeight: '800' },
  pill: { backgroundColor: '#064735', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 }, pillText: { color: C.green, fontSize: 12, fontWeight: '700' }, finishedPill: { backgroundColor: '#40351B' },
  teams: { flexDirection: 'row', alignItems: 'center', gap: 7 }, team: { flex: 1, minWidth: 0, alignItems: 'center' }, teamName: { color: C.white, fontSize: 13, textAlign: 'center' }, vs: { color: C.muted, fontSize: 12 },
  score: { color: C.white, fontSize: 22, fontWeight: '900', minWidth: 73, textAlign: 'right' }, meta: { color: C.muted, fontSize: 11 },
  scoreActions: { flexDirection: 'row', alignSelf: 'center', gap: 10, alignItems: 'center' }, scoreButton: { width: 44, height: 38, borderRadius: 10, borderWidth: 1, borderColor: C.green, alignItems: 'center', justifyContent: 'center', backgroundColor: C.tile },
  scoreMain: { minWidth: 135, height: 38, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: C.green, alignItems: 'center', justifyContent: 'center' }, scoreMainText: { color: C.white, fontWeight: '700', fontSize: 13 },
  scoreHint: { color: C.muted, fontSize: 10, textAlign: 'center' }, error: { color: '#FF9999', fontSize: 13 },
  bottomActions: { flexDirection: 'row', gap: 10, marginTop: 4 }, secondaryAction: { flex: 1, minHeight: 60, borderWidth: 1, borderColor: C.muted, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 7 },
  primaryAction: { flex: 1, minHeight: 60, borderRadius: 13, backgroundColor: '#00B989', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 7 }, bottomActionText: { color: C.white, fontWeight: '700', fontSize: 12, textAlign: 'center' },
});
