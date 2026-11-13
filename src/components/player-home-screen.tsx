import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import type { Attendance, HomeData } from '@/hooks/use-home-data';
import { supabase } from '@/lib/supabase';
import type { AppTheme } from '@/lib/themes';
import { useAppTheme } from '@/providers/theme-provider';

type HomeState = HomeData & {
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

type Props = {
  home: HomeState;
  onAttendanceChange: (value: Attendance) => void;
  onOpenMatches: () => void;
};

const ATTENDANCE_OPTIONS: { value: Attendance; label: string }[] = [
  { value: 'going', label: 'Going' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'not-going', label: 'Can’t make it' },
];

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('en-IE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export default function PlayerHomeScreen({
  home,
  onAttendanceChange,
  onOpenMatches,
}: Props) {
  const { theme } = useAppTheme();
  const session = home.session;
  const nextMatch = home.nextMatch;

  const matchPlayers = nextMatch
    ? home.matchPlayers
        .filter(player => player.match_id === nextMatch.id)
        .sort((a, b) => a.position - b.position)
    : [];
  const profileIds = [...new Set(matchPlayers.map(player => player.player_id))];
  const profileIdsKey = [...profileIds].sort().join('|');

  const playerProfiles = useQuery({
    queryKey: ['riverside', 'home-match-profiles', profileIdsKey],
    enabled: profileIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, display_name')
        .in('id', profileIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const profilesById = new Map(
    (playerProfiles.data ?? []).map(profile => [profile.id, profile]),
  );

  const teamLabel = (team: 'A' | 'B') => {
    const players = matchPlayers.filter(player => player.team === team);
    if (!players.length) return 'Players not assigned';

    return players
      .map(player => {
        if (player.player_id === home.profile?.id) return 'You';
        const profile = profilesById.get(player.player_id);
        return (
          profile?.display_name?.trim() ||
          profile?.full_name?.trim().split(' ')[0] ||
          'Club player'
        );
      })
      .join(' & ');
  };

  const sessionDate = session
    ? new Date(session.starts_at).toLocaleDateString('en-IE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : '';

  const sessionCard = (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.cardHeading}>
        <Text style={[styles.eyebrow, { color: theme.accent }]}>
          {session?.status === 'active' ? 'CLUB NIGHT LIVE' : 'NEXT CLUB NIGHT'}
        </Text>
        {session?.status === 'active' ? (
          <View
            style={[
              styles.livePill,
              { backgroundColor: theme.tile, borderColor: theme.border },
            ]}
          >
            <View style={[styles.liveDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.liveText, { color: theme.accent }]}>Live</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.cardTitle, { color: theme.text }]}>
        {session?.title ?? 'No club night scheduled'}
      </Text>

      {session ? (
        <>
          <Text style={[styles.muted, { color: theme.muted }]}>
            {sessionDate} · {formatTime(session.starts_at)}–{formatTime(session.ends_at)}
          </Text>

          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            Your attendance
          </Text>
          <View style={styles.attendanceRow}>
            {ATTENDANCE_OPTIONS.map(option => {
              const selected = home.attendance === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={'Set attendance to ' + option.label}
                  accessibilityState={{ selected, disabled: home.saving }}
                  disabled={home.saving}
                  onPress={() => onAttendanceChange(option.value)}
                  style={[
                    styles.attendanceButton,
                    {
                      backgroundColor: selected ? theme.tile : theme.background,
                      borderColor: selected ? theme.accent : theme.border,
                    },
                    home.saving && styles.disabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.attendanceText,
                      { color: selected ? theme.accent : theme.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.muted, { color: theme.muted }]}>
            {home.saving
              ? 'Saving your response…'
              : home.attendingCount + (home.attendingCount === 1
                  ? ' player going'
                  : ' players going')}
          </Text>
        </>
      ) : (
        <Text style={[styles.muted, { color: theme.muted }]}>
          Check back later for the next session.
        </Text>
      )}
    </View>
  );

  const matchCard = (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.eyebrow, { color: theme.accent }]}>
        {nextMatch?.status === 'in_progress' ? 'PLAYING NOW' : 'YOUR NEXT MATCH'}
      </Text>

      {nextMatch ? (
        <>
          <Text style={[styles.matchMeta, { color: theme.muted }]}>
            Round {nextMatch.round_number} ·{' '}
            {home.courts.find(court => court.id === nextMatch.court_id)?.name ??
              'Court pending'}{' '}
            · {nextMatch.match_type === 'doubles' ? 'Doubles' : 'Singles'}
          </Text>

          <View
            style={[
              styles.teamBox,
              { backgroundColor: theme.tile, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.team, { color: theme.text }]}>
              {teamLabel('A')}
            </Text>
            <Text style={[styles.versus, { color: theme.accent }]}>VS</Text>
            <Text style={[styles.team, { color: theme.text }]}>
              {teamLabel('B')}
            </Text>
            {nextMatch.status === 'in_progress' ? (
              <Text style={[styles.score, { color: theme.text }]}>
                {nextMatch.team_a_score} – {nextMatch.team_b_score}
              </Text>
            ) : null}
          </View>
        </>
      ) : (
        <Text style={[styles.muted, { color: theme.muted }]}>
          Your match will appear here when it’s assigned.
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={onOpenMatches}
        style={[styles.openButton, { backgroundColor: theme.accent }]}
      >
        <Text style={[styles.openButtonText, { color: theme.background }]}>
          View matches
        </Text>
        <Ionicons name="arrow-forward" size={18} color={theme.background} />
      </Pressable>
    </View>
  );

  const activeMatchCount = home.matches.filter(
    match => match.status === 'in_progress',
  ).length;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {home.error ? (
        <Pressable
          onPress={() => void home.refresh()}
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.error, { color: '#FF9B9B' }]}>
            {home.error}
          </Text>
          <Text style={[styles.muted, { color: theme.muted }]}>
            Tap to retry
          </Text>
        </Pressable>
      ) : null}

      {nextMatch?.status === 'in_progress' ? matchCard : sessionCard}
      {nextMatch?.status === 'in_progress' ? sessionCard : matchCard}

      {session ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Club night overview
          </Text>
          <View style={styles.overviewRow}>
            <OverviewMetric
              value={String(home.attendingCount)}
              label="Going"
              theme={theme}
            />
            <OverviewMetric
              value={String(home.courts.length)}
              label="Courts"
              theme={theme}
            />
            <OverviewMetric
              value={String(activeMatchCount)}
              label="Live matches"
              theme={theme}
            />
          </View>
          {home.loading ? (
            <ActivityIndicator color={theme.accent} style={styles.loader} />
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

function OverviewMetric({
  value,
  label,
  theme,
}: {
  value: string;
  label: string;
  theme: AppTheme;
}) {
  return (
    <View
      style={[
        styles.metric,
        { backgroundColor: theme.tile, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 28, gap: 14 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  muted: { fontSize: 13, lineHeight: 19 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: { fontSize: 20, fontWeight: '800' },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 12, fontWeight: '800' },
  sectionLabel: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  attendanceRow: { flexDirection: 'row', gap: 7 },
  attendanceButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderRadius: 11,
    borderWidth: 1,
  },
  attendanceText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  disabled: { opacity: 0.55 },
  matchMeta: { fontSize: 13 },
  teamBox: {
    alignItems: 'center',
    gap: 9,
    padding: 14,
    borderRadius: 13,
    borderWidth: 1,
  },
  team: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  versus: { fontSize: 12, fontWeight: '900' },
  score: { fontSize: 30, fontWeight: '900', textAlign: 'center' },
  openButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    marginTop: 3,
  },
  openButtonText: { fontSize: 14, fontWeight: '800' },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  overviewRow: { flexDirection: 'row', gap: 8 },
  metric: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    gap: 4,
  },
  metricValue: { fontSize: 20, fontWeight: '900' },
  metricLabel: { fontSize: 11, textAlign: 'center' },
  loader: { marginTop: 2 },
  error: { fontSize: 14, fontWeight: '700' },
});

