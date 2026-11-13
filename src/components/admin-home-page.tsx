import AdminMatchesPage from '@/components/admin-matches-page';
import AdminMorePage from '@/components/admin-more-page';
import AdminNightsPage from '@/components/admin-nights-page';
import AdminPlayersPage from '@/components/admin-players-page';
import ClubHeader from '@/components/club-header';
import { useHomeData } from '@/hooks/use-home-data';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/providers/theme-provider';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

type Icon = React.ComponentProps<typeof Ionicons>['name'];
type NavigationIcon = Icon | 'shuttlecock';
const C = { bg: '#031B16', card: '#06251E', tile: '#102C27', border: '#185243', green: '#00D995', text: '#F6FBF8', muted: '#A6B8B1' };

function Metric({ icon, value, label, color }: { icon: Icon; value: number; label: string; color: string }) {
  return <View style={s.metric}><Ionicons name={icon} size={24} color={color} /><Text style={s.metricValue}>{value}</Text><Text style={s.metricLabel} numberOfLines={2}>{label}</Text></View>;
}
function Action({ icon, label, onPress }: { icon: Icon; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [s.action, pressed && { opacity: .65 }]}><Ionicons name={icon} size={27} color={C.green} /><Text style={s.actionText}>{label}</Text></Pressable>;
}
export default function AdminHomePage({ userId, onSwitchToPlayer }: { userId: string; onSwitchToPlayer: () => void }) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const home = useHomeData(userId);
  const [section, setSection] = useState<'Home' | 'Nights' | 'Matches' | 'Players' | 'More'>('Home');
  const session = home.session;
  const current = home.matches.filter(m => m.status === 'in_progress');
  const maxRound = Math.max(0, ...home.matches.map(m => m.round_number));
  const name = home.profile?.display_name?.trim() || home.profile?.full_name?.trim().split(' ')[0] || 'Admin';
  const date = session ? new Date(session.starts_at).toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'No upcoming club night';
  const time = session ? `${new Date(session.starts_at).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false })} – ${new Date(session.ends_at).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false })}` : 'Not scheduled';
  const notReady = (feature: string) => Alert.alert(feature, 'This management workflow will be connected in the next admin development steps. No changes have been made.');
  const tabs: { label: typeof section; icon: NavigationIcon }[] = [
    { label: 'Home', icon: 'home-outline' }, { label: 'Nights', icon: 'calendar-outline' },
    { label: 'Matches', icon: 'shuttlecock' }, { label: 'Players', icon: 'people-outline' }, { label: 'More', icon: 'ellipsis-horizontal' },
  ];
  return <SafeAreaView style={[s.root, { backgroundColor: theme.background }]} edges={['top']}>
    <StatusBar barStyle="light-content" />
    {section !== 'Players' && (
      <ClubHeader
        title={section === 'Home' ? `Welcome back, ${name}` : section}
        highlight={section === 'Home' ? name : undefined}
        subtitle={
          section === 'Home'
            ? "Here's your club management overview."
            : section === 'Matches'
              ? 'Manage live matches and rounds.'
              : section === 'More'
                ? 'Manage your club and settings.'
                : 'Riverside administration'
        }
        onNotificationsPress={() => notReady('Notifications')}
        onProfilePress={() => setSection('More')}
      />
    )}
    {section === 'Nights' ? (
      <AdminNightsPage />
    ) : section === 'Matches' ? (
      <AdminMatchesPage userId={userId} />
    ) : section === 'Players' ? (
      <AdminPlayersPage />
    ) : section === 'More' ? (
      <AdminMorePage onSwitchToPlayer={onSwitchToPlayer} />
    ) : (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {section === 'Home' ? <>
          <View style={s.panel}>
            <View style={s.headingRow}><Text style={s.heading}>Tonight's Club Night</Text><View style={s.live}><View style={[s.dot, { backgroundColor: session?.status === 'active' ? C.green : C.muted }]} /><Text style={s.liveText}>{session?.status === 'active' ? 'Live Now' : 'Scheduled'}</Text></View></View>
            <View style={s.nightRow}><View style={{ flex: 1, gap: 13 }}>
              <Text style={s.detail}><Ionicons name="calendar-outline" size={17} />  {date}</Text>
              <Text style={s.detail}><Ionicons name="time-outline" size={17} />  {time}</Text>
              <Text style={s.detail}><Ionicons name="grid-outline" size={17} />  {home.courts.length} courts</Text>
              <Text style={s.detail}><Ionicons name="people-outline" size={17} />  {home.attendingCount} attending</Text>
            </View><View style={s.attendanceRing}><Text style={s.ringValue}>{home.attendingCount}</Text><Text style={s.ringLabel}>Attending</Text></View></View>
            <Text style={s.note}>Attendance percentage will appear when the total registered-player count is available.</Text>
          </View>
          <View style={s.metrics}>
            <Metric icon="people" value={home.attendingCount} label="Attending" color="#16B9EE" />
            <Metric icon="help-circle-outline" value={0} label="Maybe*" color="#FFBD43" />
            <Metric icon="close" value={0} label="Absent*" color="#FF4D5E" />
            <Metric icon="grid-outline" value={home.courts.length} label="Courts" color={C.green} />
          </View>
          <Text style={s.note}>* Maybe and absent totals are not yet loaded by the existing home data hook.</Text>
          <View style={s.panel}><View style={s.headingRow}><Text style={s.heading}>Current Round</Text><Text style={s.subtle}>Round {home.currentRound || '–'} of {maxRound || '–'}</Text></View>
            <View style={s.progressTrack}><View style={[s.progressFill, { width: `${maxRound ? Math.min(100, 100 * home.currentRound / maxRound) : 0}%` }]} /></View>
            {current.length ? current.map(match => <View key={match.id} style={s.match}><View style={{ flex: 1 }}><Text style={s.detail}>{home.courts.find(c => c.id === match.court_id)?.name ?? 'Court pending'}</Text><Text style={s.subtle}>Round {match.round_number} · {match.match_type}</Text></View><Text style={s.score}>{match.team_a_score} – {match.team_b_score}</Text><Text style={s.liveText}> Live</Text></View>) : <Text style={s.subtle}>No matches currently in progress.</Text>}
          </View>
          <View style={s.panel}><Text style={s.heading}>⚡ Quick Actions</Text><View style={s.actions}>
            <Action icon="play" label="Start Next Round" onPress={() => notReady('Start Next Round')} />
            <Action icon="shuffle" label="Generate Matches" onPress={() => notReady('Generate Matches')} />
            <Action icon="people-outline" label="Edit Attendance" onPress={() => notReady('Edit Attendance')} />
            <Action icon="calendar-outline" label="Manage Club Night" onPress={() => notReady('Manage Club Night')} />
          </View></View>
          {home.loading && <ActivityIndicator color={C.green} />}
          {home.error && <Pressable onPress={() => void home.refresh()}><Text style={{ color: '#FF9B9B' }}>{home.error} · Tap to retry</Text></Pressable>}
        </> : <View style={s.panel}><Text style={s.heading}>{section}</Text><Text style={[s.subtle, { marginTop: 10 }]}>This admin section will be implemented next.</Text>{section === 'More' && <View style={{ gap: 16, marginTop: 20 }}><Pressable onPress={onSwitchToPlayer} style={{ backgroundColor: C.tile, borderWidth: 1, borderColor: C.green, padding: 16, borderRadius: 12 }}><Text style={{ color: C.green, fontWeight: '800' }}>⇄ Switch to Player Mode</Text></Pressable><Pressable onPress={() => void supabase.auth.signOut()}><Text style={{ color: C.green }}>Sign out</Text></Pressable></View>}</View>}
      </ScrollView>
    )}
    <View style={[s.nav, { paddingBottom: Math.max(0, insets.bottom - 14) }]}>{tabs.map(item => {
      const active = section === item.label;
      const iconColor = active ? C.green : C.text;
      return <Pressable key={item.label} onPress={() => setSection(item.label)} style={s.navItem}>
        {item.icon === 'shuttlecock'
          ? <ShuttlecockIcon size={23} color={iconColor} />
          : <Ionicons name={item.icon} size={23} color={iconColor} />}
        <Text style={[s.navLabel, active && { color: C.green }]}>{item.label}</Text>
      </Pressable>;
    })}</View>
  </SafeAreaView>;
}

function ShuttlecockIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.7 4.7C5.2 9.3 7.8 12.9 11.1 15.1M19.3 4.7C18.8 9.3 16.2 12.9 12.9 15.1M4.8 4.7C8.8 2.4 15.2 2.4 19.2 4.7M7.5 5.4l3.8 9.5M10.5 4.5l1.3 10.8M13.5 4.5l-1.3 10.8M16.5 5.4l-3.8 9.5M11.1 14.9l-1.2 4.2c-.3 1.5 4.2 1.5 4.2 0l-1.2-4.2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 }, content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 28, gap: 12 },
  panel: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 17, padding: 14, gap: 12 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  heading: { color: C.text, fontSize: 19, fontWeight: '800', flexShrink: 1 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6 }, dot: { width: 9, height: 9, borderRadius: 5 }, liveText: { color: C.green, fontSize: 12, fontWeight: '700' },
  nightRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, detail: { color: C.text, fontSize: 13 }, subtle: { color: C.muted, fontSize: 12 }, note: { color: C.muted, fontSize: 10, lineHeight: 15 },
  attendanceRing: { width: 116, height: 116, borderRadius: 58, borderWidth: 11, borderColor: '#008B69', alignItems: 'center', justifyContent: 'center' }, ringValue: { color: C.text, fontSize: 30, fontWeight: '800' }, ringLabel: { color: C.muted, fontSize: 11 },
  metrics: { flexDirection: 'row', gap: 7 }, metric: { flex: 1, minWidth: 0, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13, alignItems: 'center', paddingVertical: 13, gap: 5 }, metricValue: { color: C.text, fontSize: 22, fontWeight: '800' }, metricLabel: { color: C.text, fontSize: 10, textAlign: 'center' },
  progressTrack: { height: 11, borderRadius: 6, backgroundColor: C.tile, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: C.green, borderRadius: 6 },
  match: { backgroundColor: C.tile, borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }, score: { color: C.text, fontSize: 19, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 7 }, action: { flex: 1, minWidth: 0, minHeight: 94, borderWidth: 1, borderColor: C.border, backgroundColor: C.tile, borderRadius: 12, padding: 6, alignItems: 'center', justifyContent: 'center', gap: 10 }, actionText: { color: C.text, fontSize: 11, textAlign: 'center' },
  nav: { backgroundColor: '#00140F', borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', minHeight: 62 }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 7 }, navLabel: { color: C.text, fontSize: 11 },
});
