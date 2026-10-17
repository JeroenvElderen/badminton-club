import LeaderboardPage from '@/components/leaderboard-page';
import MatchesPage from '@/components/matches-page';
import MorePage from '@/components/more-page';
import StatsPage from '@/components/stats-page';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Attendance = 'going' | 'maybe' | 'not-going';
type Tab = 'Home' | 'Matches' | 'Stats' | 'Leaderboard' | 'More';

const P = {
  bg: '#031B16',
  card: '#06251E',
  tile: '#102C27',
  border: '#185243',
  green: '#00D995',
  mint: '#78DCC0',
  white: '#F6FBF8',
  muted: '#A6B8B1',
  purple: '#8250D0',
  blue: '#55B6F7',
  orange: '#F5A44D',
};

const PHOTO = {
  hero: require('../../assets/images/shuttleheader.png'),
  alex: 'https://i.pravatar.cc/150?img=12',
  priya: 'https://i.pravatar.cc/150?img=47',
  mark: 'https://i.pravatar.cc/150?img=13',
  daniel: 'https://i.pravatar.cc/150?img=11',
};

const COURTS = [
  { id: 1, kind: 'Doubles', a: 'Sarah & James', b: 'Emma & Chris' },
  { id: 2, kind: 'Doubles', a: 'Alex & Priya', b: 'Mark & Daniel' },
  { id: 3, kind: 'Doubles', a: 'Lisa & Tom', b: 'Maya & Ben' },
  { id: 4, kind: 'Singles', a: 'Oliver', b: 'Sophie' },
];

const NAV: { label: Tab; icon: IconName; selected: IconName }[] = [
  { label: 'Home', icon: 'home-outline', selected: 'home' },
  { label: 'Matches', icon: 'tennisball-outline', selected: 'tennisball' },
  { label: 'Stats', icon: 'stats-chart-outline', selected: 'stats-chart' },
  { label: 'Leaderboard', icon: 'trophy-outline', selected: 'trophy' },
  { label: 'More', icon: 'menu-outline', selected: 'menu' },
];

function I({
  name,
  size = 20,
  color = P.white,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

// Small custom shuttlecock mark. No extra image dependency.
function Shuttlecock({ size = 32, color = P.white }: {
  size?: number;
  color?: string;
}) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center' }}>
      <Text
        style={{
          color,
          fontSize: size * 0.78,
          lineHeight: size,
          textAlign: 'center',
        }}
      >
        🏸
      </Text>
    </View>
  );
}

function Avatar({ url, size = 38 }: { url: string; size?: number }) {
  return (
    <Image
      source={{ uri: url }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: '#D9E6E1',
        backgroundColor: P.tile,
      }}
    />
  );
}

function Panel({ children, style }: {
  children: React.ReactNode;
  style?: object;
}) {
  return <View style={[s.panel, style]}>{children}</View>;
}

function CircleIcon({
  name,
  size = 45,
}: {
  name: IconName;
  size?: number;
}) {
  return (
    <View style={[s.circleIcon, { width: size, height: size, borderRadius: size / 2 }]}>
      <I name={name} size={size * 0.52} />
    </View>
  );
}

function Pair({
  first,
  second,
  label,
}: {
  first: string;
  second: string;
  label: string;
}) {
  return (
    <View style={s.pair}>
      <View style={s.pairPhotos}>
        <Avatar url={first} size={41} />
        <View style={{ marginLeft: -10 }}>
          <Avatar url={second} size={41} />
        </View>
      </View>
      <Text style={s.pairLabel}>{label}</Text>
    </View>
  );
}

function MatchTeams() {
  return (
    <View style={s.teams}>
      <Pair first={PHOTO.alex} second={PHOTO.priya} label="You & Priya" />
      <Text style={s.versus}>VS</Text>
      <Pair first={PHOTO.mark} second={PHOTO.daniel} label="Mark & Daniel" />
    </View>
  );
}

