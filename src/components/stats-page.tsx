import { useAppTheme } from '@/providers/theme-provider';

import ClubHeader from '@/components/club-header';
import { supabase } from '@/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Svg, {
    Circle,
    Line,
    Path,
    Rect,
    Text as SvgText,
} from 'react-native-svg';

const BASE_COLORS = {
  bg: '#031B16',
  card: '#05251E',
  tile: '#092D26',
  border: '#12483D',
  white: '#F6FBF8',
  muted: '#A6B8B1',
  green: '#00D995',
  mint: '#78DCC0',
  purple: '#8250D5',
  blue: '#48A9FF',
  orange: '#FF9B3F',
  red: '#FF5669',
};
const C = BASE_COLORS;


type Category =
  | 'Overview'
  | 'Matches'
  | 'Partners'
  | 'Opponents'
  | 'Courts';

type Season = 'This Season' | 'Last Season' | 'All Time';
type Team = 'A' | 'B';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

type MatchRow = {
  id: string;
  session_id: string;
  court_id: number | null;
  match_type: string;
  status: string;
  team_a_score: number;
  team_b_score: number;
  created_at: string;
};

type Participant = {
  match_id: string;
  player_id: string;
  team: Team;
  position: number;
};

type SessionRow = {
  id: string;
  starts_at: string;
  ends_at: string;
};

type CourtRow = {
  id: number;
  name: string;
};

type PlayerInfo = {
  name: string;
  avatar: string | null;
};

type Result = {
  id: string;
  date: string;
  courtId: number | null;
  matchType: string;
  won: boolean | null;
  pointsFor: number;
  pointsAgainst: number;
  partners: string[];
  opponents: string[];
};

type Ranking = {
  id: string;
  name: string;
  avatar: string | null;
  matches: number;
  wins: number;
  rate: number;
};

type CourtStat = {
  id: number;
  name: string;
  matches: number;
  wins: number;
  rate: number;
};

const CATEGORIES: Category[] = [
  'Overview',
  'Matches',
  'Partners',
  'Opponents',
  'Courts',
];

const SEASONS: Season[] = [
  'This Season',
  'Last Season',
  'All Time',
];

function percent(wins: number, matches: number) {
  return matches ? Math.round((wins / matches) * 100) : 0;
}

function average(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) /
        values.length
    : 0;
}

function getSeasonYear(season: Season) {
  const year = new Date().getFullYear();
  return season === 'This Season'
    ? year
    : season === 'Last Season'
      ? year - 1
      : null;
}

