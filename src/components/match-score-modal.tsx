
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export type GameScore = {
    a: number;
    b: number;
};

export type MatchResult = {
    games: GameScore[];
    completed: boolean;
};

export type ScoreMatch = {
    id: string;
    round: number;
    court: number;
    type: 'Singles' | 'Doubles';
    date: string;
    time: string;
    teamA: string[];
    teamB: string[];
};

type Props = {
    match: ScoreMatch | null;
    result?: MatchResult;
    onClose: () => void;
    onSave: (matchId: string, result: MatchResult) => void;
};

const C = {
    bg: '#031B16',
    card: '#06251E',
    tile: '#102C27',
    border: '#185243',
    mint: '#78DCC0',
    green: '#00D995',
    white: '#F6FBF8',
    muted: '#A6B8B1',
};

function winner(game: GameScore): 'a' | 'b' | null {
    const highest = Math.max(game.a, game.b);
    const difference = Math.abs(game.a - game.b);

    if (
        (highest >= 21 && difference >= 2) ||
        (highest === 30 && difference >= 1)
    ) {
        return game.a > game.b ? 'a' : 'b';
    }

    return null;
}

function gameWins(games: GameScore[]) {
    return games.reduce(
        (total, game) => {
            const side = winner(game);
            if (side) total[side]++;
            return total;
        },
        { a: 0, b: 0 }
    );
}

function canIncrement(game: GameScore, side: 'a' | 'b') {
    if (winner(game)) return false;

    const current = game[side];
    const other = game[side === 'a' ? 'b' : 'a'];

    if (current >= 30) return false;

    // At 29-all, the next point decides the game.
    if (current === 29 && other === 29) return true;

    return true;
}

