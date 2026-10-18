import { useAppTheme } from '@/providers/theme-provider';

import { supabase } from '@/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const BASE_COLORS = {
    bg: '#031B16',
    card: '#05251E',
    tile: '#092D26',
    border: '#12483D',
    white: '#F6FBF8',
    muted: '#A6B8B1',
    mint: '#78DCC0',
    green: '#00D995',
    purple: '#8250D5',
    pink: '#B52781',
    blue: '#4944D7',
    gold: '#FFD55D',
    silver: '#BCCBD0',
    bronze: '#DA9850',
    red: '#F35A66',
};
const C = BASE_COLORS;


type RankingMode = 'Win Rate' | 'Matches' | 'Points' | 'Form';

type Profile = {
    id: string;
    full_name: string | null;
    display_name: string | null;
    skill_level: string | null;
    avatar_url: string | null;
};

type Match = {
    id: string;
    session_id: string;
    status: string;
    team_a_score: number | null;
    team_b_score: number | null;
    created_at: string;
};

type MatchPlayer = {
    match_id: string;
    player_id: string;
    team: string;
};

type Session = {
    id: string;
    starts_at: string;
};

type MatchResult = {
    matchId: string;
    date: string;
    won: boolean | null;
    points: number;
};

type Player = {
    id: string;
    name: string;
    skill: string;
    avatar: string | null;
    winRate: number;
    matches: number;
    wins: number;
    losses: number;
    points: number;
    form: number[];
};

const MODES: RankingMode[] = [
    'Win Rate',
    'Matches',
    'Points',
    'Form',
];

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase();
}

function Avatar({
    player,
    size = 42,
}: {
    player: Player;
    size?: number;
}) {
  const { C, s } = useThemeStyles();
    const style = {
        width: size,
        height: size,
        borderRadius: size / 2,
    };

    if (player.avatar) {
        return (
            <Image
                source={{ uri: player.avatar }}
                style={[style, s.avatarImage]}
            />
        );
    }

    return (
        <View style={[style, s.avatarFallback]}>
            <Text
                style={[
                    s.avatarInitials,
                    { fontSize: Math.max(11, size * 0.3) },
                ]}
            >
                {getInitials(player.name)}
            </Text>
        </View>
    );
}

function SkillBadge({ skill }: { skill: string }) {
  const { C, s } = useThemeStyles();
    const normalized = skill.toLowerCase();

    const backgroundColor =
        normalized === 'advanced'
            ? C.pink
            : normalized === 'intermediate'
                ? C.blue
                : '#AA267D';

    return (
        <View style={[s.skillBadge, { backgroundColor }]}>
            <Text style={s.skillText}>{skill}</Text>
        </View>
    );
}

function FormDots({ form }: { form: number[] }) {
  const { C, s } = useThemeStyles();
    if (!form.length) {
        return <Text style={s.noForm}>No completed results</Text>;
    }

    return (
        <View style={s.formDots}>
            {form.map((result, index) => (
                <View
                    key={index}
                    style={[
                        s.formDot,
                        {
                            backgroundColor:
                                result === 1 ? C.green : C.red,
                        },
                    ]}
                >
                    <Text style={s.formDotText}>
                        {result === 1 ? 'W' : 'L'}
                    </Text>
                </View>
            ))}
        </View>
    );
}

function RankMedal({ rank }: { rank: number }) {
  const { C, s } = useThemeStyles();
    const backgroundColor =
        rank === 1
            ? C.gold
            : rank === 2
                ? C.silver
                : C.bronze;

    return (
        <View style={[s.medal, { backgroundColor }]}>
            <Text style={s.medalText}>{rank}</Text>
        </View>
    );
}

