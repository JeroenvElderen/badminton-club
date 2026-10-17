
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import AttendancePage from './attendance-page';
import MatchScoreModal, {
    type MatchResult,
} from './match-score-modal';

const C = {
  bg: '#031B16',
  card: '#06251E',
  tile: '#102C27',
  border: '#185243',
  green: '#00D995',
  mint: '#78DCC0',
  white: '#F6FBF8',
  muted: '#A6B8B1',
};

const HERO = require('../../assets/images/shuttleheader.png');

const PEOPLE: Record<string, number> = {
  You: 12,
  Priya: 47,
  Mark: 13,
  Daniel: 11,
  Emily: 44,
  Tom: 15,
  Laura: 49,
  Sarah: 45,
  Hannah: 48,
  Chris: 14,
  James: 16,
};

type Section = 'Matches' | 'Attendance';
type Filter = 'Upcoming' | 'Today' | 'Past';
type MatchType = 'Doubles' | 'Singles';

type Match = {
  id: string;
  group: Filter;
  date: string;
  time: string;
  end: string;
  round: number;
  court: number;
  type: MatchType;
  teamA: string[];
  teamB: string[];
};

const MATCHES: Match[] = [
  {
    id: 'm1',
    group: 'Today',
    date: 'Today',
    time: '19:00',
    end: '20:00',
    round: 3,
    court: 2,
    type: 'Doubles',
    teamA: ['You', 'Priya'],
    teamB: ['Mark', 'Daniel'],
  },
  {
    id: 'm2',
    group: 'Today',
    date: 'Today',
    time: '20:00',
    end: '21:00',
    round: 4,
    court: 1,
    type: 'Singles',
    teamA: ['You'],
    teamB: ['James'],
  },
  {
    id: 'm3',
    group: 'Upcoming',
    date: 'Thu 24 Apr',
    time: '19:00',
    end: '20:00',
    round: 5,
    court: 3,
    type: 'Doubles',
    teamA: ['You', 'Emily'],
    teamB: ['Tom', 'Laura'],
  },
  {
    id: 'm4',
    group: 'Upcoming',
    date: 'Sat 26 Apr',
    time: '18:30',
    end: '19:30',
    round: 6,
    court: 1,
    type: 'Doubles',
    teamA: ['You', 'Sarah'],
    teamB: ['Hannah', 'Chris'],
  },
  {
    id: 'm5',
    group: 'Upcoming',
    date: 'Mon 28 Apr',
    time: '19:00',
    end: '20:00',
    round: 7,
    court: 4,
    type: 'Singles',
    teamA: ['You'],
    teamB: ['Tom'],
  },
  {
    id: 'm6',
    group: 'Upcoming',
    date: 'Wed 30 Apr',
    time: '20:00',
    end: '21:00',
    round: 8,
    court: 2,
    type: 'Doubles',
    teamA: ['You', 'Laura'],
    teamB: ['Mark', 'Emily'],
  },
  {
    id: 'm7',
    group: 'Past',
    date: 'Mon 14 Apr',
    time: '19:00',
    end: '20:00',
    round: 1,
    court: 1,
    type: 'Singles',
    teamA: ['You'],
    teamB: ['Daniel'],
  },
  {
    id: 'm8',
    group: 'Past',
    date: 'Wed 16 Apr',
    time: '20:00',
    end: '21:00',
    round: 2,
    court: 3,
    type: 'Doubles',
    teamA: ['You', 'Priya'],
    teamB: ['Tom', 'Sarah'],
  },
];

