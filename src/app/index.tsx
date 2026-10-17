
import { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Attendance = 'going' | 'maybe' | 'not-going';

type Court = {
  number: number;
  type: 'Doubles' | 'Singles' | 'Available';
  players: string[];
  active: boolean;
};

const C = {
  background: '#081B18',
  surface: '#102C27',
  surfaceRaised: '#173C34',
  border: '#254B40',
  emerald: '#35D6A0',
  emeraldDark: '#174E3E',
  white: '#F6FBF8',
  muted: '#93AAA3',
  purple: '#9B83E8',
  amber: '#F1C47B',
};

const courts: Court[] = [
  {
    number: 1,
    type: 'Doubles',
    players: ['Sarah', 'James', 'Emma', 'Chris'],
    active: true,
  },
  {
    number: 2,
    type: 'Doubles',
    players: ['Alex', 'Priya', 'Mark', 'Daniel'],
    active: true,
  },
  {
    number: 3,
    type: 'Doubles',
    players: ['Lisa', 'Tom', 'Maya', 'Ben'],
    active: true,
  },
  {
    number: 4,
    type: 'Singles',
    players: ['Oliver', 'Sophie'],
    active: true,
  },
];

function SectionHeading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{action} →</Text>
        </Pressable>
      )}
    </View>
  );
}

function AttendanceButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.attendanceButton,
        selected && styles.attendanceSelected,
      ]}
    >
      <Text
        style={[
          styles.attendanceText,
          selected && styles.attendanceTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CourtCard({ court }: { court: Court }) {
  return (
    <View style={styles.courtCard}>
      <View style={styles.courtTop}>
        <Text style={styles.courtNumber}>
          COURT {court.number}
        </Text>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>
            {court.active ? 'IN PLAY' : 'FREE'}
          </Text>
        </View>
      </View>

      <Text style={styles.courtType}>{court.type}</Text>

      <View style={styles.courtDivider} />

      {court.players.length === 4 ? (
        <>
          <Text style={styles.courtPlayers}>
            {court.players[0]} & {court.players[1]}
          </Text>
          <Text style={styles.versus}>vs</Text>
          <Text style={styles.courtPlayers}>
            {court.players[2]} & {court.players[3]}
          </Text>
        </>
      ) : court.players.length === 2 ? (
        <>
          <Text style={styles.courtPlayers}>
            {court.players[0]}
          </Text>
          <Text style={styles.versus}>vs</Text>
          <Text style={styles.courtPlayers}>
            {court.players[1]}
          </Text>
        </>
      ) : (
        <Text style={styles.courtPlayers}>Court available</Text>
      )}
    </View>
  );
}

function StatCard({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickIcon}>
        <Text style={styles.quickIconText}>{icon}</Text>
      </View>
      <View style={styles.quickText}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export default function PlayerHomeScreen() {
  const [attendance, setAttendance] = useState<Attendance>('going');

  const showComingSoon = (feature: string) => {
    Alert.alert(
      feature,
      'This feature will be connected in a future module.',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandEmoji}>🏸</Text>
            </View>
            <View style={styles.brandText}>
              <Text style={styles.brandTitle}>BADMINTON CLUB</Text>
              <Text style={styles.brandSubtitle}>PLAYER DASHBOARD</Text>
            </View>
          </View>

          <Pressable
            style={styles.avatar}
            onPress={() => showComingSoon('Player Profile')}
          >
            <Text style={styles.avatarText}>A</Text>
          </Pressable>
        </View>

        {/* GREETING */}
        <View style={styles.greeting}>
          <Text style={styles.greetingSmall}>WELCOME BACK</Text>
          <Text style={styles.greetingTitle}>Good evening, Alex 👋</Text>
          <Text style={styles.greetingDescription}>
            Ready for another great night on court?
          </Text>
        </View>

        {/* ATTENDANCE */}
        <View style={styles.attendanceCard}>
          <View style={styles.cardTopRow}>
            <View>
              <Text style={styles.eyebrow}>UPCOMING CLUB NIGHT</Text>
              <Text style={styles.clubNightTitle}>Tuesday Session</Text>
              <Text style={styles.clubNightDate}>
                Tuesday · 7:00 PM – 9:00 PM
              </Text>
            </View>
            <View style={styles.calendarIcon}>
              <Text style={styles.calendarEmoji}>📅</Text>
            </View>
          </View>

          <View style={styles.attendanceDivider} />

          <Text style={styles.attendanceQuestion}>
            Will you be attending?
          </Text>

          <View style={styles.attendanceRow}>
            <AttendanceButton
              label="✓ Going"
              selected={attendance === 'going'}
              onPress={() => setAttendance('going')}
            />
            <AttendanceButton
              label="Maybe"
              selected={attendance === 'maybe'}
              onPress={() => setAttendance('maybe')}
            />
            <AttendanceButton
              label="Not Going"
              selected={attendance === 'not-going'}
              onPress={() => setAttendance('not-going')}
            />
          </View>

          <View style={styles.attendanceFooter}>
            <View style={styles.smallDot} />
            <Text style={styles.attendanceFooterText}>
              {attendance === 'going'
                ? "You're marked as attending"
                : attendance === 'maybe'
                  ? "You're marked as maybe attending"
                  : "You're marked as not attending"}
            </Text>
          </View>
        </View>

        {/* NEXT MATCH */}
        <SectionHeading
          title="Your Next Match"
          action="Match details"
          onAction={() => showComingSoon('Match Details')}
        />

        <View style={styles.matchCard}>
          <View style={styles.matchTop}>
            <View style={styles.matchBadge}>
              <Text style={styles.matchBadgeText}>DOUBLES</Text>
            </View>
            <Text style={styles.matchRound}>ROUND 3</Text>
          </View>

          <View style={styles.matchTeams}>
            <View style={styles.team}>
              <View style={styles.teamAvatar}>
                <Text style={styles.teamAvatarText}>A</Text>
              </View>
              <Text style={styles.teamNames}>Alex & Priya</Text>
              <Text style={styles.teamLabel}>YOUR TEAM</Text>
            </View>

            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.team}>
              <View style={[styles.teamAvatar, styles.opponentAvatar]}>
                <Text style={styles.teamAvatarText}>M</Text>
              </View>
              <Text style={styles.teamNames}>Mark & Daniel</Text>
              <Text style={styles.teamLabel}>OPPONENTS</Text>
            </View>
          </View>

          <View style={styles.matchFooter}>
            <Text style={styles.matchFooterText}>
              🏸 Court 2
            </Text>
            <Text style={styles.matchFooterText}>
              ⏱ Up next
            </Text>
          </View>
        </View>

        {/* COURTS */}
        <SectionHeading
          title="Court Overview"
          action="View all"
          onAction={() => showComingSoon('Court Overview')}
        />

        <View style={styles.courtsGrid}>
          {courts.map((court) => (
            <CourtCard key={court.number} court={court} />
          ))}
        </View>

        {/* SESSION OVERVIEW */}
        <SectionHeading title="Tonight at a Glance" />

        <View style={styles.statsRow}>
          <StatCard value="14" label="Players" />
          <StatCard value="4" label="Courts" accent={C.emerald} />
          <StatCard value="3" label="Round" />
          <StatCard value="0" label="Resting" accent={C.purple} />
        </View>

        {/* PERSONAL STATS */}
        <SectionHeading
          title="Your Performance"
          action="Statistics"
          onAction={() => showComingSoon('Statistics')}
        />

        <View style={styles.performanceCard}>
          <View style={styles.performanceStat}>
            <Text style={styles.performanceValue}>24</Text>
            <Text style={styles.performanceLabel}>Matches</Text>
          </View>
          <View style={styles.performanceDivider} />
          <View style={styles.performanceStat}>
            <Text style={styles.performanceValue}>16</Text>
            <Text style={styles.performanceLabel}>Wins</Text>
          </View>
          <View style={styles.performanceDivider} />
          <View style={styles.performanceStat}>
            <Text style={[styles.performanceValue, { color: C.emerald }]}>
              67%
            </Text>
            <Text style={styles.performanceLabel}>Win Rate</Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <SectionHeading title="Quick Actions" />

        <View style={styles.quickActionsCard}>
          <QuickAction
            icon="🏆"
            title="Club Rankings"
            subtitle="See the player leaderboard"
            onPress={() => showComingSoon('Club Rankings')}
          />
          <View style={styles.quickDivider} />
          <QuickAction
            icon="📊"
            title="Match History"
            subtitle="Review your previous games"
            onPress={() => showComingSoon('Match History')}
          />
          <View style={styles.quickDivider} />
          <QuickAction
            icon="👥"
            title="Club Members"
            subtitle="Explore the player directory"
            onPress={() => showComingSoon('Club Members')}
          />
        </View>

        <Text style={styles.bottomNote}>
          BADMINTON CLUB · PLAYER EXPERIENCE
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 43,
    height: 43,
    backgroundColor: C.emeraldDark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandEmoji: {
    fontSize: 22,
  },
  brandText: {
    justifyContent: 'center',
  },
  brandTitle: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  brandSubtitle: {
    color: C.emerald,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: C.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: C.white,
    fontSize: 17,
    fontWeight: '800',
  },
  greeting: {
    paddingTop: 30,
    paddingBottom: 25,
  },
  greetingSmall: {
    color: C.emerald,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  greetingTitle: {
    color: C.white,
    fontSize: 27,
    fontWeight: '800',
    marginTop: 10,
  },
  greetingDescription: {
    color: C.muted,
    fontSize: 14,
    marginTop: 9,
  },
  attendanceCard: {
    backgroundColor: C.surfaceRaised,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: C.emerald,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  clubNightTitle: {
    color: C.white,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 8,
  },
  clubNightDate: {
    color: C.muted,
    fontSize: 12,
    marginTop: 7,
  },
  calendarIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: C.emeraldDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarEmoji: {
    fontSize: 19,
  },
  attendanceDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 20,
  },
  attendanceQuestion: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 14,
  },
  attendanceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  attendanceSelected: {
    backgroundColor: C.emerald,
    borderColor: C.emerald,
  },
  attendanceText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  attendanceTextSelected: {
    color: C.background,
  },
  attendanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  smallDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.emerald,
    marginRight: 8,
  },
  attendanceFooterText: {
    color: C.muted,
    fontSize: 11,
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: C.white,
    fontSize: 19,
    fontWeight: '800',
  },
  sectionAction: {
    color: C.emerald,
    fontSize: 12,
    fontWeight: '700',
  },
  matchCard: {
    backgroundColor: C.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 30,
    overflow: 'hidden',
  },
  matchTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  matchBadge: {
    backgroundColor: C.emeraldDark,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
  },
  matchBadgeText: {
    color: C.emerald,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  matchRound: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 25,
    paddingHorizontal: 12,
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  teamAvatar: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: C.emeraldDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  opponentAvatar: {
    backgroundColor: '#41345B',
  },
  teamAvatarText: {
    color: C.white,
    fontSize: 19,
    fontWeight: '800',
  },
  teamNames: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  teamLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 7,
  },
  vsCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  vsText: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  matchFooter: {
    backgroundColor: C.surfaceRaised,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  matchFooterText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '700',
  },
  courtsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  courtCard: {
    width: '48%',
    backgroundColor: C.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 12,
    minHeight: 158,
  },
  courtTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courtNumber: {
    color: C.emerald,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.emerald,
    marginRight: 4,
  },
  liveText: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '700',
  },
  courtType: {
    color: C.white,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12,
  },
  courtDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 11,
  },
  courtPlayers: {
    color: C.white,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  versus: {
    color: C.purple,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statValue: {
    color: C.white,
    fontSize: 23,
    fontWeight: '800',
  },
  statLabel: {
    color: C.muted,
    fontSize: 10,
    marginTop: 6,
  },
  performanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 24,
    marginBottom: 30,
  },
  performanceStat: {
    flex: 1,
    alignItems: 'center',
  },
  performanceValue: {
    color: C.white,
    fontSize: 25,
    fontWeight: '800',
  },
  performanceLabel: {
    color: C.muted,
    fontSize: 11,
    marginTop: 7,
  },
  performanceDivider: {
    width: 1,
    height: 35,
    backgroundColor: C.border,
  },
  quickActionsCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 17,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: C.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  quickIconText: {
    fontSize: 19,
  },
  quickText: {
    flex: 1,
  },
  quickTitle: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
  },
  quickSubtitle: {
    color: C.muted,
    fontSize: 11,
    marginTop: 5,
  },
  chevron: {
    color: C.muted,
    fontSize: 25,
  },
  quickDivider: {
    height: 1,
    backgroundColor: C.border,
  },
  bottomNote: {
    color: C.muted,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 30,
  },
});