function Stat({
  icon,
  color,
  number,
  label,
}: {
  icon: IconName;
  color: string;
  number: string;
  label: string;
}) {
  return (
    <View style={s.stat}>
      <I name={icon} color={color} size={23} />
      <Text style={s.statNumber}>{number}</Text>
      <Text style={s.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function Action({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [s.action, pressed && s.pressed]} onPress={onPress}>
      <I name={icon} size={25} color={P.green} />
      <Text style={s.actionLabel} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}

function Home({
  attendance,
  changeAttendance,
  go,
}: {
  attendance: Attendance;
  changeAttendance: () => void;
  go: (tab: Tab) => void;
}) {
  const [courtsOpen, setCourtsOpen] = useState(false);

  const attendingTitle =
    attendance === 'going' ? "You're Attending" :
      attendance === 'maybe' ? 'Maybe Attending' : 'Not Attending';

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
    >

      <View style={s.hero}>
        <Image
          source={PHOTO.hero}
          resizeMode="cover"
          style={s.positionedHeroImage}
        />

        <View
          pointerEvents="none"
          style={s.heroColorTint}
        />




        <LinearGradient
          colors={[
            'rgba(3, 27, 22, 0.48)',
            'rgba(3, 27, 22, 0.12)',
            'rgba(3, 27, 22, 0.18)',
            'rgba(3, 27, 22, 0.58)',
            'rgba(3, 27, 22, 0.88)',
            P.bg,
          ]}
          locations={[0, 0.20, 0.40, 0.62, 0.82, 1]}
          style={s.heroOverlay}
        >


          <View style={s.topBar}>
            <View style={s.brand}>
              <Shuttlecock size={36} color={P.white} />

              <View>
                <Text style={s.brandName}>Riverside</Text>
                <Text style={s.brandName}>Badminton Club</Text>
              </View>
            </View>

            <View style={s.headerRight}>
              <Pressable
                style={s.notification}
                onPress={() => go('More')}
              >
                <I
                  name="notifications-outline"
                  size={24}
                  color={P.white}
                />
                <View style={s.redDot} />
              </Pressable>

              <Pressable onPress={() => go('More')}>
                <Avatar url={PHOTO.alex} size={43} />
              </Pressable>
            </View>
          </View>

          <View style={s.greeting}>
            <Text style={s.hello}>
              Hi <Text style={s.name}>Alex!</Text>
            </Text>

            <Text style={s.subHello}>
              Ready for tonight?
            </Text>
          </View>
        </LinearGradient>
      </View>


      <View style={s.sections}>
        <Panel>
          <View style={s.attendanceRow}>
            <CircleIcon name="calendar" size={49} />
            <View style={s.attendanceText}>
              <Text style={s.attendanceTitle}>{attendingTitle}</Text>
              <Text style={s.attendanceEvent}>Club Night</Text>
              <Text style={s.secondary}>Tuesday · 19:00–21:00</Text>
            </View>
            <View style={[
              s.confirmCircle,
              attendance === 'maybe' && { backgroundColor: P.orange },
              attendance === 'not-going' && { backgroundColor: '#61746D' },
            ]}>
              <I
                name={attendance === 'going' ? 'checkmark' :
                  attendance === 'maybe' ? 'help' : 'close'}
                size={27}
              />
            </View>
          </View>
          <Pressable style={s.attendanceButton} onPress={changeAttendance}>
            <Text style={s.buttonText}>Change Attendance</Text>
            <I name="chevron-forward" size={21} />
          </Pressable>
        </Panel>

        <Panel>
          <View style={s.matchHeader}>
            <CircleIcon name="tennisball-outline" size={46} />
            <View style={s.matchHeaderText}>
              <Text style={s.matchTitle}>Next Match</Text>
              <Text style={s.matchMeta}>Round 3 · Court 2</Text>
              <Text style={s.secondary}>Upcoming match</Text>
            </View>
            <View style={s.badge}>
              <Text style={s.badgeText}>Doubles</Text>
            </View>
          </View>
          <MatchTeams />
          <Pressable style={s.primaryButton} onPress={() => go('Matches')}>
            <Text style={s.buttonText}>View Match</Text>
            <I name="chevron-forward" size={21} />
          </Pressable>
        </Panel>

        <Panel style={s.overview}>
          <View style={s.sectionHeading}>
            <Text style={s.sectionTitle}>Tonight's Overview</Text>
            <Pressable style={s.viewAll} onPress={() => setCourtsOpen(!courtsOpen)}>
              <Text style={s.viewAllText}>{courtsOpen ? 'Hide' : 'View All'}</Text>
              <I name="chevron-forward" size={17} color={P.green} />
            </Pressable>
          </View>
          <View style={s.stats}>
            <Stat icon="people-outline" color={P.green} number="14" label="Attending" />
            <Stat icon="grid-outline" color={P.blue} number="4" label="Courts" />
            <Stat icon="tennisball-outline" color={P.purple} number="3" label="Round" />
            <Stat icon="cafe-outline" color={P.orange} number="0" label="Resting" />
          </View>
          {courtsOpen && (
            <View style={s.courtList}>
              {COURTS.map(court => (
                <View key={court.id} style={s.courtItem}>
                  <View style={s.courtNumber}>
                    <Text style={s.courtNumberText}>{court.id}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.courtHeading}>Court {court.id} · {court.kind}</Text>
                    <Text style={s.courtDetail}>{court.a} vs {court.b}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Panel>

        <View style={s.quickPanel}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.actions}>
            <Action icon="calendar-outline" label="My Matches" onPress={() => go('Matches')} />
            <Action icon="bar-chart-outline" label="Live Scores" onPress={() => go('Matches')} />
            <Action icon="stats-chart-outline" label="My Statistics" onPress={() => go('Stats')} />
            <Action icon="trophy-outline" label="Leaderboard" onPress={() => go('Leaderboard')} />
          </View>
        </View>
        <Text style={s.demo}>DEMONSTRATION DATA · DATABASE CONNECTION PENDING</Text>
      </View>
    </ScrollView>
  );
}

function OtherPage({ tab, go }: {
  tab: Tab;
  go: (tab: Tab) => void;
}) {
  return (
    <ScrollView contentContainerStyle={s.otherPage}>
      <View style={s.otherTop}>
        <Pressable onPress={() => go('Home')}>
          <I name="arrow-back" size={24} />
        </Pressable>
        <Text style={s.otherTitle}>{tab}</Text>
      </View>

      <Panel>
        {tab === 'Matches' ? (
          <>
            <Text style={s.eyebrow}>ROUND 3 · COURT 2</Text>
            <Text style={s.detailTitle}>Your Next Match</Text>
            <Text style={s.secondary}>Doubles</Text>
            <MatchTeams />
            <Text style={s.description}>
              Match scoring and history will be connected to the club database.
            </Text>
          </>
        ) : tab === 'Stats' ? (
          <>
            <Text style={s.detailTitle}>My Statistics</Text>
            <View style={[s.stats, { marginTop: 20 }]}>
              <Stat icon="tennisball-outline" color={P.green} number="24" label="Matches" />
              <Stat icon="trophy-outline" color={P.blue} number="16" label="Wins" />
              <Stat icon="analytics-outline" color={P.purple} number="67%" label="Win Rate" />
            </View>
            <Text style={s.description}>Demonstration statistics.</Text>
          </>
        ) : tab === 'Leaderboard' ? (
          <>
            <Text style={s.detailTitle}>Club Leaderboard</Text>
            <Text style={s.description}>
              Rankings will be calculated from verified match results and skill ratings.
            </Text>
          </>
        ) : (
          <>
            <View style={s.profile}>
              <Avatar url={PHOTO.alex} size={56} />
              <View>
                <Text style={s.detailTitle}>Alex</Text>
                <Text style={s.secondary}>Club Player</Text>
              </View>
            </View>
            {['My Profile', 'Club Members', 'Club Sessions', 'Settings', 'Admin Dashboard'].map(item => (
              <View key={item} style={s.menuRow}>
                <Text style={s.menuText}>{item}</Text>
                <I name="chevron-forward" color={P.muted} />
              </View>
            ))}
            <Text style={s.description}>
              These sections will be enabled in their respective modules.
            </Text>
          </>
        )}
      </Panel>
    </ScrollView>
  );
}

function AttendancePicker({
  visible,
  value,
  choose,
  close,
}: {
  visible: boolean;
  value: Attendance;
  choose: (value: Attendance) => void;
  close: () => void;
}) {
  const choices: { value: Attendance; label: string; icon: IconName }[] = [
    { value: 'going', label: 'Going', icon: 'checkmark-circle-outline' },
    { value: 'maybe', label: 'Maybe', icon: 'help-circle-outline' },
    { value: 'not-going', label: 'Not Going', icon: 'close-circle-outline' },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={s.modalBackground}>
        <View style={s.modal}>
          <View style={s.modalTop}>
            <Text style={s.detailTitle}>Change Attendance</Text>
            <Pressable onPress={close}><I name="close" size={23} /></Pressable>
          </View>
          <Text style={s.secondary}>Club Night · Tuesday 19:00–21:00</Text>
          {choices.map(item => (
            <Pressable
              key={item.value}
              style={[s.choice, value === item.value && s.choiceSelected]}
              onPress={() => { choose(item.value); close(); }}
            >
              <I name={item.icon} color={value === item.value ? P.green : P.muted} />
              <Text style={s.choiceText}>{item.label}</Text>
              {value === item.value && <I name="checkmark" color={P.green} />}
            </Pressable>
          ))}
          <Text style={s.modalFootnote}>
            This selection is temporary until database attendance is implemented.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

export default function RiversideApp() {
  const [tab, setTab] = useState<Tab>('Home');
  const [attendance, setAttendance] = useState<Attendance>('going');
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      <View style={s.content}>
        {tab === 'Home' ? (
          <Home
            attendance={attendance}
            changeAttendance={() => setPickerOpen(true)}
            go={setTab}
          />
        ) : tab === 'Matches' ? (
          <MatchesPage />
        ) : tab === 'Stats' ? (
          <StatsPage />
        ) : tab === 'Leaderboard' ? ( 
          <LeaderboardPage />
        ) : tab === 'More' ? ( 
          <MorePage />
        ) : (
          <OtherPage tab={tab} go={setTab} />
        )}
      </View>

      <View style={s.navigation}>
        {NAV.map(item => {
          const active = tab === item.label;
          return (
            <Pressable
              key={item.label}
              onPress={() => setTab(item.label)}
              style={s.navButton}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              {active && <View style={s.navLine} />}
              <I
                name={active ? item.selected : item.icon}
                size={23}
                color={active ? P.green : '#B7C6BF'}
              />
              <Text style={[s.navText, active && { color: P.green }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <AttendancePicker
        visible={pickerOpen}
        value={attendance}
        choose={setAttendance}
        close={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.bg },
  content: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  heroColorTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 42, 32, 0.14)',
  },
  hero: {
    height: 224,
    width: '100%',
    backgroundColor: P.bg,
    overflow: 'hidden',
  },
  heroImage: {
    opacity: 1,
  },
  heroOverlay: {
    flex: 1,
    paddingHorizontal: 19,
    justifyContent: 'space-between',
  },
  topBar: {
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
  brandName: {
    color: P.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
    letterSpacing: 0.1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 17,
  },
  notification: {
    position: 'relative',
    padding: 4,
  },
  redDot: {
    position: 'absolute',
    right: 2,
    top: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4C59',
  },
  greeting: {
    paddingBottom: 45,
  },
  hello: {
    color: P.white,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 42,
  },
  name: {
    color: P.mint,
  },
  subHello: {
    color: P.white,
    fontSize: 18,
    fontWeight: '500',
    marginTop: 3,
  },

  sections: { marginTop: -15, paddingHorizontal: 15, gap: 11 },
  panel: {
    backgroundColor: P.card,
    borderColor: P.border, borderWidth: 1,
    borderRadius: 18, padding: 15,
    shadowColor: '#000', shadowOpacity: 0.13,
    shadowRadius: 9, shadowOffset: { width: 0, height: 4 },
  },
  attendanceRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 14,
  },
  circleIcon: {
    backgroundColor: '#006448',
    alignItems: 'center', justifyContent: 'center',
  },
  attendanceText: { flex: 1, gap: 3 },
  attendanceTitle: { color: P.white, fontSize: 18, fontWeight: '800' },
  attendanceEvent: { color: P.white, fontSize: 15 },
  secondary: { color: P.muted, fontSize: 12, marginTop: 2 },
  confirmCircle: {
    width: 43, height: 43, borderRadius: 22,
    backgroundColor: P.green, alignItems: 'center', justifyContent: 'center',
  },
  attendanceButton: {
    backgroundColor: '#005B42', height: 43,
    borderRadius: 11, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  buttonText: { color: P.white, fontSize: 15, fontWeight: '700' },

  matchHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  matchHeaderText: { flex: 1, gap: 2, paddingTop: 1 },
  matchTitle: { color: P.white, fontSize: 19, fontWeight: '800' },
  matchMeta: { color: P.white, fontSize: 14 },
  badge: {
    backgroundColor: '#6540B2', paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 9,
  },
  badgeText: { color: P.white, fontSize: 12, fontWeight: '700' },
  teams: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 14, marginBottom: 16,
  },
  pair: { flex: 1, alignItems: 'center', gap: 7 },
  pairPhotos: { flexDirection: 'row', justifyContent: 'center' },
  pairLabel: {
    color: P.white, fontSize: 12,
    fontWeight: '600', textAlign: 'center',
  },
  versus: { color: P.white, fontSize: 12, width: 29, textAlign: 'center' },
  primaryButton: {
    height: 44, backgroundColor: '#008E61',
    borderRadius: 11, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },

  overview: { padding: 12 },
  sectionHeading: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitle: { color: P.white, fontSize: 18, fontWeight: '700' },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { color: P.green, fontSize: 12 },
  stats: { flexDirection: 'row', gap: 7 },
  stat: {
    flex: 1, minWidth: 0, backgroundColor: P.tile,
    borderWidth: 1, borderColor: '#214239',
    borderRadius: 12, alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 2, gap: 5,
  },
  statNumber: { color: P.white, fontSize: 21, fontWeight: '700' },
  statLabel: { color: P.white, fontSize: 10 },
  courtList: { marginTop: 13, gap: 7 },
  courtItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: P.tile, borderRadius: 10, padding: 9, gap: 10,
  },
  courtNumber: {
    width: 29, height: 29, borderRadius: 8,
    backgroundColor: '#075F46', alignItems: 'center', justifyContent: 'center',
  },
  courtNumberText: { color: P.white, fontWeight: '800' },
  courtHeading: { color: P.white, fontSize: 12, fontWeight: '700' },
  courtDetail: { color: P.muted, fontSize: 10, marginTop: 3 },

  quickPanel: {
    backgroundColor: '#06241D', borderRadius: 17,
    padding: 12, gap: 12,
  },
  actions: { flexDirection: 'row', gap: 7 },
  action: {
    flex: 1, minWidth: 0, height: 78,
    backgroundColor: P.tile, borderWidth: 1,
    borderColor: '#1C4137', borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', gap: 8, padding: 4,
  },
  actionLabel: { color: P.white, fontSize: 10, textAlign: 'center' },
  pressed: { opacity: 0.7 },
  demo: {
    color: '#739A8B', fontSize: 8,
    letterSpacing: 0.8, textAlign: 'center', marginTop: 4,
  },

  navigation: {
    height: 59, flexDirection: 'row',
    backgroundColor: '#00140F',
    borderTopWidth: 1, borderTopColor: '#173C31',
  },
  navButton: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', gap: 4,
  },
  navLine: {
    position: 'absolute', top: 0,
    width: 30, height: 2, backgroundColor: P.green,
  },
  navText: { color: '#B7C6BF', fontSize: 9 },

  otherPage: { padding: 17, paddingBottom: 35 },
  otherTop: {
    flexDirection: 'row', alignItems: 'center',
    gap: 13, marginBottom: 20,
  },
  otherTitle: { color: P.white, fontSize: 23, fontWeight: '800' },
  eyebrow: { color: P.green, fontSize: 11, fontWeight: '800' },
  detailTitle: { color: P.white, fontSize: 20, fontWeight: '800' },
  description: {
    color: P.muted, fontSize: 12,
    lineHeight: 19, marginTop: 14,
  },
  positionedHeroImage: {
    position: 'absolute',
    width: '150%',
    height: '105%',
    top: 1,
    right: -40,
    opacity: 1,
  },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  menuRow: {
    paddingVertical: 16, flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: P.border,
  },
  menuText: { color: P.white, fontSize: 14 },

  modalBackground: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: P.card, borderColor: P.border,
    borderWidth: 1, borderRadius: 20, padding: 19, gap: 11,
  },
  modalTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  choice: {
    flexDirection: 'row', alignItems: 'center',
    gap: 11, backgroundColor: P.tile,
    padding: 14, borderRadius: 11,
    borderWidth: 1, borderColor: P.border,
  },
  choiceSelected: { borderColor: P.green },
  choiceText: { color: P.white, flex: 1, fontSize: 14 },
  modalFootnote: { color: P.muted, fontSize: 10, lineHeight: 15 },
});