function PlayerRow({
    player,
    rank,
    mode,
    onPress,
}: {
    player: Player;
    rank: number;
    mode: RankingMode;
    onPress: () => void;
}) {
  const { C, s } = useThemeStyles();
    const topThree = rank <= 3;

    const borderColor =
        rank === 1
            ? '#E9C84D'
            : rank === 2
                ? '#9EB3B8'
                : rank === 3
                    ? '#B77732'
                    : C.border;

    const highlight =
        rank === 1
            ? 'rgba(155,113,28,0.13)'
            : rank === 2
                ? 'rgba(94,133,141,0.10)'
                : rank === 3
                    ? 'rgba(153,89,34,0.10)'
                    : 'transparent';

    const formWins = player.form.reduce(
        (sum, value) => sum + value,
        0
    );

    const primaryValue =
        mode === 'Win Rate'
            ? `${player.winRate}%`
            : mode === 'Matches'
                ? String(player.matches)
                : mode === 'Points'
                    ? player.points.toFixed(1)
                    : `${formWins}/${player.form.length}`;

    const primaryLabel =
        mode === 'Win Rate'
            ? 'Win Rate'
            : mode === 'Matches'
                ? 'Matches'
                : mode === 'Points'
                    ? 'Avg. Points'
                    : 'Last 5';

    return (
        <Pressable
            onPress={onPress}
            style={[
                s.playerCard,
                { borderColor },
                topThree && { backgroundColor: '#0A211C' },
            ]}
        >
            {topThree && (
                <View
                    pointerEvents="none"
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: highlight,
                            borderRadius: 12,
                        },
                    ]}
                />
            )}

            <View style={s.rankArea}>
                {topThree ? (
                    <RankMedal rank={rank} />
                ) : (
                    <Text style={s.normalRank}>{rank}</Text>
                )}
            </View>

            <Avatar player={player} size={43} />

            <View style={s.playerIdentity}>
                <Text
                    style={s.playerName}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                >
                    {player.name}
                </Text>
                <SkillBadge skill={player.skill} />
            </View>

            <View style={s.statsArea}>
                <View style={s.statCell}>
                    <Text
                        style={s.statNumber}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {primaryValue}
                    </Text>
                    <Text style={s.statCaption}>
                        {primaryLabel}
                    </Text>
                </View>

                <View style={s.statCell}>
                    <Text style={s.statNumber}>
                        {mode === 'Matches'
                            ? `${player.winRate}%`
                            : player.matches}
                    </Text>
                    <Text style={s.statCaption}>
                        {mode === 'Matches' ? 'Win Rate' : 'Matches'}
                    </Text>
                </View>

                <View style={s.statCell}>
                    <Text style={s.statNumber}>
                        {mode === 'Points'
                            ? `${player.winRate}%`
                            : player.points.toFixed(1)}
                    </Text>
                    <Text style={s.statCaption}>
                        {mode === 'Points' ? 'Win Rate' : 'Avg. Points'}
                    </Text>
                </View>
            </View>

            <Ionicons
                name="chevron-forward"
                size={18}
                color={C.white}
            />
        </Pressable>
    );
}

