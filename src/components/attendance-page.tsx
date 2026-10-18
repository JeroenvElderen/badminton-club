import { useAppTheme } from '@/providers/theme-provider';

import { supabase } from '@/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

const BASE_COLORS = {
    bg: '#031B16',
    card: '#06251E',
    tile: '#102C27',
    border: '#185243',
    white: '#F6FBF8',
    muted: '#A6B8B1',
    green: '#00D995',
    blue: '#48A9FF',
    red: '#FF5669',
};
const C = BASE_COLORS;


type Status = 'Attending' | 'Maybe' | 'Not Attending';
type Sort = 'Name A-Z' | 'Name Z-A' | 'Skill Level';
type DBStatus = 'going' | 'maybe' | 'not-going';

type Player = {
    id: string;
    name: string;
    level: string;
    status: Status;
    avatar: string | null;
};

type ClubSession = {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    status: string;
};

const STATUSES: Status[] = [
    'Attending',
    'Maybe',
    'Not Attending',
];

const SORTS: Sort[] = [
    'Name A-Z',
    'Name Z-A',
    'Skill Level',
];

const ICONS = {
    Attending: 'checkmark-circle',
    Maybe: 'help-circle-outline',
    'Not Attending': 'close-circle',
} as const;

const COLORS = {
    Attending: C.green,
    Maybe: C.blue,
    'Not Attending': C.red,
};

const SKILL_ORDER: Record<string, number> = {
    Advanced: 3,
    Intermediate: 2,
    Beginner: 1,
};

function toStatus(value: string): Status {
    if (value === 'going') return 'Attending';
    if (value === 'maybe') return 'Maybe';
    return 'Not Attending';
}

function toDBStatus(value: Status): DBStatus {
    if (value === 'Attending') return 'going';
    if (value === 'Maybe') return 'maybe';
    return 'not-going';
}

