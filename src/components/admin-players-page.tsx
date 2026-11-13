
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
    Alert,
    FlatList,
    Image,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

type Icon = React.ComponentProps<typeof Ionicons>['name'];
type Filter = 'All Players' | 'Active' | 'Inactive';
type Sort = 'Name' | 'Matches' | 'Win Rate';

type Profile = {
    id: string;
    full_name: string | null;
    display_name: string | null;
    skill_level?: string | null;
    is_active?: boolean | null;
    active?: boolean | null;
    avatar_url?: string | null;
};

type Match = {
    id: string;
    status: string;
    team_a_score: number | null;
    team_b_score: number | null;
};

type MatchPlayer = {
    match_id: string;
    player_id: string;
    team: string;
};

type Player = {
    id: string;
    name: string;
    skill: string | null;
    avatarUrl: string | null;
    active: boolean | null;
    matches: number;
    wins: number;
    winRate: number | null;
};

const C = {
    bg: '#031B16',
    card: '#06251E',
    tile: '#102C27',
    border: '#185243',
    green: '#00D995',
    text: '#F6FBF8',
    muted: '#A6B8B1',
    red: '#FF9292',
};

function getName(profile: Profile) {
    return (
        profile.display_name?.trim() ||
        profile.full_name?.trim() ||
        'Unnamed Player'
    );
}

function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join('');
}

function getActivity(profile: Profile): boolean | null {
    if (typeof profile.is_active === 'boolean') {
        return profile.is_active;
    }

    if (typeof profile.active === 'boolean') {
        return profile.active;
    }

    return null;
}

function isTeamA(team: string) {
    return ['a', 'team_a', '1'].includes(team.toLowerCase());
}

function isTeamB(team: string) {
    return ['b', 'team_b', '2'].includes(team.toLowerCase());
}

function Stat({
    value,
    label,
}: {
    value: string;
    label: string;
}) {
    return (
        <View style={s.stat}>
            <Text style={s.statValue}>{value}</Text>
            <Text style={s.statLabel}>{label}</Text>
        </View>
    );
}

function PlayerRow({
    player,
    onPress,
}: {
    player: Player;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                s.playerRow,
                pressed && { opacity: 0.7 },
            ]}
        >
            <Ionicons
                name="reorder-three-outline"
                size={23}
                color={C.muted}
            />

            <View style={[s.avatar, { overflow: 'hidden' }]}>
                {player.avatarUrl ? (
                    <Image
                        source={{ uri: player.avatarUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                ) : (
                    <Text style={s.avatarText}>
                        {getInitials(player.name)}
                    </Text>
                )}
            </View>

            <View style={s.playerInfo}>
                <Text
                    style={s.playerName}
                    numberOfLines={1}
                >
                    {player.name}
                </Text>

                {player.skill ? (
                    <View style={s.skillBadge}>
                        <Text style={s.skillText}>
                            {player.skill}
                        </Text>
                    </View>
                ) : (
                    <Text style={s.unknownSkill}>
                        Level not set
                    </Text>
                )}
            </View>

            <Stat
                value={String(player.matches)}
                label="Matches"
            />

            <Stat
                value={
                    player.winRate === null
                        ? '–'
                        : `${player.winRate}%`
                }
                label="Win rate"
            />

            <View style={s.activity}>
                <View
                    style={[
                        s.activityDot,
                        {
                            backgroundColor:
                                player.active === true
                                    ? C.green
                                    : player.active === false
                                        ? '#9EA9A5'
                                        : '#566F67',
                        },
                    ]}
                />

                <Text
                    style={[
                        s.activityText,
                        player.active === true && {
                            color: C.green,
                        },
                    ]}
                >
                    {player.active === true
                        ? 'Active'
                        : player.active === false
                            ? 'Inactive'
                            : 'Unknown'}
                </Text>
            </View>

            <Ionicons
                name="chevron-forward"
                size={18}
                color={C.text}
            />
        </Pressable>
    );
}

