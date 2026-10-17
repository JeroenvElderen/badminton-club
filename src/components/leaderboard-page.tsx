
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const C = {
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
};

const HERO = require('../../assets/images/shuttleheader.png');

type RankingMode = 'Win Rate' | 'Matches' | 'Points' | 'Form';
type Skill = 'Beginner' | 'Intermediate' | 'Advanced';

type Player = {
  id: number;
  name: string;
  skill: Skill;
  winRate: number;
  matches: number;
  points: number;
  form: number[];
  avatar: number;
};

const PLAYERS: Player[] = [
  {
    id: 1,
    name: 'Priya Sharma',
    skill: 'Advanced',
    winRate: 67,
    matches: 24,
    points: 6.1,
    form: [1, 1, 0, 1, 1],
    avatar: 47,
  },
  {
    id: 2,
    name: 'Alex Tan',
    skill: 'Intermediate',
    winRate: 58,
    matches: 24,
    points: 5.2,
    form: [1, 0, 1, 1, 0],
    avatar: 12,
  },
  {
    id: 3,
    name: 'Emily Wong',
    skill: 'Beginner',
    winRate: 54,
    matches: 22,
    points: 4.8,
    form: [1, 1, 0, 0, 1],
    avatar: 44,
  },
  {
    id: 4,
    name: 'Daniel Kim',
    skill: 'Intermediate',
    winRate: 52,
    matches: 26,
    points: 4.6,
    form: [1, 0, 1, 0, 1],
    avatar: 11,
  },
  {
    id: 5,
    name: 'James Lee',
    skill: 'Intermediate',
    winRate: 50,
    matches: 16,
    points: 4.3,
    form: [0, 1, 1, 0, 1],
    avatar: 15,
  },
  {
    id: 6,
    name: 'Sarah Lim',
    skill: 'Advanced',
    winRate: 48,
    matches: 25,
    points: 4.1,
    form: [1, 0, 0, 1, 0],
    avatar: 45,
  },
  {
    id: 7,
    name: 'Mark Chen',
    skill: 'Intermediate',
    winRate: 45,
    matches: 22,
    points: 3.9,
    form: [0, 1, 0, 1, 0],
    avatar: 14,
  },
  {
    id: 8,
    name: 'Hannah Ng',
    skill: 'Beginner',
    winRate: 43,
    matches: 20,
    points: 3.6,
    form: [1, 0, 0, 0, 1],
    avatar: 48,
  },
  {
    id: 9,
    name: 'Tom Wilson',
    skill: 'Beginner',
    winRate: 40,
    matches: 15,
    points: 3.2,
    form: [0, 0, 1, 0, 1],
    avatar: 13,
  },
  {
    id: 10,
    name: 'Laura Bennett',
    skill: 'Beginner',
    winRate: 38,
    matches: 12,
    points: 3.0,
    form: [0, 1, 0, 0, 1],
    avatar: 49,
  },
];

const MODES: RankingMode[] = [
  'Win Rate',
  'Matches',
  'Points',
  'Form',
];

function Avatar({
  image,
  size = 42,
}: {
  image: number;
  size?: number;
}) {
  return (
    <Image
      source={{
        uri: `https://i.pravatar.cc/150?img=${image}`,
      }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: '#E5F0EB',
        backgroundColor: C.tile,
      }}
    />
  );
}

function SkillBadge({ skill }: { skill: Skill }) {
  const color =
    skill === 'Advanced'
      ? C.pink
      : skill === 'Intermediate'
        ? C.blue
        : '#AA267D';

  return (
    <View style={[s.skillBadge, { backgroundColor: color }]}>
      <Text style={s.skillText}>{skill}</Text>
    </View>
  );
}

function FormDots({ form }: { form: number[] }) {
  return (
    <View style={s.formDots}>
      {form.map((result, index) => (
        <View
          key={index}
          style={[
            s.formDot,
            {
              backgroundColor: result ? C.green : '#F35A66',
            },
          ]}
        >
          <Text style={s.formDotText}>
            {result ? 'W' : 'L'}
          </Text>
        </View>
      ))}
    </View>
  );
}