function PlayerDetail({
    player,
    rank,
    visible,
    onClose,
}: {
    player: Player | null;
    rank: number;
    visible: boolean;
    onClose: () => void;
}) {
  const { C, s } = useThemeStyles();
    if (!player) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={s.modalBackdrop}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                />

                <View style={s.modalCard}>
                    <View style={s.modalTop}>
                        <Text style={s.modalHeading}>
                            Player Profile
                        </Text>

                        <Pressable
                            onPress={onClose}
                            style={s.closeButton}
                        >
                            <Ionicons
                                name="close"
                                size={20}
                                color={C.white}
                            />
                        </Pressable>
                    </View>

                    <View style={s.modalIdentity}>
                        <Avatar player={player} size={72} />
                        <Text style={s.modalName}>
                            {player.name}
                        </Text>
                        <SkillBadge skill={player.skill} />
                        <Text style={s.modalRank}>
                            Leaderboard position #{rank}
                        </Text>
                    </View>

                    <View style={s.modalStats}>
                        <View style={s.modalStat}>
                            <Text style={s.modalStatValue}>
                                {player.winRate}%
                            </Text>
                            <Text style={s.modalStatLabel}>
                                Win Rate
                            </Text>
                        </View>

                        <View style={s.modalStat}>
                            <Text style={s.modalStatValue}>
                                {player.matches}
                            </Text>
                            <Text style={s.modalStatLabel}>
                                Matches
                            </Text>
                        </View>

                        <View style={s.modalStat}>
                            <Text style={s.modalStatValue}>
                                {player.points.toFixed(1)}
                            </Text>
                            <Text style={s.modalStatLabel}>
                                Avg. Points
                            </Text>
                        </View>
                    </View>

                    <Text style={s.formHeading}>
                        Recent Form
                    </Text>
                    <FormDots form={player.form} />

                    <Pressable
                        style={s.doneButton}
                        onPress={onClose}
                    >
                        <Text style={s.doneText}>
                            Close Profile
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

function calculateLeaderboard(
    profiles: Profile[],
    matches: Match[],
    participants: MatchPlayer[],
    sessions: Session[]
): Player[] {
    const sessionDates = new Map(
        sessions.map(session => [
            session.id,
            session.starts_at,
        ])
    );

    const resultsByPlayer = new Map<
        string,
        MatchResult[]
    >();

    for (const match of matches) {
        if (match.status !== 'completed') continue;

        if (
            match.team_a_score === null ||
            match.team_b_score === null
        ) {
            continue;
        }

        const players = participants.filter(
            participant => participant.match_id === match.id
        );

        for (const participant of players) {
            const team = participant.team.toUpperCase();

            if (team !== 'A' && team !== 'B') continue;

            const pointsFor =
                team === 'A'
                    ? match.team_a_score
                    : match.team_b_score;

            const pointsAgainst =
                team === 'A'
                    ? match.team_b_score
                    : match.team_a_score;

            const result: MatchResult = {
                matchId: match.id,
                date:
                    sessionDates.get(match.session_id) ??
                    match.created_at,
                won:
                    pointsFor === pointsAgainst
                        ? null
                        : pointsFor > pointsAgainst,
                points: pointsFor,
            };

            const existing =
                resultsByPlayer.get(participant.player_id) ?? [];

            existing.push(result);
            resultsByPlayer.set(participant.player_id, existing);
        }
    }

    return profiles.map(profile => {
        const results = [
            ...(resultsByPlayer.get(profile.id) ?? []),
        ].sort(
            (a, b) =>
                new Date(a.date).getTime() -
                new Date(b.date).getTime()
        );

        const decided = results.filter(
            result => result.won !== null
        );

        const wins = decided.filter(
            result => result.won === true
        ).length;

        const losses = decided.filter(
            result => result.won === false
        ).length;

        const totalPoints = results.reduce(
            (sum, result) => sum + result.points,
            0
        );

        return {
            id: profile.id,
            name:
                profile.display_name?.trim() ||
                profile.full_name?.trim() ||
                'Club Player',
            skill: profile.skill_level || 'Unrated',
            avatar: profile.avatar_url,
            winRate: decided.length
                ? Math.round((wins / decided.length) * 100)
                : 0,
            matches: results.length,
            wins,
            losses,
            points: results.length
                ? totalPoints / results.length
                : 0,
            form: decided
                .slice(-5)
                .map(result => (result.won ? 1 : 0)),
        };
    });
}

export default function LeaderboardPage() {
  const { C, s } = useThemeStyles();
    const [mode, setMode] =
        useState<RankingMode>('Win Rate');

    const [selectedId, setSelectedId] =
        useState<string | null>(null);

    const queryClient = useQueryClient();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        supabase.auth.getUser().then(({ data, error }) => {
            if (!active) return;
            if (error) console.warn('Riverside Leaderboard auth:', error.message);
            setUserId(data.user?.id ?? null);
        });
        return () => { active = false; };
    }, []);

    const queryKey = ['riverside', 'leaderboard', userId] as const;
    const query = useQuery<Player[]>({
        queryKey,
        enabled: !!userId,
        staleTime: 60_000,
        queryFn: async () => {
            // Fetch completed matches first, then request only their participants
            // and session dates. Unrelated assignments no longer cross the wire.
            const [profilesResult, matchesResult] = await Promise.all([
                supabase.from('profiles').select('id, full_name, display_name, skill_level, avatar_url'),
                supabase.from('matches').select('id, session_id, status, team_a_score, team_b_score, created_at').eq('status', 'completed'),
            ]);
            if (profilesResult.error) throw profilesResult.error;
            if (matchesResult.error) throw matchesResult.error;

            const profiles = (profilesResult.data ?? []) as Profile[];
            const matches = (matchesResult.data ?? []) as Match[];
            if (!matches.length) return calculateLeaderboard(profiles, [], [], []);

            const matchIds = matches.map(match => match.id);
            const sessionIds = [...new Set(matches.map(match => match.session_id))];
            const [participantsResult, sessionsResult] = await Promise.all([
                supabase.from('match_players').select('match_id, player_id, team').in('match_id', matchIds),
                supabase.from('club_sessions').select('id, starts_at').in('id', sessionIds),
            ]);
            if (participantsResult.error) throw participantsResult.error;
            if (sessionsResult.error) throw sessionsResult.error;
            return calculateLeaderboard(
                profiles,
                matches,
                (participantsResult.data ?? []) as MatchPlayer[],
                (sessionsResult.data ?? []) as Session[]
            );
        },
    });

    const players = query.data ?? [];
    const loading = !!userId && query.isPending;
    const refreshing = query.isRefetching;
    const error = query.error instanceof Error ? query.error.message : null;
    const load = useCallback(async () => {
        await query.refetch();
    }, [query.refetch]);

    useEffect(() => {
        if (!userId) return;
        const invalidate = () => {
            void queryClient.invalidateQueries({ queryKey: ['riverside', 'leaderboard', userId], exact: true });
        };
        const channel = supabase.channel(
            `riverside-leaderboard-${userId}-${Math.random().toString(36).slice(2)}`
        );
        for (const table of ['matches', 'match_players', 'profiles', 'club_sessions']) {
            channel.on('postgres_changes', { event: '*', schema: 'public', table }, invalidate);
        }
        channel.subscribe();
        return () => { void supabase.removeChannel(channel); };
    }, [userId, queryClient]);

    const rankedPlayers = useMemo(() => {
        const sorted = [...players];

        return sorted.sort((a, b) => {
            if (mode === 'Win Rate') {
                return (
                    b.winRate - a.winRate ||
                    b.matches - a.matches ||
                    a.name.localeCompare(b.name)
                );
            }

            if (mode === 'Matches') {
                return (
                    b.matches - a.matches ||
                    b.winRate - a.winRate ||
                    a.name.localeCompare(b.name)
                );
            }

            if (mode === 'Points') {
                return (
                    b.points - a.points ||
                    b.matches - a.matches ||
                    a.name.localeCompare(b.name)
                );
            }

            const aForm = a.form.reduce(
                (sum, result) => sum + result,
                0
            );

            const bForm = b.form.reduce(
                (sum, result) => sum + result,
                0
            );

            return (
                bForm - aForm ||
                b.winRate - a.winRate ||
                a.name.localeCompare(b.name)
            );
        });
    }, [players, mode]);

    const selectedPlayer =
        rankedPlayers.find(
            player => player.id === selectedId
        ) ?? null;

    const selectedRank = selectedPlayer
        ? rankedPlayers.findIndex(
            player => player.id === selectedPlayer.id
        ) + 1
        : 0;

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
                            void load();
                        }}
                    />
                }
            >

                <View style={s.content}>
                    <View style={s.modeTabs}>
                        {MODES.map(item => (
                            <Pressable
                                key={item}
                                onPress={() => setMode(item)}
                                style={[
                                    s.modeTab,
                                    mode === item && s.modeTabActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        s.modeText,
                                        mode === item && s.modeTextActive,
                                    ]}
                                >
                                    {item}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {loading && (
                        <ActivityIndicator
                            color={C.green}
                            size="large"
                            style={{ marginVertical: 20 }}
                        />
                    )}

                    {error && (
                        <Pressable
                            onPress={() => void load()}
                            style={s.messageBox}
                        >
                            <Text style={s.errorText}>
                                {error} · Tap to retry
                            </Text>
                        </Pressable>
                    )}

                    {!loading &&
                        !error &&
                        rankedPlayers.length === 0 && (
                            <View style={s.messageBox}>
                                <Text style={s.emptyText}>
                                    No club players available yet.
                                </Text>
                            </View>
                        )}

                    <View style={s.list}>
                        {rankedPlayers.map((player, index) => (
                            <PlayerRow
                                key={player.id}
                                player={player}
                                rank={index + 1}
                                mode={mode}
                                onPress={() =>
                                    setSelectedId(player.id)
                                }
                            />
                        ))}
                    </View>

                    <Text style={s.footer}>
                        Live club rankings · Completed matches only
                    </Text>
                </View>
            </ScrollView>

            <PlayerDetail
                player={selectedPlayer}
                rank={selectedRank}
                visible={selectedPlayer !== null}
                onClose={() => setSelectedId(null)}
            />
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
        paddingBottom: 26,
    },
    content: {
        paddingHorizontal: 12,
        gap: 10,
        paddingTop: 0,
    },
    modeTabs: {
        flexDirection: 'row',
        backgroundColor: '#0C2D27',
        borderWidth: 1,
        borderColor: '#245146',
        borderRadius: 12,
        padding: 2,
        gap: 1,
    },
    modeTab: {
        flex: 1,
        height: 42,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeTabActive: {
        backgroundColor: '#00A978',
    },
    modeText: {
        color: C.white,
        fontSize: 12,
        fontWeight: '500',
    },
    modeTextActive: {
        fontWeight: '700',
    },
    list: {
        gap: 5,
        marginTop: 2,
    },
    playerCard: {
        height: 62,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: C.card,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 7,
        gap: 6,
        overflow: 'hidden',
    },
    rankArea: {
        width: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    medal: {
        width: 25,
        height: 25,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    medalText: {
        color: '#101D17',
        fontSize: 13,
        fontWeight: '800',
    },
    normalRank: {
        color: C.white,
        fontSize: 17,
        fontWeight: '600',
    },
    avatarImage: {
        borderWidth: 1.5,
        borderColor: '#E5F0EB',
        backgroundColor: C.tile,
    },
    avatarFallback: {
        borderWidth: 1.5,
        borderColor: '#E5F0EB',
        backgroundColor: '#125D48',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        color: C.white,
        fontWeight: '800',
    },
    playerIdentity: {
        flex: 1.25,
        minWidth: 0,
        gap: 4,
        alignItems: 'flex-start',
    },
    playerName: {
        color: C.white,
        fontSize: 11,
        fontWeight: '700',
    },
    skillBadge: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    skillText: {
        color: C.white,
        fontSize: 9,
        fontWeight: '600',
    },
    statsArea: {
        flex: 1.8,
        flexDirection: 'row',
        height: 40,
        minWidth: 0,
    },
    statCell: {
        flex: 1,
        minWidth: 0,
        borderLeftWidth: 1,
        borderLeftColor: '#24463D',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    statNumber: {
        color: C.white,
        fontSize: 15,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    statCaption: {
        color: C.white,
        fontSize: 8,
        textAlign: 'center',
    },
    formDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    formDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    formDotText: {
        color: C.white,
        fontSize: 12,
        fontWeight: '800',
    },
    noForm: {
        color: C.muted,
        fontSize: 12,
        textAlign: 'center',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.72)',
        justifyContent: 'center',
        paddingHorizontal: 22,
    },
    modalCard: {
        backgroundColor: '#082A23',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.border,
        padding: 20,
        gap: 18,
    },
    modalTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalHeading: {
        color: C.white,
        fontSize: 17,
        fontWeight: '800',
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: C.tile,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalIdentity: {
        alignItems: 'center',
        gap: 9,
    },
    modalName: {
        color: C.white,
        fontSize: 23,
        fontWeight: '800',
        textAlign: 'center',
    },
    modalRank: {
        color: C.muted,
        fontSize: 12,
    },
    modalStats: {
        flexDirection: 'row',
        backgroundColor: C.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        paddingVertical: 15,
    },
    modalStat: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    modalStatValue: {
        color: C.green,
        fontSize: 21,
        fontWeight: '800',
    },
    modalStatLabel: {
        color: C.muted,
        fontSize: 11,
    },
    formHeading: {
        color: C.white,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    doneButton: {
        backgroundColor: '#00A978',
        borderRadius: 11,
        paddingVertical: 13,
        alignItems: 'center',
    },
    doneText: {
        color: C.white,
        fontSize: 14,
        fontWeight: '700',
    },
    messageBox: {
        padding: 20,
        borderRadius: 12,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.border,
    },
    errorText: {
        color: C.red,
        fontSize: 12,
        textAlign: 'center',
    },
    emptyText: {
        color: C.muted,
        fontSize: 12,
        textAlign: 'center',
    },
    footer: {
        color: '#739A8B',
        fontSize: 9,
        textAlign: 'center',
        marginTop: 8,
    },
});