export default function AdminPlayersPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [participants, setParticipants] = useState<MatchPlayer[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('All Players');
    const [sort, setSort] = useState<Sort>('Name');

    const [selected, setSelected] = useState<Player | null>(null);
    const [sortOpen, setSortOpen] = useState(false);

    const load = useCallback(async () => {
        setError(null);

        try {
            const [profileResult, matchResult] = await Promise.all([
                supabase.from('profiles').select('*'),
                supabase
                    .from('matches')
                    .select(
                        'id,status,team_a_score,team_b_score'
                    ),
            ]);

            if (profileResult.error) {
                throw profileResult.error;
            }

            if (matchResult.error) {
                throw matchResult.error;
            }

            const loadedProfiles =
                (profileResult.data ?? []) as Profile[];

            const loadedMatches =
                (matchResult.data ?? []) as Match[];

            setProfiles(loadedProfiles);
            setMatches(loadedMatches);

            if (loadedMatches.length === 0) {
                setParticipants([]);
                return;
            }

            const matchIds = loadedMatches.map(match => match.id);
            const allParticipants: MatchPlayer[] = [];

            // Split IDs into batches to avoid oversized queries.
            for (let i = 0; i < matchIds.length; i += 100) {
                const batch = matchIds.slice(i, i + 100);

                const result = await supabase
                    .from('match_players')
                    .select('match_id,player_id,team')
                    .in('match_id', batch);

                if (result.error) {
                    throw result.error;
                }

                allParticipants.push(
                    ...((result.data ?? []) as MatchPlayer[])
                );
            }

            setParticipants(allParticipants);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to load players.'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const players = useMemo<Player[]>(() => {
        const completedMatches = new Map(
            matches
                .filter(match => match.status === 'completed')
                .map(match => [match.id, match])
        );

        const stats = new Map<
            string,
            { matches: number; wins: number; decided: number }
        >();

        for (const participant of participants) {
            const match = completedMatches.get(
                participant.match_id
            );

            if (!match) continue;

            const current = stats.get(
                participant.player_id
            ) ?? {
                matches: 0,
                wins: 0,
                decided: 0,
            };

            current.matches += 1;

            const a = match.team_a_score;
            const b = match.team_b_score;

            if (
                typeof a === 'number' &&
                typeof b === 'number' &&
                a !== b
            ) {
                const won =
                    (isTeamA(participant.team) && a > b) ||
                    (isTeamB(participant.team) && b > a);

                if (
                    isTeamA(participant.team) ||
                    isTeamB(participant.team)
                ) {
                    current.decided += 1;

                    if (won) {
                        current.wins += 1;
                    }
                }
            }

            stats.set(participant.player_id, current);
        }

        return profiles.map(profile => {
            const stat = stats.get(profile.id);

            return {
                id: profile.id,
                name: getName(profile),
                avatarUrl: profile.avatar_url ?? null,
                skill: profile.skill_level ?? null,
                active: getActivity(profile),
                matches: stat?.matches ?? 0,
                wins: stat?.wins ?? 0,
                winRate: stat?.decided
                    ? Math.round(
                        (100 * stat.wins) / stat.decided
                    )
                    : null,
            };
        });
    }, [profiles, matches, participants]);

    const filteredPlayers = useMemo(() => {
        const search = query.trim().toLowerCase();

        const result = players.filter(player => {
            if (
                search &&
                !player.name.toLowerCase().includes(search)
            ) {
                return false;
            }

            if (filter === 'Active') {
                return player.active === true;
            }

            if (filter === 'Inactive') {
                return player.active === false;
            }

            return true;
        });

        result.sort((a, b) => {
            if (sort === 'Matches') {
                return (
                    b.matches - a.matches ||
                    a.name.localeCompare(b.name)
                );
            }

            if (sort === 'Win Rate') {
                return (
                    (b.winRate ?? -1) -
                    (a.winRate ?? -1) ||
                    a.name.localeCompare(b.name)
                );
            }

            return a.name.localeCompare(b.name);
        });

        return result;
    }, [players, query, filter, sort]);

    const activeCount = players.filter(
        player => player.active === true
    ).length;

    const inactiveCount = players.filter(
        player => player.active === false
    ).length;

    const hasActivityField = profiles.some(
        profile =>
            typeof profile.is_active === 'boolean' ||
            typeof profile.active === 'boolean'
    );

    const filters: Filter[] = [
        'All Players',
        'Active',
        'Inactive',
    ];

    const counts = {
        'All Players': players.length,
        Active: activeCount,
        Inactive: inactiveCount,
    };

    return (
        <View style={s.root}>
            <ClubHeader
                title="Players"
                subtitle="Manage club members and player information."
                onNotificationsPress={() =>
                    Alert.alert(
                        'Notifications',
                        'Notifications will be connected in a later step.'
                    )
                }
                onProfilePress={() =>
                    Alert.alert(
                        'Admin Profile',
                        'Open the More tab to manage your account.'
                    )
                }
            />

            <FlatList
                data={filteredPlayers}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <PlayerRow
                        player={item}
                        onPress={() => setSelected(item)}
                    />
                )}
                contentContainerStyle={s.listContent}
                showsVerticalScrollIndicator={false}
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
                ListHeaderComponent={
                    <View style={s.topContent}>
                        {/* SEARCH */}

                        <View style={s.searchRow}>
                            <View style={s.searchBox}>
                                <Ionicons
                                    name="search-outline"
                                    size={24}
                                    color={C.muted}
                                />

                                <TextInput
                                    value={query}
                                    onChangeText={setQuery}
                                    placeholder="Search players..."
                                    placeholderTextColor={C.muted}
                                    style={s.searchInput}
                                    autoCorrect={false}
                                    returnKeyType="search"
                                />

                                {query.length > 0 && (
                                    <Pressable
                                        onPress={() => setQuery('')}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={20}
                                            color={C.muted}
                                        />
                                    </Pressable>
                                )}
                            </View>

                            <Pressable
                                style={s.filterButton}
                                onPress={() =>
                                    setSortOpen(true)
                                }
                            >
                                <Ionicons
                                    name="options-outline"
                                    size={24}
                                    color={C.text}
                                />
                            </Pressable>
                        </View>

                        {/* FILTERS */}

                        <View style={s.filterTabs}>
                            {filters.map(item => (
                                <Pressable
                                    key={item}
                                    onPress={() => setFilter(item)}
                                    style={[
                                        s.filterTab,
                                        filter === item &&
                                        s.filterTabActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            s.filterText,
                                            filter === item &&
                                            s.filterTextActive,
                                        ]}
                                    >
                                        {item}
                                    </Text>

                                    <View style={s.countBadge}>
                                        <Text style={s.countText}>
                                            {counts[item]}
                                        </Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>

                        {/* SORT + ADD */}

                        <View style={s.controls}>
                            <Pressable
                                style={s.sortButton}
                                onPress={() =>
                                    setSortOpen(true)
                                }
                            >
                                <Ionicons
                                    name="swap-vertical-outline"
                                    size={21}
                                    color={C.text}
                                />

                                <Text style={s.sortText}>
                                    Sort: {sort}
                                </Text>

                                <Ionicons
                                    name="chevron-down"
                                    size={16}
                                    color={C.text}
                                />
                            </Pressable>

                            <Pressable
                                style={s.addButton}
                                onPress={() =>
                                    Alert.alert(
                                        'Add Player',
                                        'Player invitations and account creation will be implemented in the next step. No account has been created.'
                                    )
                                }
                            >
                                <Ionicons
                                    name="add"
                                    size={25}
                                    color={C.text}
                                />

                                <Text style={s.addText}>
                                    Add Player
                                </Text>
                            </Pressable>
                        </View>

                        {!hasActivityField &&
                            !loading &&
                            profiles.length > 0 && (
                                <Text style={s.hint}>
                                    Active and inactive filters need an
                                    activity field in your profiles table.
                                    Player status is currently unknown.
                                </Text>
                            )}

                        {error && (
                            <Pressable
                                onPress={() => void load()}
                                style={s.errorBox}
                            >
                                <Text style={s.errorText}>
                                    {error}
                                </Text>
                                <Text style={s.retryText}>
                                    Tap to retry
                                </Text>
                            </Pressable>
                        )}

                        {loading && (
                            <ActivityIndicator
                                color={C.green}
                                size="large"
                                style={{ marginVertical: 25 }}
                            />
                        )}
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={s.empty}>
                            <Ionicons
                                name="people-outline"
                                size={38}
                                color={C.muted}
                            />

                            <Text style={s.emptyTitle}>
                                No players found
                            </Text>

                            <Text style={s.emptySubtitle}>
                                {query
                                    ? 'Try another search.'
                                    : filter !== 'All Players'
                                        ? 'No players match this status.'
                                        : 'No player profiles are available.'}
                            </Text>
                        </View>
                    ) : undefined
                }
            />

            {/* SORT MODAL */}

            <Modal
                visible={sortOpen}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setSortOpen(false)
                }
            >
                <Pressable
                    style={s.overlay}
                    onPress={() =>
                        setSortOpen(false)
                    }
                >
                    <View style={s.modalCard}>
                        <Text style={s.modalTitle}>
                            Sort Players
                        </Text>

                        {(
                            ['Name', 'Matches', 'Win Rate'] as Sort[]
                        ).map(item => (
                            <Pressable
                                key={item}
                                style={s.modalOption}
                                onPress={() => {
                                    setSort(item);
                                    setSortOpen(false);
                                }}
                            >
                                <Text style={s.modalOptionText}>
                                    {item}
                                </Text>

                                {sort === item && (
                                    <Ionicons
                                        name="checkmark"
                                        size={22}
                                        color={C.green}
                                    />
                                )}
                            </Pressable>
                        ))}
                    </View>
                </Pressable>
            </Modal>

            {/* PLAYER DETAILS */}

            <Modal
                visible={selected !== null}
                transparent
                animationType="slide"
                onRequestClose={() =>
                    setSelected(null)
                }
            >
                <View style={s.overlay}>
                    <View style={s.detailsCard}>
                        <Pressable
                            onPress={() =>
                                setSelected(null)
                            }
                            style={s.closeButton}
                        >
                            <Ionicons
                                name="close"
                                size={24}
                                color={C.text}
                            />
                        </Pressable>

                        {selected && (
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={[s.detailsAvatar, { overflow: 'hidden' }]}>
                                    {selected.avatarUrl ? (
                                        <Image
                                            source={{ uri: selected.avatarUrl }}
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Text style={s.detailsInitials}>
                                            {getInitials(selected.name)}
                                        </Text>
                                    )}
                                </View>

                                <Text style={s.detailsName}>
                                    {selected.name}
                                </Text>

                                <Text style={s.detailsSkill}>
                                    {selected.skill ??
                                        'Skill level not set'}
                                </Text>

                                <View style={s.detailsStats}>
                                    <Stat
                                        value={String(
                                            selected.matches
                                        )}
                                        label="Matches"
                                    />

                                    <Stat
                                        value={String(
                                            selected.wins
                                        )}
                                        label="Wins"
                                    />

                                    <Stat
                                        value={
                                            selected.winRate === null
                                                ? '–'
                                                : `${selected.winRate}%`
                                        }
                                        label="Win rate"
                                    />
                                </View>

                                <View style={s.detailsStatus}>
                                    <Ionicons
                                        name="ellipse"
                                        size={12}
                                        color={
                                            selected.active === true
                                                ? C.green
                                                : C.muted
                                        }
                                    />

                                    <Text style={s.detailsStatusText}>
                                        {selected.active === null
                                            ? 'Activity status unavailable'
                                            : selected.active
                                                ? 'Active player'
                                                : 'Inactive player'}
                                    </Text>
                                </View>

                                <Text style={s.detailsNote}>
                                    Player editing, skill-level management,
                                    and account activation will be added
                                    in the next development step.
                                </Text>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },
    listContent: {
        paddingHorizontal: 12,
        paddingBottom: 28,
        gap: 3,
    },
    topContent: {
        paddingTop: 14,
        paddingBottom: 14,
        gap: 16,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 10,
    },
    searchBox: {
        flex: 1,
        height: 54,
        borderWidth: 1,
        borderColor: '#315149',
        backgroundColor: C.tile,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        color: C.text,
        fontSize: 16,
    },
    filterButton: {
        width: 54,
        height: 54,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.tile,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterTabs: {
        flexDirection: 'row',
        backgroundColor: '#071E19',
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 14,
        padding: 3,
    },
    filterTab: {
        flex: 1,
        minHeight: 49,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        borderRadius: 11,
    },
    filterTabActive: {
        backgroundColor: '#007D5A',
        borderWidth: 1,
        borderColor: C.green,
    },
    filterText: {
        color: C.text,
        fontSize: 12,
        fontWeight: '600',
    },
    filterTextActive: {
        fontWeight: '800',
    },
    countBadge: {
        minWidth: 25,
        paddingHorizontal: 5,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#1A3931',
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        color: C.text,
        fontSize: 12,
        fontWeight: '700',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    sortButton: {
        flex: 1,
        minHeight: 49,
        borderWidth: 1,
        borderColor: '#315149',
        backgroundColor: C.tile,
        borderRadius: 12,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
    },
    sortText: {
        color: C.text,
        fontSize: 13,
        fontWeight: '600',
    },
    addButton: {
        flex: 1,
        minHeight: 49,
        backgroundColor: '#00B985',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addText: {
        color: C.text,
        fontSize: 14,
        fontWeight: '800',
    },
    playerRow: {
        minHeight: 83,
        backgroundColor: '#04221C',
        borderWidth: 1,
        borderColor: '#0D3D31',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 9,
        gap: 7,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#126B57',
        borderWidth: 1,
        borderColor: '#28A887',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: C.text,
        fontSize: 14,
        fontWeight: '800',
    },
    playerInfo: {
        flex: 1,
        minWidth: 0,
        gap: 6,
    },
    playerName: {
        color: C.text,
        fontSize: 13,
        fontWeight: '700',
    },
    skillBadge: {
        alignSelf: 'flex-start',
        borderRadius: 12,
        backgroundColor: '#1D3933',
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    skillText: {
        color: '#D4DFDA',
        fontSize: 10,
    },
    unknownSkill: {
        color: C.muted,
        fontSize: 10,
    },
    stat: {
        minWidth: 38,
        alignItems: 'center',
        gap: 3,
    },
    statValue: {
        color: C.text,
        fontSize: 16,
        fontWeight: '700',
    },
    statLabel: {
        color: C.muted,
        fontSize: 9,
    },
    activity: {
        width: 53,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    activityDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    activityText: {
        color: C.muted,
        fontSize: 9,
    },
    hint: {
        color: C.muted,
        fontSize: 11,
        lineHeight: 17,
    },
    errorBox: {
        borderWidth: 1,
        borderColor: '#9D4A4A',
        borderRadius: 12,
        padding: 12,
    },
    errorText: {
        color: C.red,
        fontSize: 12,
    },
    retryText: {
        color: C.green,
        marginTop: 6,
        fontSize: 12,
    },
    empty: {
        paddingVertical: 55,
        alignItems: 'center',
        gap: 10,
    },
    emptyTitle: {
        color: C.text,
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubtitle: {
        color: C.muted,
        fontSize: 13,
        textAlign: 'center',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: C.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        gap: 10,
    },
    modalTitle: {
        color: C.text,
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 12,
    },
    modalOption: {
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    modalOptionText: {
        color: C.text,
        fontSize: 16,
    },
    detailsCard: {
        backgroundColor: C.card,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 24,
        maxHeight: '85%',
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: 5,
    },
    detailsAvatar: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: '#126B57',
        borderWidth: 2,
        borderColor: C.green,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 8,
    },
    detailsInitials: {
        color: C.text,
        fontSize: 27,
        fontWeight: '800',
    },
    detailsName: {
        color: C.text,
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 15,
    },
    detailsSkill: {
        color: C.muted,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 5,
    },
    detailsStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 25,
        marginTop: 15,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: C.border,
    },
    detailsStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        marginTop: 20,
    },
    detailsStatusText: {
        color: C.text,
        fontSize: 14,
    },
    detailsNote: {
        color: C.muted,
        fontSize: 12,
        lineHeight: 19,
        textAlign: 'center',
        marginTop: 22,
        marginBottom: 20,
    },
});