function matchesSeason(
  result: Result,
  season: Season
) {
  const year = getSeasonYear(season);
  return (
    year === null ||
    new Date(result.date).getFullYear() === year
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

function Avatar({
  name,
  uri,
}: {
  name: string;
  uri: string | null;
}) {
  const { C, s } = useThemeStyles();
  if (uri) {
    return (
      <Image source={{ uri }} style={s.avatar} />
    );
  }

  return (
    <View style={[s.avatar, s.avatarFallback]}>
      <Text style={s.avatarText}>{initials(name)}</Text>
    </View>
  );
}

function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { C, s } = useThemeStyles();
  return (
    <View style={s.panel}>
      <View style={s.panelHeading}>
        <Text style={s.panelTitle} numberOfLines={1}>
          {title}
        </Text>
        {right}
      </View>
      {children}
    </View>
  );
}

function Metric({
  icon,
  value,
  label,
  color,
}: {
  icon: IconName;
  value: string;
  label: string;
  color: string;
}) {
  const { C, s } = useThemeStyles();
  return (
    <View style={s.metric}>
      <Ionicons name={icon} size={21} color={color} />
      <Text
        style={s.metricValue}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}

function TrendChart({
  values,
  percentage = false,
}: {
  values: number[];
  percentage?: boolean;
}) {
  const { C, s } = useThemeStyles();
  if (!values.length) {
    return <Text style={s.empty}>No completed matches yet</Text>;
  }

  const width = 300;
  const height = 115;
  const left = 32;
  const top = 12;
  const plotWidth = 256;
  const plotHeight = 78;

  const max = percentage
    ? 100
    : Math.max(1, Math.ceil(Math.max(...values)));

  const points = values.map((value, index) => ({
    x:
      left +
      (index * plotWidth) /
        Math.max(1, values.length - 1),
    y: top + plotHeight * (1 - value / max),
  }));

  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    )
    .join(' ');

  return (
    <Svg
      width="100%"
      height="112"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {[0, 0.5, 1].map((ratio, index) => {
        const y = top + ratio * plotHeight;
        const label = Math.round(max * (1 - ratio));

        return (
          <React.Fragment key={index}>
            <Line
              x1={left}
              x2={left + plotWidth}
              y1={y}
              y2={y}
              stroke={C.border}
              strokeWidth={1}
            />
            <SvgText
              x={2}
              y={y + 4}
              fill={C.muted}
              fontSize={10}
            >
              {percentage ? `${label}%` : label}
            </SvgText>
          </React.Fragment>
        );
      })}

      <Path
        d={path}
        fill="none"
        stroke={C.green}
        strokeWidth={2.5}
      />

      {points.map((point, index) => (
        <Circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={3}
          fill={C.green}
          stroke={C.white}
          strokeWidth={1}
        />
      ))}
    </Svg>
  );
}

function MatchTypeChart({
  results,
}: {
  results: Result[];
}) {
  const { C, s } = useThemeStyles();
  const singles = results.filter(
    item => item.matchType === 'singles'
  ).length;

  const doubles = results.filter(
    item => item.matchType === 'doubles'
  ).length;

  const other = results.length - singles - doubles;

  const items = [
    { label: 'Doubles', count: doubles, color: C.purple },
    { label: 'Singles', count: singles, color: C.green },
    { label: 'Other', count: other, color: C.orange },
  ].filter(item => item.count > 0);

  const total = results.length;
  const circumference = 2 * Math.PI * 35;
  let offset = 0;

  if (!total) {
    return <Text style={s.empty}>No match types yet</Text>;
  }

  return (
    <View style={s.donutRow}>
      <Svg width={100} height={100} viewBox="0 0 100 100">
        {items.map(item => {
          const fraction = item.count / total;
          const start = offset;
          offset += fraction;

          return (
            <Circle
              key={item.label}
              cx={50}
              cy={50}
              r={35}
              fill="none"
              stroke={item.color}
              strokeWidth={18}
              strokeDasharray={
                `${fraction * circumference} ${circumference}`
              }
              strokeDashoffset={-start * circumference}
              rotation={-90}
              origin="50,50"
            />
          );
        })}
      </Svg>

      <View style={s.legend}>
        {items.map(item => (
          <View key={item.label} style={s.legendItem}>
            <View
              style={[
                s.legendDot,
                { backgroundColor: item.color },
              ]}
            />
            <Text style={s.legendText}>{item.label}</Text>
            <Text style={s.legendValue}>
              {percent(item.count, total)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ResultsChart({
  results,
}: {
  results: Result[];
}) {
  const { C, s } = useThemeStyles();
  const recent = results.slice(-10);

  if (!recent.length) {
    return <Text style={s.empty}>No results yet</Text>;
  }

  const wins = recent.filter(r => r.won === true).length;
  const losses = recent.filter(r => r.won === false).length;

  return (
    <>
      <Svg
        width="100%"
        height="100"
        viewBox="0 0 260 100"
        preserveAspectRatio="none"
      >
        {[20, 50, 80].map(y => (
          <Line
            key={y}
            x1={8}
            x2={252}
            y1={y}
            y2={y}
            stroke={C.border}
          />
        ))}

        {recent.map((result, index) => {
          const slot = 240 / recent.length;
          const barHeight = Math.max(
            8,
            (result.pointsFor /
              Math.max(
                1,
                ...recent.map(r => r.pointsFor)
              )) *
              72
          );

          return (
            <Rect
              key={result.id}
              x={10 + index * slot}
              y={88 - barHeight}
              width={Math.max(6, slot - 5)}
              height={barHeight}
              rx={3}
              fill={
                result.won === true
                  ? C.green
                  : result.won === false
                    ? C.red
                    : C.muted
              }
            />
          );
        })}
      </Svg>

      <View style={s.resultLegend}>
        <Text style={s.winText}>● {wins} Wins</Text>
        <Text style={s.lossText}>● {losses} Losses</Text>
      </View>
    </>
  );
}

function RankingList({
  people,
}: {
  people: Ranking[];
}) {
  const { C, s } = useThemeStyles();
  if (!people.length) {
    return (
      <Text style={s.empty}>
        No completed matches with other players yet.
      </Text>
    );
  }

  return (
    <View style={s.rankingList}>
      {people.map((person, index) => (
        <View key={person.id} style={s.rankingRow}>
          <Text style={s.rankNumber}>{index + 1}</Text>

          <Avatar
            name={person.name}
            uri={person.avatar}
          />

          <View style={s.rankInfo}>
            <Text style={s.rankName} numberOfLines={1}>
              {person.name}
            </Text>
            <Text style={s.rankSub}>
              {person.matches} matches · {person.wins} wins
            </Text>
          </View>

          <View style={s.rankRight}>
            <Text style={s.rankRate}>{person.rate}%</Text>
            <View style={s.progressTrack}>
              <View
                style={[
                  s.progressFill,
                  { width: `${person.rate}%` },
                ]}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function CourtPerformance({
  courts,
}: {
  courts: CourtStat[];
}) {
  const { C, s } = useThemeStyles();
  if (!courts.length) {
    return (
      <Text style={s.empty}>
        No completed matches assigned to courts yet.
      </Text>
    );
  }

  return (
    <View style={s.courtList}>
      {courts.map(court => (
        <View key={court.id} style={s.courtRow}>
          <View style={s.courtIcon}>
            <Ionicons
              name="grid-outline"
              size={20}
              color={C.green}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={s.courtTitle}>
              {court.name}
            </Text>
            <Text style={s.courtSubtitle}>
              {court.matches} matches · {court.wins} wins
            </Text>
          </View>

          <Text style={s.courtRate}>
            {court.rate}%
          </Text>
        </View>
      ))}
    </View>
  );
}

function buildRankings(
  results: Result[],
  key: 'partners' | 'opponents',
  names: Record<string, PlayerInfo>
): Ranking[] {
  const map = new Map<
    string,
    { matches: number; wins: number }
  >();

  for (const result of results) {
    for (const id of new Set(result[key])) {
      const current = map.get(id) ?? {
        matches: 0,
        wins: 0,
      };

      current.matches++;
      if (result.won === true) current.wins++;

      map.set(id, current);
    }
  }

  return [...map.entries()]
    .map(([id, stats]) => ({
      id,
      name: names[id]?.name ?? 'Club Player',
      avatar: names[id]?.avatar ?? null,
      matches: stats.matches,
      wins: stats.wins,
      rate: percent(stats.wins, stats.matches),
    }))
    .sort(
      (a, b) =>
        b.matches - a.matches ||
        b.rate - a.rate ||
        a.name.localeCompare(b.name)
    );
}

export default function StatsPage() {
  const { C, s } = useThemeStyles();
  const [season, setSeason] =
    useState<Season>('This Season');

  const [seasonOpen, setSeasonOpen] = useState(false);
  const [category, setCategory] =
    useState<Category>('Overview');

  const [results, setResults] = useState<Result[]>([]);
  const [names, setNames] = useState<
    Record<string, PlayerInfo>
  >({});
  const [courts, setCourts] = useState<CourtRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        setUserId(data.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: ownAssignments, error: ownError } =
        await supabase
          .from('match_players')
          .select('match_id')
          .eq('player_id', userId);

      if (ownError) throw ownError;

      const ids = [
        ...new Set(
          (ownAssignments ?? []).map(
            assignment => assignment.match_id
          )
        ),
      ];

      const courtsResult = await supabase
        .from('courts')
        .select('id, name');

      if (courtsResult.error) throw courtsResult.error;

      setCourts((courtsResult.data ?? []) as CourtRow[]);

      if (!ids.length) {
        setResults([]);
        setNames({});
        setError(null);
        return;
      }

      const { data: matchRows, error: matchError } =
        await supabase
          .from('matches')
          .select(
            'id, session_id, court_id, match_type, status, team_a_score, team_b_score, created_at'
          )
          .in('id', ids)
          .eq('status', 'completed');

      if (matchError) throw matchError;

      const completed = (matchRows ?? []) as MatchRow[];

      if (!completed.length) {
        setResults([]);
        setNames({});
        setError(null);
        return;
      }

      const sessionIds = [
        ...new Set(completed.map(m => m.session_id)),
      ];

      const [sessionsResult, participantsResult] =
        await Promise.all([
          supabase
            .from('club_sessions')
            .select('id, starts_at, ends_at')
            .in('id', sessionIds),

          supabase
            .from('match_players')
            .select('match_id, player_id, team, position')
            .in('match_id', completed.map(m => m.id)),
        ]);

      if (sessionsResult.error) throw sessionsResult.error;
      if (participantsResult.error) throw participantsResult.error;

      const sessions = (sessionsResult.data ?? []) as SessionRow[];
      const participants =
        (participantsResult.data ?? []) as Participant[];

      const directoryResults = await Promise.all(
        sessionIds.map(async id => {
          const { data, error: directoryError } =
            await supabase.rpc(
              'riverside_session_players',
              { p_session_id: id }
            );

          if (directoryError) throw directoryError;
          return data ?? [];
        })
      );

      const playerNames: Record<string, PlayerInfo> = {};

      for (const directory of directoryResults) {
        for (const player of directory as {
          player_id: string;
          display_name: string;
          avatar_url: string | null;
        }[]) {
          playerNames[player.player_id] = {
            name: player.display_name,
            avatar: player.avatar_url,
          };
        }
      }

      const calculated: Result[] = [];

      for (const match of completed) {
        const own = participants.find(
          p =>
            p.match_id === match.id &&
            p.player_id === userId
        );

        const session = sessions.find(
          s => s.id === match.session_id
        );

        if (!own || !session) continue;

        const teamA = participants
          .filter(
            p =>
              p.match_id === match.id &&
              p.team === 'A'
          )
          .map(p => p.player_id);

        const teamB = participants
          .filter(
            p =>
              p.match_id === match.id &&
              p.team === 'B'
          )
          .map(p => p.player_id);

        const myTeam = own.team === 'A' ? teamA : teamB;
        const otherTeam = own.team === 'A' ? teamB : teamA;

        const pointsFor =
          own.team === 'A'
            ? match.team_a_score
            : match.team_b_score;

        const pointsAgainst =
          own.team === 'A'
            ? match.team_b_score
            : match.team_a_score;

        calculated.push({
          id: match.id,
          date: session.starts_at,
          courtId: match.court_id,
          matchType: match.match_type,
          won:
            pointsFor === pointsAgainst
              ? null
              : pointsFor > pointsAgainst,
          pointsFor,
          pointsAgainst,
          partners: myTeam.filter(id => id !== userId),
          opponents: otherTeam,
        });
      }

      calculated.sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      );

      setResults(calculated);
      setNames(playerNames);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to load statistics'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    void load();

    const channel = supabase
      .channel(`riverside-stats-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => { void load(); }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_players',
        },
        () => { void load(); }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_sessions',
        },
        () => { void load(); }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => { void load(); }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_attendance',
        },
        () => { void load(); }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courts',
        },
        () => { void load(); }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') void load();
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, userId]);

  const filtered = useMemo(
    () => results.filter(r => matchesSeason(r, season)),
    [results, season]
  );

  const decided = filtered.filter(r => r.won !== null);
  const wins = decided.filter(r => r.won === true).length;
  const losses = decided.filter(r => r.won === false).length;

  const winRate = percent(wins, decided.length);
  const avgPoints = average(
    filtered.map(r => r.pointsFor)
  );

  const trend = decided.map((_, index) => {
    const slice = decided.slice(0, index + 1);
    return percent(
      slice.filter(r => r.won === true).length,
      slice.length
    );
  });

  const pointTrend = filtered.map(r => r.pointsFor);

  const partners = useMemo(
    () => buildRankings(filtered, 'partners', names),
    [filtered, names]
  );

  const opponents = useMemo(
    () => buildRankings(filtered, 'opponents', names),
    [filtered, names]
  );

  const courtStats = useMemo<CourtStat[]>(() => {
    return courts
      .map(court => {
        const matches = filtered.filter(
          r => r.courtId === court.id
        );

        const wins = matches.filter(
          r => r.won === true
        ).length;

        const decidedCount = matches.filter(
          r => r.won !== null
        ).length;

        return {
          id: court.id,
          name: court.name,
          matches: matches.length,
          wins,
          rate: percent(wins, decidedCount),
        };
      })
      .filter(court => court.matches > 0);
  }, [courts, filtered]);

  const metrics: {
    icon: IconName;
    value: string;
    label: string;
    color: string;
  }[] = [
    {
      icon: 'tennisball-outline',
      value: String(filtered.length),
      label: 'Matches',
      color: C.green,
    },
    {
      icon: 'trophy-outline',
      value: `${winRate}%`,
      label: 'Win Rate',
      color: C.green,
    },
    {
      icon: 'stats-chart-outline',
      value: avgPoints.toFixed(1),
      label: 'Avg. Team Points',
      color: C.blue,
    },
    {
      icon: 'ribbon-outline',
      value: `${wins} / ${losses}`,
      label: 'Wins / Losses',
      color: C.orange,
    },
  ];

  const showCharts =
    category === 'Overview' ||
    category === 'Matches';

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={C.green}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        <ClubHeader
          title="Statistics"
          highlight="istics"
          subtitle="Your live performance and club insights"
        />

        <View style={s.content}>
          <View style={s.seasonArea}>
            <Pressable
              style={s.seasonButton}
              onPress={() => setSeasonOpen(!seasonOpen)}
            >
              <Text style={s.seasonText}>
                {season}
              </Text>
              <Ionicons
                name={
                  seasonOpen
                    ? 'chevron-up'
                    : 'chevron-down'
                }
                size={18}
                color={C.white}
              />
            </Pressable>

            {seasonOpen && (
              <View style={s.seasonMenu}>
                {SEASONS.map(option => (
                  <Pressable
                    key={option}
                    style={s.seasonOption}
                    onPress={() => {
                      setSeason(option);
                      setSeasonOpen(false);
                    }}
                  >
                    <Text style={s.seasonText}>
                      {option}
                    </Text>
                    {season === option && (
                      <Ionicons
                        name="checkmark"
                        size={17}
                        color={C.green}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {loading && (
            <ActivityIndicator
              color={C.green}
              size="large"
              style={{ marginVertical: 20 }}
            />
          )}

          {error && (
            <Pressable onPress={() => void load()}>
              <Text style={s.error}>
                {error} · Tap to retry
              </Text>
            </Pressable>
          )}

          <View style={s.metricGrid}>
            {metrics.map(metric => (
              <Metric key={metric.label} {...metric} />
            ))}
          </View>

          <View style={s.tabs}>
            {CATEGORIES.map(item => (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[
                  s.tab,
                  category === item && s.activeTab,
                ]}
              >
                <Text
                  style={[
                    s.tabText,
                    category === item && s.activeTabText,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          {showCharts && (
            <>
              <View style={s.chartRow}>
                <View style={{ flex: 1.5 }}>
                  <Panel
                    title="Win Rate"
                    right={
                      <Text style={s.highlight}>
                        {winRate}%
                      </Text>
                    }
                  >
                    <TrendChart
                      values={trend}
                      percentage
                    />
                  </Panel>
                </View>

                <View style={{ flex: 1 }}>
                  <Panel title="Match Types">
                    <MatchTypeChart results={filtered} />
                  </Panel>
                </View>
              </View>

              <View style={s.chartRow}>
                <View style={{ flex: 1 }}>
                  <Panel
                    title="Results"
                    right={
                      <Text style={s.smallLabel}>
                        Last 10
                      </Text>
                    }
                  >
                    <ResultsChart results={decided} />
                  </Panel>
                </View>

                <View style={{ flex: 1 }}>
                  <Panel title="Points per Match">
                    <Text style={s.largeNumber}>
                      {avgPoints.toFixed(1)}
                    </Text>
                    <TrendChart values={pointTrend} />
                  </Panel>
                </View>
              </View>
            </>
          )}

          {(category === 'Overview' ||
            category === 'Partners' ||
            category === 'Opponents') && (
            <View style={s.rankingColumns}>
              {(category === 'Overview' ||
                category === 'Partners') && (
                <View style={{ flex: 1 }}>
                  <Panel
                    title="Top Partners"
                    right={
                      <Pressable
                        onPress={() =>
                          setCategory('Partners')
                        }
                      >
                        <Text style={s.link}>
                          View All ›
                        </Text>
                      </Pressable>
                    }
                  >
                    <RankingList
                      people={
                        category === 'Overview'
                          ? partners.slice(0, 5)
                          : partners
                      }
                    />
                  </Panel>
                </View>
              )}

              {(category === 'Overview' ||
                category === 'Opponents') && (
                <View style={{ flex: 1 }}>
                  <Panel
                    title="Opponents"
                    right={
                      <Pressable
                        onPress={() =>
                          setCategory('Opponents')
                        }
                      >
                        <Text style={s.link}>
                          View All ›
                        </Text>
                      </Pressable>
                    }
                  >
                    <RankingList
                      people={
                        category === 'Overview'
                          ? opponents.slice(0, 5)
                          : opponents
                      }
                    />
                  </Panel>
                </View>
              )}
            </View>
          )}

          {category === 'Courts' && (
            <Panel title="Performance by Court">
              <CourtPerformance courts={courtStats} />
            </Panel>
          )}

          <Text style={s.footer}>
            Statistics calculated from completed Supabase
            matches · Live updates enabled
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}


function useThemeStyles() {
  const { theme } = useAppTheme();
  const C = { ...BASE_COLORS,
    bg: theme.background,
    card: theme.surface,
    tile: theme.tile,
    border: theme.border,
    green: theme.accent,
    mint: theme.accentSoft,
    white: theme.text,
    muted: theme.muted,
  };
  const s = makeStyles(C);
  return { C, s, theme };
}

const makeStyles = (C: typeof BASE_COLORS) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  content: {
    paddingHorizontal: 12,
    gap: 11,
    marginTop: -3,
  },
  seasonArea: {
    position: 'relative',
    zIndex: 10,
  },
  seasonButton: {
    width: 155,
    height: 37,
    borderRadius: 11,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seasonText: {
    color: C.white,
    fontSize: 13,
  },
  seasonMenu: {
    position: 'absolute',
    top: 41,
    left: 0,
    width: 165,
    backgroundColor: C.tile,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 11,
    zIndex: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  seasonOption: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    height: 103,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 3,
  },
  metricValue: {
    color: C.white,
    fontSize: 23,
    fontWeight: '800',
  },
  metricLabel: {
    color: C.white,
    fontSize: 10,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#0C2D27',
    borderRadius: 11,
    padding: 3,
    gap: 1,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    paddingHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#00A978',
  },
  tabText: {
    color: C.white,
    fontSize: 10,
  },
  activeTabText: {
    fontWeight: '800',
  },
  chartRow: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'stretch',
  },
  panel: {
    flex: 1,
    minWidth: 0,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 9,
    gap: 9,
  },
  panelHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  panelTitle: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  highlight: {
    color: C.green,
    fontSize: 18,
    fontWeight: '800',
  },
  smallLabel: {
    color: C.muted,
    fontSize: 10,
  },
  largeNumber: {
    color: C.white,
    fontSize: 25,
    fontWeight: '800',
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  legend: {
    flex: 1,
    gap: 9,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    flex: 1,
    color: C.white,
    fontSize: 9,
  },
  legendValue: {
    color: C.white,
    fontSize: 9,
    fontWeight: '800',
  },
  resultLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  winText: {
    color: C.green,
    fontSize: 10,
  },
  lossText: {
    color: C.red,
    fontSize: 10,
  },
  rankingColumns: {
    flexDirection: 'row',
    gap: 7,
  },
  rankingList: {
    gap: 11,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rankNumber: {
    color: C.white,
    fontSize: 11,
    width: 12,
  },
  avatar: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.muted,
  },
  avatarFallback: {
    backgroundColor: '#125D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: C.white,
    fontSize: 10,
    fontWeight: '800',
  },
  rankInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  rankName: {
    color: C.white,
    fontSize: 10,
    fontWeight: '700',
  },
  rankSub: {
    color: C.muted,
    fontSize: 9,
  },
  rankRight: {
    width: 43,
    gap: 5,
    alignItems: 'flex-end',
  },
  rankRate: {
    color: C.white,
    fontSize: 10,
    fontWeight: '800',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 4,
    backgroundColor: '#24463D',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.green,
    borderRadius: 4,
  },
  courtList: {
    gap: 9,
  },
  courtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  courtIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: C.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courtTitle: {
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
  },
  courtSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 4,
  },
  courtRate: {
    color: C.green,
    fontSize: 19,
    fontWeight: '800',
  },
  link: {
    color: C.green,
    fontSize: 9,
  },
  empty: {
    color: C.muted,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 20,
  },
  error: {
    color: C.red,
    textAlign: 'center',
    padding: 12,
  },
  footer: {
    color: '#739A8B',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 8,
  },
});