function PlayerFaces({ names }: { names: string[] }) {
  return (
    <View style={s.faces}>
      {names.map((name, index) => (
        <View
          key={`${name}-${index}`}
          style={index > 0 ? s.faceOverlap : undefined}
        >
          {PEOPLE[name] ? (
            <Image
              source={{
                uri: `https://i.pravatar.cc/150?img=${PEOPLE[name]}`,
              }}
              style={s.face}
            />
          ) : (
            <View style={[s.face, s.faceFallback]}>
              <Text style={s.initial}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function Team({ names }: { names: string[] }) {
  return (
    <View style={s.team}>
      <PlayerFaces names={names} />
      <Text numberOfLines={1} style={s.teamName}>
        {names.join(' & ')}
      </Text>
    </View>
  );
}

function MatchCard({
  match,
  onPress,
  hasResult,
}: {
  match: Match;
  onPress: () => void;
  hasResult: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.matchCard,
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={s.matchDate}>
        {match.group !== 'Today' && (
          <Text style={s.dateLabel}>{match.date}</Text>
        )}

        <Text style={s.time}>{match.time}</Text>
        <Text style={s.endTime}>{match.end}</Text>
      </View>

      <View style={s.accentLine} />

      <View style={s.matchBody}>
        <View style={s.matchTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.round}>Round {match.round}</Text>

            <Text style={s.matchMeta}>
              Court {match.court} · {match.type}
            </Text>
          </View>

          <View
            style={[
              s.typeBadge,
              match.type === 'Singles' && s.singlesBadge,
            ]}
          >
            <Text style={s.typeText}>{match.type}</Text>
          </View>
        </View>

        <View style={s.teams}>
          <Team names={match.teamA} />
          <Text style={s.vs}>vs</Text>
          <Team names={match.teamB} />
        </View>

        {hasResult && (
          <View style={s.savedResult}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={C.green}
            />
            <Text style={s.savedResultText}>Score saved</Text>
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

export default function MatchesPage() {
  const [section, setSection] = useState<Section>('Matches');
  const [filter, setFilter] = useState<Filter>('Upcoming');

  const [selected, setSelected] = useState<Match | null>(null);

  const [results, setResults] = useState<
    Record<string, MatchResult>
  >({});

  const today = useMemo(
    () => MATCHES.filter(m => m.group === 'Today'),
    []
  );

  const upcoming = useMemo(
    () => MATCHES.filter(m => m.group === 'Upcoming'),
    []
  );

  const past = useMemo(
    () => MATCHES.filter(m => m.group === 'Past'),
    []
  );

  const visible = useMemo(() => {
    if (filter === 'Today') return today;
    if (filter === 'Past') return past;
    return [...today, ...upcoming];
  }, [filter, today, upcoming, past]);

  function renderMatch(match: Match) {
    return (
      <MatchCard
        key={match.id}
        match={match}
        hasResult={Boolean(results[match.id])}
        onPress={() => setSelected(match)}
      />
    );
  }

  return (
    <View style={s.root}>
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <View style={s.hero}>
          <Image
            source={HERO}
            resizeMode="cover"
            style={s.heroImage}
          />

          <View style={s.photoTint} pointerEvents="none" />

          <LinearGradient
            colors={[
              'rgba(3,27,22,0.52)',
              'rgba(3,27,22,0.14)',
              'rgba(3,27,22,0.32)',
              C.bg,
            ]}
            locations={[0, 0.34, 0.68, 1]}
            style={s.heroOverlay}
          >
            <View style={s.brandRow}>
              <View style={s.brandLeft}>
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

                <Image
                  source={{
                    uri: 'https://i.pravatar.cc/150?img=12',
                  }}
                  style={s.profilePhoto}
                />
              </View>
            </View>

            <View style={s.heroTitleBlock}>
              <Text style={s.heroTitle}>
                {section === 'Matches' ? (
                  <>
                    M<Text style={s.heroMint}>atches</Text>
                  </>
                ) : (
                  <>
                    Atten<Text style={s.heroMint}>dance</Text>
                  </>
                )}
              </Text>

              <Text style={s.heroSubtitle}>
                {section === 'Matches'
                  ? 'View and score your matches'
                  : "See who's coming tonight"}
              </Text>
            </View>
          </LinearGradient>
        </View>

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
                      {item}
                      {item === 'Upcoming'
                        ? ` (${today.length + upcoming.length})`
                        : item === 'Today'
                          ? ` (${today.length})`
                          : ` (${past.length})`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {filter === 'Upcoming' ? (
                <>
                  <View style={s.sectionRow}>
                    <View style={s.headingGroup}>
                      <Text style={s.sectionTitle}>Today</Text>
                      <Text style={s.sectionSub}>· Demo schedule</Text>
                    </View>

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
              ) : (
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
              )}

              {visible.length === 0 && (
                <Text style={s.empty}>
                  No matches in this category.
                </Text>
              )}

              <Text style={s.demoNote}>
                DEMONSTRATION MATCHES · SCORES ARE LOCAL ONLY
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      <MatchScoreModal
        match={selected}
        result={
          selected
            ? results[selected.id]
            : undefined
        }
        onClose={() => setSelected(null)}
        onSave={(matchId, result) => {
          setResults(previous => ({
            ...previous,
            [matchId]: result,
          }));
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 30 },

  hero: {
    height: 224,
    overflow: 'hidden',
    backgroundColor: C.bg,
  },
  heroImage: {
    position: 'absolute',
    width: '150%',
    height: '105%',
    top: 1,
    right: -40,
  },
  photoTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,42,32,0.14)',
  },
  heroOverlay: {
    flex: 1,
    paddingHorizontal: 19,
    justifyContent: 'space-between',
  },

  brandRow: {
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: { fontSize: 29 },
  brandText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  brandRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bell: { padding: 4 },
  redDot: {
    position: 'absolute',
    right: 2,
    top: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4C59',
  },
  profilePhoto: {
    width: 43,
    height: 43,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#D9E6E1',
  },

  heroTitleBlock: { paddingBottom: 33 },
  heroTitle: {
    color: C.white,
    fontSize: 35,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroMint: { color: C.mint },
  heroSubtitle: {
    color: C.white,
    fontSize: 14,
    marginTop: 2,
  },

  content: {
    paddingHorizontal: 15,
    marginTop: -4,
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
  headingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: C.white,
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSub: { color: C.muted, fontSize: 11 },
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
    backgroundColor: '#6540B2',
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

  savedResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 7,
  },
  savedResultText: {
    color: C.green,
    fontSize: 10,
    fontWeight: '700',
  },
  empty: {
    color: C.muted,
    textAlign: 'center',
    padding: 30,
  },
  demoNote: {
    color: '#739A8B',
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 0.4,
    marginTop: 14,
  },
});
