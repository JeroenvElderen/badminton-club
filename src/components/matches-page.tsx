import { useAppTheme } from '@/providers/theme-provider';

import AttendancePage from '@/components/attendance-page';
import { supabase } from '@/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

const BASE_COLORS = {
    bg: '#031B16',
    card: '#06251E',
    tile: '#102C27',
    border: '#185243',
    green: '#00D995',
    mint: '#78DCC0',
    white: '#F6FBF8',
    muted: '#A6B8B1',
    purple: '#6540B2',
    red: '#FF5669',
};
const C = BASE_COLORS;


type Section = 'Matches' | 'Attendance';
type Filter = 'Upcoming' | 'Today' | 'Past';
type Team = 'A' | 'B';

type DBMatch = {
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

type DBPlayer = {
    match_id: string;
    player_id: string;
    team: Team;
    position: number;
};

type DBSession = {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
};

type DBCourt = {
    id: number;
    name: string;
};

type Person = {
    player_id: string;
    display_name: string;
    avatar_url: string | null;
};

type MatchView = DBMatch & {
    session: DBSession;
    courtName: string;
    teamA: Person[];
    teamB: Person[];
};

function sameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function formatTime(value: string) {
    return new Date(value).toLocaleTimeString('en-IE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-IE', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

function PlayerFaces({ people }: { people: Person[] }) {
  const { C, s } = useThemeStyles();
    return (
        <View style={s.faces}>
            {people.map((person, index) => (
                <View
                    key={person.player_id}
                    style={index ? s.faceOverlap : undefined}
                >
                    {person.avatar_url ? (
                        <Image
                            source={{ uri: person.avatar_url }}
                            style={s.face}
                        />
                    ) : (
                        <View style={[s.face, s.faceFallback]}>
                            <Text style={s.initial}>
                                {person.display_name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
}

function TeamDisplay({ people }: { people: Person[] }) {
  const { C, s } = useThemeStyles();
    return (
        <View style={s.team}>
            <PlayerFaces people={people} />
            <Text numberOfLines={2} style={s.teamName}>
                {people.length
                    ? people.map(p => p.display_name).join(' & ')
                    : 'Players pending'}
            </Text>
        </View>
    );
}

function MatchCard({
    match,
    onPress,
}: {
    match: MatchView;
    onPress: () => void;
}) {
  const { C, s } = useThemeStyles();
    const finished = match.status === 'completed';

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                s.matchCard,
                pressed && { opacity: 0.8 },
            ]}
        >
            <View style={s.matchDate}>
                <Text style={s.dateLabel}>
                    {formatDate(match.session.starts_at)}
                </Text>
                <Text style={s.time}>
                    {formatTime(match.session.starts_at)}
                </Text>
                <Text style={s.endTime}>
                    {formatTime(match.session.ends_at)}
                </Text>
            </View>

            <View style={s.accentLine} />

            <View style={s.matchBody}>
                <View style={s.matchTop}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.round}>
                            Round {match.round_number}
                        </Text>
                        <Text style={s.matchMeta}>
                            {match.courtName} ·{' '}
                            {match.match_type === 'doubles'
                                ? 'Doubles'
                                : 'Singles'}
                        </Text>
                    </View>

                    <View
                        style={[
                            s.typeBadge,
                            match.match_type === 'singles' && s.singlesBadge,
                        ]}
                    >
                        <Text style={s.typeText}>
                            {match.status === 'in_progress'
                                ? 'LIVE'
                                : finished
                                    ? 'Finished'
                                    : 'Scheduled'}
                        </Text>
                    </View>
                </View>

                <View style={s.teams}>
                    <TeamDisplay people={match.teamA} />
                    <Text style={s.vs}>vs</Text>
                    <TeamDisplay people={match.teamB} />
                </View>

                {(finished || match.status === 'in_progress') && (
                    <View style={s.scoreRow}>
                        <Ionicons
                            name="tennisball-outline"
                            size={15}
                            color={C.green}
                        />
                        <Text style={s.scoreText}>
                            {match.team_a_score} – {match.team_b_score}
                        </Text>
                    </View>
                )}
            </View>

            <Ionicons
                name="chevron-forward"
                size={19}
                color={C.white}
            />
        </Pressable>
    );
}

async function fetchMatches(userId: string): Promise<MatchView[]> {
            // Find matches assigned to this player.
            const { data: assignments, error: assignmentError } =
                await supabase
                    .from('match_players')
                    .select('match_id')
                    .eq('player_id', userId);

            if (assignmentError) throw assignmentError;

            const ids = (assignments ?? []).map(a => a.match_id);

            if (!ids.length) {
                return [];
            }

            const { data: matchRows, error: matchError } =
                await supabase
                    .from('matches')
                    .select(
                        'id, session_id, court_id, round_number, match_type, status, team_a_score, team_b_score, created_at'
                    )
                    .in('id', ids)
                    .neq('status', 'cancelled');

            if (matchError) throw matchError;

            const rawMatches = (matchRows ?? []) as DBMatch[];

            if (!rawMatches.length) {
                return [];
            }

            const sessionIds = [
                ...new Set(rawMatches.map(m => m.session_id)),
            ];

            const matchIds = rawMatches.map(m => m.id);

            const [sessionsResult, playersResult, courtsResult] =
                await Promise.all([
                    supabase
                        .from('club_sessions')
                        .select('id, title, starts_at, ends_at')
                        .in('id', sessionIds),

                    supabase
                        .from('match_players')
                        .select('match_id, player_id, team, position')
                        .in('match_id', matchIds),

                    supabase
                        .from('courts')
                        .select('id, name'),
                ]);

            if (sessionsResult.error) throw sessionsResult.error;
            if (playersResult.error) throw playersResult.error;
            if (courtsResult.error) throw courtsResult.error;

            const sessions = (sessionsResult.data ?? []) as DBSession[];
            const players = (playersResult.data ?? []) as DBPlayer[];
            const courts = (courtsResult.data ?? []) as DBCourt[];

            // Fetch public-facing player names through the
            // restricted session-directory RPC.
            const directories = await Promise.all(
                sessionIds.map(async sessionId => {
                    const { data, error: rpcError } = await supabase.rpc(
                        'riverside_session_players',
                        { p_session_id: sessionId }
                    );

                    if (rpcError) throw rpcError;

                    return data ?? [];
                })
            );

            const names = new Map<string, Person>();

            for (const directory of directories) {
                for (const player of directory) {
                    names.set(player.player_id, {
                        player_id: player.player_id,
                        display_name: player.display_name,
                        avatar_url: player.avatar_url,
                    });
                }
            }

            const ownProfileResult = await supabase
                .from('profiles')
                .select('display_name, full_name, avatar_url')
                .eq('id', userId)
                .maybeSingle();

            if (ownProfileResult.error) throw ownProfileResult.error;

            names.set(userId, {
                player_id: userId,
                display_name: 'You',
                avatar_url: ownProfileResult.data?.avatar_url ?? null,
            });

            const toPerson = (id: string): Person =>
                names.get(id) ?? {
                    player_id: id,
                    display_name: 'Club player',
                    avatar_url: null,
                };

            const result: MatchView[] = rawMatches.flatMap(match => {
                const session = sessions.find(
                    s => s.id === match.session_id
                );

                if (!session) return [];

                const participants = players
                    .filter(p => p.match_id === match.id)
                    .sort((a, b) => a.position - b.position);

                return [{
                    ...match,
                    session,
                    courtName:
                        courts.find(c => c.id === match.court_id)?.name ??
                        'Court pending',
                    teamA: participants
                        .filter(p => p.team === 'A')
                        .map(p => toPerson(p.player_id)),
                    teamB: participants
                        .filter(p => p.team === 'B')
                        .map(p => toPerson(p.player_id)),
                }];
            });

            result.sort(
                (a, b) =>
                    new Date(a.session.starts_at).getTime() -
                    new Date(b.session.starts_at).getTime() ||
                    a.round_number - b.round_number
            );

            return result;
}

export default function MatchesPage() {
  const { C, s } = useThemeStyles();
    const [section, setSection] = useState<Section>('Matches');
    const [filter, setFilter] = useState<Filter>('Upcoming');
    const [selected, setSelected] = useState<MatchView | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const queryClient = useQueryClient();
    useEffect(() => {
        let active = true;
        supabase.auth.getUser().then(({ data, error }) => {
            if (!active) return;
            if (error) setAuthError(error.message);
            else setUserId(data.user?.id ?? null);
        });
        return () => { active = false; };
    }, []);

    const queryKey = ['riverside', 'matches', userId] as const;
    const query = useQuery({
        queryKey,
        queryFn: () => fetchMatches(userId!),
        enabled: Boolean(userId),
        staleTime: 60_000,
        placeholderData: previous => previous,
    });
    const matches = query.data ?? [];
    const loading = !authError && (!userId || query.isPending);
    const refreshing = query.isRefetching;
    const error = authError ?? (query.error instanceof Error ? query.error.message : query.error ? 'Unable to load matches' : null);
    const load = useCallback(async () => {
        if (!userId) return;
        await queryClient.invalidateQueries({ queryKey });
    }, [queryClient, userId]);

    useEffect(() => {
        if (!userId) return;
        const channel = supabase.channel(`riverside-matches-query-${userId}-${Math.random().toString(36).slice(2)}`);
        for (const table of ['matches', 'match_players', 'club_sessions', 'courts', 'profiles']) {
            channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
                void queryClient.invalidateQueries({ queryKey });
            });
        }
        channel.subscribe(status => {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.warn('Riverside Matches Realtime:', status);
        });
        return () => { void supabase.removeChannel(channel); };
    }, [queryClient, userId]);

    const now = new Date();

    const today = useMemo(
        () => matches.filter(
            m =>
                m.status !== 'completed' &&
                sameDay(new Date(m.session.starts_at), now)
        ),
        [matches]
    );

    const upcoming = useMemo(
        () => matches.filter(
            m =>
                m.status !== 'completed' &&
                !sameDay(new Date(m.session.starts_at), now) &&
                new Date(m.session.ends_at) >= now
        ),
        [matches]
    );

    const past = useMemo(
        () => matches.filter(
            m =>
                m.status === 'completed' ||
                new Date(m.session.ends_at) < now
        ).reverse(),
        [matches]
    );

    const visible =
        filter === 'Today'
            ? today
            : filter === 'Past'
                ? past
                : [...today, ...upcoming];

    const renderMatch = (match: MatchView) => (
        <MatchCard
            key={match.id}
            match={match}
            onPress={() => setSelected(match)}
        />
    );

    return (
        <View style={s.root}>
            <ScrollView
                style={s.scroll}
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
                    <View style={s.mainSegment}>
                        {(['Matches', 'Attendance'] as Section[]).map(item => (
                            <Pressable
                                key={item}
                                onPress={() => setSection(item)}
                                style={[
                                    s.mainSegmentButton,
                                    section === item && s.segmentActive,
                                ]}
                            >
                                <Ionicons
                                    name={
                                        item === 'Matches'
                                            ? 'tennisball-outline'
                                            : 'calendar-outline'
                                    }
                                    size={18}
                                    color={section === item ? C.white : C.muted}
                                />
                                <Text
                                    style={[
                                        s.mainSegmentText,
                                        section === item && s.segmentTextActive,
                                    ]}
                                >
                                    {item}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {section === 'Attendance' ? (
                        <AttendancePage />
                    ) : (
                        <>
                            <View style={s.filterSegment}>
                                {(['Upcoming', 'Today', 'Past'] as Filter[]).map(item => (
                                    <Pressable
                                        key={item}
                                        onPress={() => setFilter(item)}
                                        style={[
                                            s.filterButton,
                                            filter === item && s.segmentActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                s.filterText,
                                                filter === item && s.segmentTextActive,
                                            ]}
                                        >
                                            {item} ({
                                                item === 'Upcoming'
                                                    ? today.length + upcoming.length
                                                    : item === 'Today'
                                                        ? today.length
                                                        : past.length
                                            })
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {loading && (
                                <ActivityIndicator
                                    size="large"
                                    color={C.green}
                                    style={{ marginVertical: 35 }}
                                />
                            )}

                            {error && (
                                <Pressable onPress={() => void load()}>
                                    <Text style={s.error}>
                                        {error} · Tap to retry
                                    </Text>
                                </Pressable>
                            )}

                            {!loading && !error && filter === 'Upcoming' ? (
                                <>
                                    <View style={s.sectionRow}>
                                        <Text style={s.sectionTitle}>Today</Text>
                                        <Pressable onPress={() => setFilter('Today')}>
                                            <Text style={s.viewLink}>View Today ›</Text>
                                        </Pressable>
                                    </View>

                                    {today.map(renderMatch)}

                                    <View style={[s.sectionRow, { marginTop: 18 }]}>
                                        <Text style={s.sectionTitle}>
                                            Upcoming Matches
                                        </Text>
                                        <Text style={s.viewLink}>
                                            {upcoming.length} scheduled
                                        </Text>
                                    </View>

                                    {upcoming.map(renderMatch)}
                                </>
                            ) : !loading && !error ? (
                                <>
                                    <View style={s.sectionRow}>
                                        <Text style={s.sectionTitle}>
                                            {filter === 'Today'
                                                ? "Today's Matches"
                                                : 'Past Matches'}
                                        </Text>
                                        <Text style={s.viewLink}>
                                            {visible.length} matches
                                        </Text>
                                    </View>
                                    {visible.map(renderMatch)}
                                </>
                            ) : null}

                            {!loading && !error && visible.length === 0 && (
                                <View style={s.emptyPanel}>
                                    <Ionicons
                                        name="tennisball-outline"
                                        size={28}
                                        color={C.green}
                                    />
                                    <Text style={s.empty}>
                                        No matches in this category yet.
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>

            <Modal
                visible={selected !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setSelected(null)}
            >
                <View style={s.modalShade}>
                    <View style={s.modalPanel}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>
                                Match Details
                            </Text>
                            <Pressable onPress={() => setSelected(null)}>
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={C.white}
                                />
                            </Pressable>
                        </View>

                        {selected && (
                            <>
                                <Text style={s.modalMeta}>
                                    {selected.session.title}
                                </Text>
                                <Text style={s.modalMeta}>
                                    {formatDate(selected.session.starts_at)}
                                    {' · '}
                                    {selected.courtName}
                                    {' · '}
                                    Round {selected.round_number}
                                </Text>

                                <View style={s.modalTeams}>
                                    <TeamDisplay people={selected.teamA} />
                                    <Text style={s.vs}>VS</Text>
                                    <TeamDisplay people={selected.teamB} />
                                </View>

                                <Text style={s.modalScore}>
                                    {selected.status === 'completed' ||
                                        selected.status === 'in_progress'
                                        ? `${selected.team_a_score} – ${selected.team_b_score}`
                                        : 'Not started'}
                                </Text>

                                <Text style={s.modalMeta}>
                                    Status: {selected.status.replace('_', ' ')}
                                </Text>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
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
    root: { flex: 1, backgroundColor: C.bg },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 30 },
    content: {
        paddingHorizontal: 15,
        marginTop: 12,
        gap: 11,
    },
    mainSegment: {
        flexDirection: 'row',
        backgroundColor: C.tile,
        borderColor: C.border,
        borderWidth: 1,
        borderRadius: 13,
        padding: 4,
        gap: 4,
    },
    mainSegmentButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
    },
    mainSegmentText: {
        color: C.muted,
        fontSize: 14,
        fontWeight: '700',
    },
    filterSegment: {
        flexDirection: 'row',
        backgroundColor: C.tile,
        borderColor: C.border,
        borderWidth: 1,
        borderRadius: 12,
        padding: 3,
        marginBottom: 5,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 11,
        alignItems: 'center',
        borderRadius: 9,
    },
    filterText: {
        color: C.white,
        fontSize: 12,
        fontWeight: '500',
    },
    segmentActive: { backgroundColor: '#008E61' },
    segmentTextActive: {
        color: C.white,
        fontWeight: '800',
    },
    sectionRow: {
        marginTop: 4,
        marginBottom: 3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        color: C.white,
        fontSize: 17,
        fontWeight: '800',
    },
    viewLink: { color: C.green, fontSize: 12 },
    matchCard: {
        backgroundColor: C.card,
        borderColor: C.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        minHeight: 115,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    matchDate: {
        width: 63,
        justifyContent: 'center',
        gap: 3,
    },
    dateLabel: {
        color: C.white,
        fontSize: 11,
        fontWeight: '700',
    },
    time: {
        color: C.white,
        fontSize: 16,
        fontWeight: '800',
    },
    endTime: { color: C.muted, fontSize: 12 },
    accentLine: {
        width: 2,
        alignSelf: 'stretch',
        backgroundColor: C.green,
        borderRadius: 2,
    },
    matchBody: { flex: 1, minWidth: 0 },
    matchTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
    },
    round: {
        color: C.white,
        fontSize: 16,
        fontWeight: '800',
    },
    matchMeta: {
        color: C.muted,
        fontSize: 12,
        marginTop: 2,
    },
    typeBadge: {
        backgroundColor: C.purple,
        borderRadius: 7,
        paddingHorizontal: 7,
        paddingVertical: 4,
    },
    singlesBadge: { backgroundColor: '#008E61' },
    typeText: {
        color: C.white,
        fontSize: 10,
        fontWeight: '700',
    },
    teams: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 9,
    },
    team: {
        flex: 1,
        minWidth: 0,
        alignItems: 'center',
        gap: 4,
    },
    faces: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    face: {
        width: 31,
        height: 31,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#D9E6E1',
    },
    faceOverlap: { marginLeft: -8 },
    faceFallback: {
        backgroundColor: '#125D48',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initial: {
        color: C.white,
        fontSize: 13,
        fontWeight: '800',
    },
    teamName: {
        color: C.white,
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    vs: {
        color: C.white,
        fontSize: 11,
        paddingHorizontal: 5,
    },
    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 9,
    },
    scoreText: {
        color: C.green,
        fontSize: 14,
        fontWeight: '800',
    },
    emptyPanel: {
        padding: 30,
        alignItems: 'center',
        gap: 10,
        backgroundColor: C.card,
        borderRadius: 14,
    },
    empty: {
        color: C.muted,
        textAlign: 'center',
    },
    error: {
        color: C.red,
        textAlign: 'center',
        padding: 16,
    },
    modalShade: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.76)',
        justifyContent: 'center',
        padding: 20,
    },
    modalPanel: {
        backgroundColor: C.card,
        borderColor: C.border,
        borderWidth: 1,
        borderRadius: 18,
        padding: 18,
        gap: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalTitle: {
        color: C.white,
        fontSize: 21,
        fontWeight: '800',
    },
    modalMeta: {
        color: C.muted,
        fontSize: 13,
    },
    modalTeams: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 14,
    },
    modalScore: {
        color: C.green,
        fontSize: 27,
        fontWeight: '800',
        textAlign: 'center',
    },
});