function RankMedal({ rank }: { rank: number }) {
  const color =
    rank === 1
      ? C.gold
      : rank === 2
        ? C.silver
        : C.bronze;

  return (
    <View style={[s.medal, { backgroundColor: color }]}>
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

  const primaryValue =
    mode === 'Win Rate'
      ? `${player.winRate}%`
      : mode === 'Matches'
        ? `${player.matches}`
        : mode === 'Points'
          ? player.points.toFixed(1)
          : `${player.form.reduce((sum, result) => sum + result, 0)}/5`;

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
            StyleSheet.absoluteFillObject,
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

      <Avatar image={player.avatar} size={43} />

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
            minimumFontScale={0.75}
          >
            {primaryValue}
          </Text>
          <Text style={s.statCaption} numberOfLines={1}>
            {primaryLabel}
          </Text>
        </View>

        <View style={s.statCell}>
          <Text style={s.statNumber}>
            {mode === 'Matches'
              ? `${player.winRate}%`
              : player.matches}
          </Text>
          <Text style={s.statCaption} numberOfLines={1}>
            {mode === 'Matches' ? 'Win Rate' : 'Matches'}
          </Text>
        </View>

        <View style={s.statCell}>
          <Text style={s.statNumber}>
            {mode === 'Points'
              ? `${player.winRate}%`
              : player.points.toFixed(1)}
          </Text>
          <Text style={s.statCaption} numberOfLines={1}>
            {mode === 'Points' ? 'Win Rate' : 'Avg. Points'}
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={C.white}
        style={s.rowArrow}
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
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
        />

        <View style={s.modalCard}>
          <View style={s.modalTop}>
            <Text style={s.modalHeading}>Player Profile</Text>

            <Pressable onPress={onClose} style={s.closeButton}>
              <Ionicons
                name="close"
                size={20}
                color={C.white}
              />
            </Pressable>
          </View>

          <View style={s.modalIdentity}>
            <Avatar image={player.avatar} size={72} />

            <Text style={s.modalName}>{player.name}</Text>

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
              <Text style={s.modalStatLabel}>Win Rate</Text>
            </View>

            <View style={s.modalStat}>
              <Text style={s.modalStatValue}>
                {player.matches}
              </Text>
              <Text style={s.modalStatLabel}>Matches</Text>
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

          <Text style={s.formHeading}>Recent Form</Text>

          <FormDots form={player.form} />

          <Pressable
            style={s.doneButton}
            onPress={onClose}
          >
            <Text style={s.doneText}>Close Profile</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function LeaderboardPage() {
  const [mode, setMode] = useState<RankingMode>('Win Rate');
  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null);

  const rankedPlayers = useMemo(() => {
    const players = [...PLAYERS];

    return players.sort((a, b) => {
      if (mode === 'Win Rate') {
        return b.winRate - a.winRate || b.matches - a.matches;
      }

      if (mode === 'Matches') {
        return b.matches - a.matches || b.winRate - a.winRate;
      }

      if (mode === 'Points') {
        return b.points - a.points || b.winRate - a.winRate;
      }

      const aForm = a.form.reduce((sum, value) => sum + value, 0);
      const bForm = b.form.reduce((sum, value) => sum + value, 0);

      return bForm - aForm || b.winRate - a.winRate;
    });
  }, [mode]);

  const selectedRank = selectedPlayer
    ? rankedPlayers.findIndex(
        player => player.id === selectedPlayer.id,
      ) + 1
    : 0;

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <View style={s.hero}>
          <Image
            source={HERO}
            resizeMode="cover"
            style={s.heroImage}
          />

          <View
            pointerEvents="none"
            style={s.heroTint}
          />

          <LinearGradient
            colors={[
              'rgba(3,27,22,0.48)',
              'rgba(3,27,22,0.12)',
              'rgba(3,27,22,0.18)',
              'rgba(3,27,22,0.58)',
              'rgba(3,27,22,0.88)',
              C.bg,
            ]}
            locations={[0, 0.2, 0.4, 0.62, 0.82, 1]}
            style={s.heroOverlay}
          >
            <View style={s.brandRow}>
              <View style={s.brand}>
                <Text style={s.brandIcon}>🏸</Text>

                <View>
                  <Text style={s.brandText}>Riverside</Text>
                  <Text style={s.brandText}>Badminton Club</Text>
                </View>
              </View>

              <View style={s.brandRight}>
                <View style={s.bell}>
                  <Ionicons
                    name="notifications-outline"
                    size={25}
                    color={C.white}
                  />
                  <View style={s.redDot} />
                </View>

                <Avatar image={12} size={43} />
              </View>
            </View>

            <View style={s.titleBlock}>
              <Text style={s.heroTitle}>
                Leader
                <Text style={s.heroMint}>board</Text>
              </Text>

              <Text style={s.heroSubtitle}>
                See how all players are performing
              </Text>
            </View>
          </LinearGradient>
        </View>

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

          <View style={s.list}>
            {rankedPlayers.map((player, index) => (
              <PlayerRow
                key={player.id}
                player={player}
                rank={index + 1}
                mode={mode}
                onPress={() => setSelectedPlayer(player)}
              />
            ))}
          </View>

          <Text style={s.demoNote}>
            DEMONSTRATION LEADERBOARD · NOT YET CONNECTED TO MATCH RESULTS
          </Text>
        </View>
      </ScrollView>

      <PlayerDetail
        player={selectedPlayer}
        rank={selectedRank}
        visible={selectedPlayer !== null}
        onClose={() => setSelectedPlayer(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingBottom: 26,
  },

  hero: {
    height: 210,
    overflow: 'hidden',
    backgroundColor: C.bg,
  },
  heroImage: {
    position: 'absolute',
    width: '150%',
    height: '105%',
    right: -40,
    top: 1,
  },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,42,32,0.14)',
  },
  heroOverlay: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  brandRow: {
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    fontSize: 29,
  },
  brandText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  brandRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  bell: {
    padding: 4,
  },
  redDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4F5C',
  },
  titleBlock: {
    paddingBottom: 28,
  },
  heroTitle: {
    color: C.white,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroMint: {
    color: C.mint,
  },
  heroSubtitle: {
    color: C.white,
    fontSize: 13,
    marginTop: 1,
  },

  content: {
    paddingHorizontal: 12,
    gap: 10,
    marginTop: -3,
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
  rowArrow: {
    marginLeft: -3,
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
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
  demoNote: {
    color: '#739A8B',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.3,
  },
});