function dateKey(date: Date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

function dateText(date: Date) {
    return date.toLocaleDateString('en-IE', {
        day: 'numeric',
        month: 'short',
    });
}

function addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function formatTime(value: string) {
    return new Date(value).toLocaleTimeString('en-IE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

export default function AttendancePage() {
  const { C, s } = useThemeStyles();
    const [selectedDate, setSelectedDate] = useState(
        () => new Date()
    );

    const [userId, setUserId] = useState<string | null>(null);
    const [session, setSession] = useState<ClubSession | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [ownStatus, setOwnStatus] = useState<Status | null>(null);
    const [courtCount, setCourtCount] = useState(0);

    const [filter, setFilter] = useState<Status>('Attending');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<Sort>('Name A-Z');
    const [sortOpen, setSortOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const key = dateKey(selectedDate);

    useEffect(() => {
        let active = true;

        supabase.auth.getUser().then(({ data, error }) => {
            if (!active) return;

            if (error) {
                setError(error.message);
                setLoading(false);
            } else {
                setUserId(data.user?.id ?? null);
                if (!data.user) setLoading(false);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    const load = useCallback(async () => {
        if (!userId) return;

        setLoading(true);

        try {
            const dayStart = new Date(selectedDate);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const [sessionResult, courtsResult] = await Promise.all([
                supabase
                    .from('club_sessions')
                    .select('id, title, starts_at, ends_at, status')
                    .gte('starts_at', dayStart.toISOString())
                    .lt('starts_at', dayEnd.toISOString())
                    .neq('status', 'cancelled')
                    .order('starts_at')
                    .limit(1)
                    .maybeSingle(),

                supabase
                    .from('courts')
                    .select('id')
                    .eq('is_active', true),
            ]);

            if (sessionResult.error) throw sessionResult.error;
            if (courtsResult.error) throw courtsResult.error;

            const selectedSession =
                sessionResult.data as ClubSession | null;

            setCourtCount(courtsResult.data?.length ?? 0);

            if (!selectedSession) {
                setSession(null);
                setPlayers([]);
                setOwnStatus(null);
                setError(null);
                return;
            }

            const [directoryResult, attendanceResult] =
                await Promise.all([
                    supabase.rpc('riverside_session_players', {
                        p_session_id: selectedSession.id,
                    }),

                    supabase
                        .from('session_attendance')
                        .select('status')
                        .eq('session_id', selectedSession.id)
                        .eq('player_id', userId)
                        .maybeSingle(),
                ]);

            if (directoryResult.error) throw directoryResult.error;
            if (attendanceResult.error) throw attendanceResult.error;

            const directory = directoryResult.data ?? [];


            setPlayers(
                directory.map(
                    (player: {
                        player_id: string;
                        display_name: string;
                        skill_level: string | null;
                        attendance_status: string;
                        avatar_url: string | null;
                    }): Player => ({
                        id: player.player_id,
                        name: player.display_name,
                        level: player.skill_level ?? 'Not set',
                        status: toStatus(player.attendance_status),
                        avatar: player.avatar_url,
                    })
                )
            );

            setOwnStatus(
                attendanceResult.data
                    ? toStatus(attendanceResult.data.status)
                    : null
            );

            setSession(selectedSession);
            setError(null);
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : 'Unable to load attendance'
            );
        } finally {
            setLoading(false);
        }
    }, [selectedDate, userId]);

    useEffect(() => {
        if (!userId) return;

        void load();

        const channel = supabase
            .channel(`riverside-attendance-${userId}-${key}`)
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
    }, [key, load, userId]);

    const counts = useMemo(() => ({
        Attending: players.filter(
            p => p.status === 'Attending'
        ).length,
        Maybe: players.filter(
            p => p.status === 'Maybe'
        ).length,
        'Not Attending': players.filter(
            p => p.status === 'Not Attending'
        ).length,
    }), [players]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        return players
            .filter(
                p =>
                    p.status === filter &&
                    p.name.toLowerCase().includes(query)
            )
            .sort((a, b) => {
                if (sort === 'Name Z-A') {
                    return b.name.localeCompare(a.name);
                }

                if (sort === 'Skill Level') {
                    return (
                        (SKILL_ORDER[b.level] ?? 0) -
                        (SKILL_ORDER[a.level] ?? 0)
                    );
                }

                return a.name.localeCompare(b.name);
            });
    }, [players, filter, search, sort]);

    const days = Array.from(
        { length: 5 },
        (_, i) => addDays(selectedDate, i - 2)
    );

    async function changeStatus(status: Status) {
        if (!userId || !session || saving) return;

        setSaving(true);

        try {
            const { error: saveError } = await supabase
                .from('session_attendance')
                .upsert(
                    {
                        session_id: session.id,
                        player_id: userId,
                        status: toDBStatus(status),
                    },
                    { onConflict: 'session_id,player_id' }
                );

            if (saveError) throw saveError;

            setStatusOpen(false);
            await load();
        } catch (e) {
            Alert.alert(
                'Unable to save attendance',
                e instanceof Error ? e.message : 'Please try again.'
            );
        } finally {
            setSaving(false);
        }
    }

    const canChange =
        !!session &&
        session.status !== 'completed' &&
        new Date(session.ends_at) > new Date();

    return (
        <View style={s.root}>
            <View style={s.dateBar}>
                <Pressable
                    onPress={() => setSelectedDate(d => addDays(d, -5))}
                    style={s.dateArrow}
                >
                    <Ionicons
                        name="chevron-back"
                        size={22}
                        color={C.white}
                    />
                </Pressable>

                {days.map(date => {
                    const active = dateKey(date) === key;

                    return (
                        <Pressable
                            key={dateKey(date)}
                            onPress={() => setSelectedDate(date)}
                            style={[s.dateItem, active && s.dateActive]}
                        >
                            <Text style={s.dateDay}>
                                {date.toLocaleDateString('en-IE', {
                                    weekday: 'short',
                                })}
                            </Text>

                            <Text style={s.dateNumber}>
                                {dateText(date)}
                            </Text>

                            {active && <View style={s.dateDot} />}
                        </Pressable>
                    );
                })}

                <Pressable
                    onPress={() => setSelectedDate(d => addDays(d, 5))}
                    style={s.dateArrow}
                >
                    <Ionicons
                        name="chevron-forward"
                        size={22}
                        color={C.white}
                    />
                </Pressable>
            </View>

            {loading && (
                <ActivityIndicator
                    color={C.green}
                    style={{ marginVertical: 10 }}
                />
            )}

            {error && (
                <Pressable onPress={() => void load()}>
                    <Text style={s.error}>
                        {error} · Tap to retry
                    </Text>
                </Pressable>
            )}

            <View style={s.session}>
                <View style={s.sessionIcon}>
                    <Ionicons
                        name="calendar"
                        size={25}
                        color={C.white}
                    />
                </View>

                <View style={{ flex: 1, gap: 5 }}>
                    <Text style={s.sessionTitle}>
                        {session?.title ?? 'No club session'}
                    </Text>

                    <Text style={s.sessionMeta}>
                        {session
                            ? `${formatTime(session.starts_at)} – ${formatTime(
                                session.ends_at
                            )} · ${courtCount} Courts`
                            : 'No session scheduled for this date'}
                    </Text>

                    <View style={s.locationRow}>
                        <Ionicons
                            name="location-outline"
                            size={15}
                            color={C.muted}
                        />
                        <Text style={s.location}>
                            Riverside Badminton Club
                        </Text>
                    </View>
                </View>
            </View>

            <View style={s.stats}>
                {([
                    {
                        label: 'Attending',
                        count: counts.Attending,
                        icon: 'people-outline',
                        color: C.green,
                    },
                    {
                        label: 'Maybe',
                        count: counts.Maybe,
                        icon: 'help-circle-outline',
                        color: C.blue,
                    },
                    {
                        label: 'Not Attending',
                        count: counts['Not Attending'],
                        icon: 'close-circle-outline',
                        color: C.red,
                    },
                    {
                        label: 'Total',
                        count: players.length,
                        icon: 'people-outline',
                        color: C.white,
                    },
                ] as const).map(stat => (
                    <View key={stat.label} style={s.stat}>
                        <Ionicons
                            name={stat.icon}
                            size={22}
                            color={stat.color}
                        />
                        <Text style={s.statNumber}>
                            {stat.count}
                        </Text>
                        <Text style={s.statLabel}>
                            {stat.label}
                        </Text>
                    </View>
                ))}
            </View>

            <Pressable
                style={[
                    s.myAttendance,
                    !canChange && { opacity: 0.65 },
                ]}
                disabled={!canChange}
                onPress={() => setStatusOpen(true)}
            >
                <View>
                    <Text style={s.eyebrow}>YOUR ATTENDANCE</Text>
                    <Text style={s.myStatus}>
                        {session
                            ? ownStatus ?? 'Not Responded'
                            : 'No Session'}
                    </Text>
                </View>

                <View style={s.changeRow}>
                    <Text style={s.changeText}>
                        {canChange ? 'Change' : 'Unavailable'}
                    </Text>
                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={C.green}
                    />
                </View>
            </Pressable>

            <View style={s.filters}>
                {STATUSES.map(status => (
                    <Pressable
                        key={status}
                        onPress={() => setFilter(status)}
                        style={[
                            s.filterButton,
                            filter === status && s.filterActive,
                        ]}
                    >
                        <Text
                            numberOfLines={1}
                            style={[
                                s.filterText,
                                filter === status && s.filterTextActive,
                            ]}
                        >
                            {status} ({counts[status]})
                        </Text>
                    </Pressable>
                ))}
            </View>

            <View style={s.searchRow}>
                <View style={s.searchBox}>
                    <Ionicons
                        name="search"
                        size={19}
                        color={C.muted}
                    />

                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search players..."
                        placeholderTextColor={C.muted}
                        style={s.searchInput}
                        autoCorrect={false}
                    />

                    {search.length > 0 && (
                        <Pressable onPress={() => setSearch('')}>
                            <Ionicons
                                name="close-circle"
                                size={18}
                                color={C.muted}
                            />
                        </Pressable>
                    )}
                </View>

                <Pressable
                    style={s.sortButton}
                    onPress={() => setSortOpen(v => !v)}
                >
                    <Text style={s.sortText} numberOfLines={1}>
                        {sort}
                    </Text>
                    <Ionicons
                        name="chevron-down"
                        size={15}
                        color={C.white}
                    />
                </Pressable>
            </View>

            {sortOpen && (
                <View style={s.sortMenu}>
                    {SORTS.map(option => (
                        <Pressable
                            key={option}
                            style={s.sortOption}
                            onPress={() => {
                                setSort(option);
                                setSortOpen(false);
                            }}
                        >
                            <Text style={s.sortOptionText}>
                                {option}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}

            <View style={s.playerList}>
                {filtered.map(player => (
                    <View key={player.id} style={s.playerRow}>
                        {player.avatar ? (
                            <Image
                                source={{ uri: player.avatar }}
                                style={s.avatar}
                            />
                        ) : (
                            <View style={[s.avatar, s.avatarFallback]}>
                                <Text style={s.avatarInitial}>
                                    {player.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}

                        <View style={s.identity}>
                            <Text
                                style={s.playerName}
                                numberOfLines={1}
                            >
                                {player.name}
                                {player.id === userId ? ' (You)' : ''}
                            </Text>
                        </View>

                        <Text style={s.level} numberOfLines={1}>
                            {player.level}
                        </Text>

                        <View style={s.playerStatus}>
                            <Ionicons
                                name={ICONS[player.status]}
                                size={16}
                                color={COLORS[player.status]}
                            />
                            <Text
                                style={s.playerStatusText}
                                numberOfLines={1}
                            >
                                {player.status}
                            </Text>
                        </View>
                    </View>
                ))}

                {!loading && filtered.length === 0 && (
                    <View style={s.empty}>
                        <Text style={s.emptyText}>
                            {session
                                ? 'No matching players.'
                                : 'Select a date with a club session.'}
                        </Text>
                    </View>
                )}
            </View>

            <Modal
                visible={statusOpen}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (!saving) setStatusOpen(false);
                }}
            >
                <View style={s.modalShade}>
                    <View style={s.modalPanel}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>
                                Your Attendance
                            </Text>

                            <Pressable
                                disabled={saving}
                                onPress={() => setStatusOpen(false)}
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={C.white}
                                />
                            </Pressable>
                        </View>

                        <Text style={s.modalSubtitle}>
                            {session?.title} · {dateText(selectedDate)}
                        </Text>

                        {STATUSES.map(status => (
                            <Pressable
                                key={status}
                                disabled={saving}
                                style={[
                                    s.modalChoice,
                                    saving && { opacity: 0.6 },
                                ]}
                                onPress={() => void changeStatus(status)}
                            >
                                <Ionicons
                                    name={ICONS[status]}
                                    size={23}
                                    color={COLORS[status]}
                                />

                                <Text style={s.modalChoiceText}>
                                    {status}
                                </Text>

                                {ownStatus === status && (
                                    <Ionicons
                                        name="checkmark"
                                        size={21}
                                        color={C.green}
                                    />
                                )}
                            </Pressable>
                        ))}

                        {saving && (
                            <ActivityIndicator color={C.green} />
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
    root: { gap: 12 },
    dateBar: {
        flexDirection: 'row',
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 13,
        padding: 4,
        gap: 3,
        minHeight: 68,
    },
    dateArrow: {
        width: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateItem: {
        flex: 1,
        minWidth: 0,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    dateActive: { backgroundColor: '#008E61' },
    dateDay: { color: C.white, fontSize: 12 },
    dateNumber: {
        color: C.white,
        fontSize: 11,
        fontWeight: '700',
    },
    dateDot: {
        position: 'absolute',
        bottom: 4,
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: C.white,
    },
    session: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 13,
        padding: 13,
    },
    sessionIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#005E48',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sessionTitle: {
        color: C.white,
        fontSize: 18,
        fontWeight: '800',
    },
    sessionMeta: { color: C.muted, fontSize: 13 },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    location: { color: C.white, fontSize: 12 },
    stats: { flexDirection: 'row', gap: 6 },
    stat: {
        flex: 1,
        minWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 13,
        paddingHorizontal: 2,
        backgroundColor: C.tile,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 12,
    },
    statNumber: {
        color: C.white,
        fontSize: 23,
        fontWeight: '800',
    },
    statLabel: {
        color: C.white,
        fontSize: 10,
        textAlign: 'center',
    },
    myAttendance: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    eyebrow: {
        color: C.muted,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    myStatus: {
        color: C.green,
        fontSize: 16,
        fontWeight: '800',
        marginTop: 4,
    },
    changeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    changeText: {
        color: C.green,
        fontSize: 13,
        fontWeight: '700',
    },
    filters: {
        flexDirection: 'row',
        backgroundColor: C.tile,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 12,
        padding: 3,
    },
    filterButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 2,
        borderRadius: 9,
    },
    filterActive: { backgroundColor: '#008E61' },
    filterText: {
        color: C.white,
        fontSize: 11,
        textAlign: 'center',
    },
    filterTextActive: { fontWeight: '800' },
    searchRow: { flexDirection: 'row', gap: 8 },
    searchBox: {
        flex: 1,
        minWidth: 0,
        backgroundColor: C.tile,
        borderRadius: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 43,
    },
    searchInput: {
        flex: 1,
        color: C.white,
        fontSize: 13,
        paddingVertical: 8,
    },
    sortButton: {
        width: 132,
        backgroundColor: C.tile,
        borderRadius: 10,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    sortText: {
        flex: 1,
        color: C.white,
        fontSize: 11,
    },
    sortMenu: {
        backgroundColor: C.tile,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 10,
        overflow: 'hidden',
    },
    sortOption: {
        padding: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.border,
    },
    sortOptionText: { color: C.white, fontSize: 13 },
    playerList: { gap: 3 },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 11,
        paddingHorizontal: 7,
        paddingVertical: 6,
        minHeight: 56,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1.5,
        borderColor: '#D9E6E1',
    },
    avatarFallback: {
        backgroundColor: '#125D48',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        color: C.white,
        fontSize: 15,
        fontWeight: '800',
    },
    identity: { flex: 1, minWidth: 0 },
    playerName: {
        color: C.white,
        fontSize: 12,
        fontWeight: '700',
    },
    level: {
        width: 80,
        color: C.white,
        fontSize: 10,
    },
    playerStatus: {
        width: 91,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#07533F',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 8,
    },
    playerStatusText: {
        flex: 1,
        color: C.white,
        fontSize: 9,
        fontWeight: '600',
    },
    empty: {
        padding: 25,
        alignItems: 'center',
    },
    emptyText: { color: C.muted },
    error: {
        color: C.red,
        textAlign: 'center',
        padding: 12,
    },
    modalShade: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.76)',
        justifyContent: 'center',
        padding: 20,
    },
    modalPanel: {
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.border,
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
    modalSubtitle: {
        color: C.muted,
        fontSize: 13,
    },
    modalChoice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: C.tile,
        borderRadius: 11,
        padding: 14,
    },
    modalChoiceText: {
        flex: 1,
        color: C.white,
        fontSize: 15,
        fontWeight: '700',
    },
});