export default function MatchScoreModal({
    match,
    result,
    onClose,
    onSave,
}: Props) {
    const [games, setGames] = useState<GameScore[]>([
        { a: 0, b: 0 },
    ]);

    useEffect(() => {
        if (match) {
            setGames(
                result?.games?.length
                    ? result.games.map(g => ({ ...g }))
                    : [{ a: 0, b: 0 }]
            );
        }
    }, [match?.id, result]);

    if (!match) return null;

    const wins = gameWins(games);
    const completed = wins.a === 2 || wins.b === 2;
    const finalWinner = wins.a === 2 ? 'a' : wins.b === 2 ? 'b' : null;
    const activeIndex = games.length - 1;
    const activeGame = games[activeIndex];
    const activeWinner = winner(activeGame);

    function changePoint(
        index: number,
        side: 'a' | 'b',
        amount: 1 | -1
    ) {
        if (completed || index !== activeIndex) return;

        const game = games[index];
        if (amount === 1 && !canIncrement(game, side)) return;
        if (amount === -1 && game[side] <= 0) return;

        setGames(previous =>
            previous.map((g, i) =>
                i === index
                    ? { ...g, [side]: g[side] + amount }
                    : g
            )
        );
    }

    function nextGame() {
        if (!activeWinner || completed || games.length >= 3) return;
        setGames(previous => [...previous, { a: 0, b: 0 }]);
    }

    function save() {
        if (!match) return;

        onSave(match.id, {
            games: games.map(g => ({ ...g })),
            completed,
        });

        onClose();
    }

    function reset() {
        Alert.alert(
            'Reset demonstration score?',
            'All entered game scores for this match will be cleared.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => setGames([{ a: 0, b: 0 }]),
                },
            ]
        );
    }

    return (
        <Modal
            visible={!!match}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View style={s.root}>
                <View style={s.header}>
                    <Pressable onPress={onClose} style={s.iconButton}>
                        <Ionicons
                            name="arrow-back"
                            size={23}
                            color={C.white}
                        />
                    </Pressable>

                    <Text style={s.headerTitle}>Match Details</Text>

                    <Pressable onPress={reset} style={s.iconButton}>
                        <Ionicons
                            name="refresh-outline"
                            size={22}
                            color={C.muted}
                        />
                    </Pressable>
                </View>

                <ScrollView
                    contentContainerStyle={s.content}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={s.matchInfo}>
                        <View style={s.roundRow}>
                            <Text style={s.round}>Round {match.round}</Text>
                            <View style={s.badge}>
                                <Text style={s.badgeText}>{match.type}</Text>
                            </View>
                        </View>

                        <Text style={s.meta}>
                            {match.date} · {match.time} · Court {match.court}
                        </Text>
                    </View>

                    <View style={s.scoreCard}>
                        <Text style={s.cardEyebrow}>MATCH SCORE</Text>

                        <View style={s.teams}>
                            <View style={s.team}>
                                <Text style={s.teamName}>
                                    {match.teamA.join(' & ')}
                                </Text>
                                <Text style={s.gamesWon}>{wins.a}</Text>
                            </View>

                            <Text style={s.separator}>:</Text>

                            <View style={s.team}>
                                <Text style={s.teamName}>
                                    {match.teamB.join(' & ')}
                                </Text>
                                <Text style={s.gamesWon}>{wins.b}</Text>
                            </View>
                        </View>

                        <Text style={s.scoreCaption}>
                            {completed
                                ? `${finalWinner === 'a'
                                    ? match.teamA.join(' & ')
                                    : match.teamB.join(' & ')} wins the match`
                                : `Game ${games.length} · Best of 3`}
                        </Text>
                    </View>

                    <Text style={s.sectionTitle}>Game Scores</Text>

                    {games.map((game, index) => {
                        const gameWinner = winner(game);
                        const isActive = index === activeIndex && !completed;

                        return (
                            <View key={index} style={s.gameCard}>
                                <View style={s.gameHeader}>
                                    <Text style={s.gameTitle}>
                                        Game {index + 1}
                                    </Text>
                                    <Text style={s.gameStatus}>
                                        {gameWinner
                                            ? 'Finished'
                                            : isActive
                                                ? 'In progress'
                                                : 'Not started'}
                                    </Text>
                                </View>

                                <View style={s.scoreRow}>
                                    {(['a', 'b'] as const).map(side => (
                                        <View key={side} style={s.scoreSide}>
                                            <Text
                                                numberOfLines={1}
                                                style={s.sideName}
                                            >
                                                {side === 'a'
                                                    ? match.teamA.join(' & ')
                                                    : match.teamB.join(' & ')}
                                            </Text>

                                            <Text style={s.points}>
                                                {game[side]}
                                            </Text>

                                            <View style={s.controls}>
                                                <Pressable
                                                    disabled={!isActive || game[side] === 0}
                                                    onPress={() =>
                                                        changePoint(index, side, -1)
                                                    }
                                                    style={s.minus}
                                                >
                                                    <Ionicons
                                                        name="remove"
                                                        size={23}
                                                        color={C.white}
                                                    />
                                                </Pressable>

                                                <Pressable
                                                    disabled={
                                                        !isActive ||
                                                        !canIncrement(game, side)
                                                    }
                                                    onPress={() =>
                                                        changePoint(index, side, 1)
                                                    }
                                                    style={[
                                                        s.plus,
                                                        !isActive && s.disabled,
                                                    ]}
                                                >
                                                    <Ionicons
                                                        name="add"
                                                        size={25}
                                                        color={C.white}
                                                    />
                                                </Pressable>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        );
                    })}

                    {!completed && activeWinner && games.length < 3 && (
                        <Pressable
                            style={s.nextButton}
                            onPress={nextGame}
                        >
                            <Text style={s.nextText}>
                                Start Game {games.length + 1}
                            </Text>
                            <Ionicons
                                name="arrow-forward"
                                size={19}
                                color={C.green}
                            />
                        </Pressable>
                    )}

                    {completed && (
                        <View style={s.completedBanner}>
                            <Ionicons
                                name="trophy-outline"
                                size={25}
                                color={C.green}
                            />
                            <Text style={s.completedText}>
                                Match completed
                            </Text>
                        </View>
                    )}

                    <Text style={s.note}>
                        Demonstration scoring only. Scores are stored in
                        app memory and are not official club results.
                    </Text>
                </ScrollView>

                <View style={s.footer}>
                    <Pressable onPress={save} style={s.saveButton}>
                        <Ionicons
                            name="checkmark"
                            size={23}
                            color={C.white}
                        />
                        <Text style={s.saveText}>
                            {completed ? 'Save Final Score' : 'Save Score'}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        paddingTop: 58,
        paddingHorizontal: 18,
        paddingBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    iconButton: { padding: 7 },
    headerTitle: {
        color: C.white,
        fontSize: 18,
        fontWeight: '800',
    },
    content: {
        padding: 18,
        paddingBottom: 35,
        gap: 16,
    },
    matchInfo: { gap: 7 },
    roundRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    round: {
        color: C.white,
        fontSize: 27,
        fontWeight: '800',
    },
    badge: {
        backgroundColor: '#6540B2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    badgeText: {
        color: C.white,
        fontWeight: '700',
    },
    meta: { color: C.muted, fontSize: 14 },
    scoreCard: {
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 18,
        padding: 20,
        gap: 12,
    },
    cardEyebrow: {
        color: C.mint,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.2,
        textAlign: 'center',
    },
    teams: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    team: {
        flex: 1,
        alignItems: 'center',
        gap: 10,
    },
    teamName: {
        color: C.white,
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
    gamesWon: {
        color: C.white,
        fontSize: 48,
        fontWeight: '800',
    },
    separator: {
        color: C.muted,
        fontSize: 30,
        paddingHorizontal: 12,
    },
    scoreCaption: {
        color: C.mint,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '700',
    },
    sectionTitle: {
        color: C.white,
        fontSize: 20,
        fontWeight: '800',
    },
    gameCard: {
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 16,
        padding: 15,
        gap: 15,
    },
    gameHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    gameTitle: {
        color: C.white,
        fontSize: 16,
        fontWeight: '800',
    },
    gameStatus: { color: C.mint, fontSize: 12 },
    scoreRow: { flexDirection: 'row', gap: 12 },
    scoreSide: {
        flex: 1,
        backgroundColor: C.tile,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        gap: 10,
    },
    sideName: {
        color: C.white,
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    points: {
        color: C.white,
        fontSize: 46,
        fontWeight: '800',
    },
    controls: { flexDirection: 'row', gap: 9 },
    minus: {
        width: 48,
        height: 42,
        borderRadius: 10,
        backgroundColor: '#305148',
        alignItems: 'center',
        justifyContent: 'center',
    },
    plus: {
        width: 48,
        height: 42,
        borderRadius: 10,
        backgroundColor: '#009D70',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabled: { opacity: 0.35 },
    nextButton: {
        borderWidth: 1,
        borderColor: C.green,
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        alignItems: 'center',
    },
    nextText: { color: C.green, fontWeight: '800' },
    completedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 15,
    },
    completedText: {
        color: C.green,
        fontSize: 17,
        fontWeight: '800',
    },
    note: {
        color: C.muted,
        fontSize: 11,
        lineHeight: 17,
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    saveButton: {
        backgroundColor: '#009D70',
        borderRadius: 12,
        minHeight: 53,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 9,
    },
    saveText: {
        color: C.white,
        fontSize: 16,
        fontWeight: '800',
    },
});
