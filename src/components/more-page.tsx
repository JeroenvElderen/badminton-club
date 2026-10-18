
import { supabase } from '@/lib/supabase';
import { THEMES, type ThemeId } from '@/lib/themes';
import { useAppTheme } from '@/providers/theme-provider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform,
  Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';

const BASE_COLORS = {
  bg: '#031B16', card: '#05251E', tile: '#092D26', border: '#12483D',
  white: '#F6FBF8', muted: '#A6B8B1', green: '#00D995', mint: '#78DCC0',
  blue: '#48A9FF', purple: '#A454F5', orange: '#FF873C', red: '#FF565D',
};
const C = BASE_COLORS;


type MenuId = 'profile' | 'skill' | 'members' | 'club' | 'notifications' |
  'appearance' | 'language' | 'settings' | 'help' | 'contact' | 'terms' | 'version';
type IconName = React.ComponentProps<typeof Ionicons>['name'];
type MenuItem = { id: MenuId; title: string; subtitle: string; icon: IconName; color: string };
type Profile = {
  id: string; full_name: string | null; display_name: string | null;
  date_of_birth: string | null; skill_level: string | null; avatar_url: string | null;
  notifications_enabled: boolean | null; dark_mode: boolean | null;
  language: string | null; created_at: string | null;
};
type Member = Pick<Profile, 'id' | 'full_name' | 'display_name' | 'skill_level' | 'avatar_url'>;
type Match = { id: string; status: string; team_a_score: number | null; team_b_score: number | null };
type MatchPlayer = { match_id: string; player_id: string; team: string };
type Preferences = {
  matchNotifications: boolean; reminders: boolean; clubNews: boolean;
  darkMode: boolean; language: string; vibration: boolean;
};
const defaults: Preferences = {
  matchNotifications: true, reminders: true, clubNews: true,
  darkMode: true, language: 'English', vibration: true,
};
const SECTIONS: { title: string; items: MenuItem[] }[] = [
  { title: 'Club & Account', items: [
    { id: 'profile', title: 'My Profile', subtitle: 'View and edit\nyour details', icon: 'person-outline', color: C.green },
    { id: 'skill', title: 'Skill Level', subtitle: 'Current level\nand history', icon: 'stats-chart-outline', color: C.blue },
    { id: 'members', title: 'Club Members', subtitle: 'View all players', icon: 'people-outline', color: C.purple },
    { id: 'club', title: 'Club Info', subtitle: 'About our club', icon: 'shield-outline', color: C.orange },
  ] },
  { title: 'Preferences', items: [
    { id: 'notifications', title: 'Notifications', subtitle: 'Match updates\nand reminders', icon: 'notifications-outline', color: C.green },
    { id: 'language', title: 'Language', subtitle: 'English', icon: 'globe-outline', color: C.purple },
    { id: 'settings', title: 'App Settings', subtitle: 'General settings', icon: 'settings-outline', color: C.orange },
  ] },
  { title: 'Help & Support', items: [
    { id: 'help', title: 'Help Centre', subtitle: 'FAQs and guides', icon: 'help-circle-outline', color: C.green },
    { id: 'contact', title: 'Contact Admin', subtitle: 'Get in touch', icon: 'chatbox-outline', color: C.blue },
    { id: 'terms', title: 'Terms & Privacy', subtitle: 'Policies and terms', icon: 'document-text-outline', color: C.purple },
    { id: 'version', title: 'App Version', subtitle: 'v1.0.0', icon: 'information-circle-outline', color: C.orange },
  ] },
];
function displayName(p: Member | Profile | null) {
  return p?.display_name?.trim() || p?.full_name?.trim() || 'Club Player';
}
function Avatar({ name, url, size = 46 }: { name: string; url?: string | null; size?: number }) {
  const { C, s } = useThemeStyles();
  const shape = { width: size, height: size, borderRadius: size / 2 };
  return url ? (
    <Image source={{ uri: url }} style={[shape, { backgroundColor: C.tile, borderWidth: 1.5, borderColor: '#E7F1ED' }]} />
  ) : (
    <View style={[shape, { backgroundColor: '#145745', borderWidth: 1.5, borderColor: '#E7F1ED', alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: C.white, fontSize: size * 0.28, fontWeight: '800' }}>
        {name.split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase()}
      </Text>
    </View>
  );
}
function SkillBadge({ skill }: { skill: string }) {
  const { C, s } = useThemeStyles();
  const backgroundColor = skill.toLowerCase() === 'advanced' ? '#9A257B' :
    skill.toLowerCase() === 'intermediate' ? '#5444D8' : '#AF267F';
  return <View style={[s.skillBadge, { backgroundColor }]}><Text style={s.skillBadgeText}>{skill}</Text></View>;
}
function MenuCard({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  const { C, s } = useThemeStyles();
  return <Pressable onPress={onPress} style={({ pressed }) => [s.menuCard, pressed && s.pressed]}>
    <Ionicons name={item.icon} size={27} color={item.color} style={s.menuIcon} />
    <Text style={s.menuTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{item.title}</Text>
    <Text style={s.menuSubtitle} numberOfLines={2}>{item.subtitle}</Text>
    <Ionicons name="chevron-forward" size={15} color={C.white} style={s.menuArrow} />
  </Pressable>;
}
function Section({ title, items, onSelect }: { title: string; items: MenuItem[]; onSelect: (id: MenuId) => void }) {
  const { C, s } = useThemeStyles();
  return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>
    <View style={s.sectionGrid}>{items.map(item => <MenuCard key={item.id} item={item} onPress={() => onSelect(item.id)} />)}</View>
  </View>;
}
function SettingRow({ icon, title, subtitle, value, onChange, disabled = false }: {
  icon: IconName; title: string; subtitle?: string; value: boolean;
  onChange: (value: boolean) => void; disabled?: boolean;
}) {
  const { C, s } = useThemeStyles();
  return <View style={s.settingRow}><Ionicons name={icon} size={21} color={C.green} />
    <View style={s.settingInfo}><Text style={s.settingTitle}>{title}</Text>
      {!!subtitle && <Text style={s.settingSubtitle}>{subtitle}</Text>}
    </View><Switch value={value} onValueChange={onChange} disabled={disabled}
      trackColor={{ false: '#29453D', true: '#008B65' }} thumbColor={value ? C.green : '#A3B3AE'} />
  </View>;
}
function InfoRow({ title, value }: { title: string; value: string }) {
  const { C, s } = useThemeStyles();
  return <View style={s.infoRow}><Text style={s.infoLabel}>{title}</Text><Text style={s.infoValue}>{value}</Text></View>;
}
function memberSince(date?: string | null) {
  if (!date) return 'Member';
  return `Member since ${new Date(date).toLocaleDateString('en-IE', { month: 'short', year: 'numeric' })}`;
}

export default function MorePage() {
  const { C, s } = useThemeStyles();
  const { themeId, theme, ready: themeReady, setTheme } = useAppTheme();
  const [themeSaving, setThemeSaving] = useState(false);

  async function chooseTheme(id: ThemeId) {
    if (themeSaving || id === themeId) return;
    setThemeSaving(true);
    try {
      await setTheme(id);
    } catch (err) {
      Alert.alert('Theme Save Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setThemeSaving(false);
    }
  }

  const [selected, setSelected] = useState<MenuId | null>(null);
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const initializedFor = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error) console.warn('More auth:', error.message);
      setUserId(data.user?.id ?? null);
    });
    return () => { active = false; };
  }, []);

  const queryKey = ['riverside', 'more', userId] as const;
  const { data: account, isPending: loading, error: queryError, refetch } = useQuery({
    queryKey,
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData.user;
      if (!user || user.id !== userId) throw new Error('Please sign in again.');
      // Fetch the profile, member directory, completed matches and courts together.
      // Participants are then limited to completed matches, rather than all history.
      const [p, memberResult, matchResult, courtResult] = await Promise.all([
        supabase.from('profiles').select('id,full_name,display_name,date_of_birth,skill_level,avatar_url,notifications_enabled,dark_mode,language,created_at').eq('id', user.id).maybeSingle(),
        supabase.from('profiles').select('id,full_name,display_name,skill_level,avatar_url').order('full_name'),
        supabase.from('matches').select('id,status,team_a_score,team_b_score').eq('status', 'completed'),
        supabase.from('courts').select('id').eq('is_active', true),
      ]);
      for (const result of [p, memberResult, matchResult, courtResult]) {
        if (result.error) throw result.error;
      }
      const completedMatches = (matchResult.data ?? []) as Match[];
      let completedParticipants: MatchPlayer[] = [];
      if (completedMatches.length) {
        const { data, error } = await supabase.from('match_players')
          .select('match_id,player_id,team')
          .in('match_id', completedMatches.map(match => match.id));
        if (error) throw error;
        completedParticipants = (data ?? []) as MatchPlayer[];
      }
      return {
        profile: (p.data ?? null) as Profile | null,
        members: (memberResult.data ?? []) as Member[],
        matches: completedMatches,
        matchPlayers: completedParticipants,
        courtCount: courtResult.data?.length ?? 0,
        email: user.email ?? '',
      };
    },
  });
  const profile = account?.profile ?? null;
  const members = account?.members ?? [];
  const matches = account?.matches ?? [];
  const matchPlayers = account?.matchPlayers ?? [];
  const courtCount = account?.courtCount ?? 0;
  const error = queryError instanceof Error ? queryError.message : queryError ? 'Unable to load account data' : null;

  // Initialize editable fields once per user, not on every Realtime refresh.
  useEffect(() => {
    if (!account || !userId || initializedFor.current === userId) return;
    initializedFor.current = userId;
    setName(account.profile?.display_name ?? account.profile?.full_name ?? '');
    setFullName(account.profile?.full_name ?? '');
    setEmail(account.email);
    setPrefs(previous => ({ ...previous,
      matchNotifications: account.profile?.notifications_enabled ?? defaults.matchNotifications,
      darkMode: account.profile?.dark_mode ?? defaults.darkMode,
      language: account.profile?.language ?? defaults.language,
    }));
  }, [account, userId]);

  const load = useCallback(async () => {
    await refetch();
  }, [queryClient, userId, refetch]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`riverside-more-${userId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { void queryClient.invalidateQueries({ queryKey, exact: true }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => { void queryClient.invalidateQueries({ queryKey, exact: true }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_players' }, () => { void queryClient.invalidateQueries({ queryKey, exact: true }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courts' }, () => { void queryClient.invalidateQueries({ queryKey, exact: true }); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, queryClient]);

  const refreshMore = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  const stats = useMemo(() => {
    if (!profile) return { matches: 0, wins: 0, winRate: 0, avgPoints: 0 };
    let played = 0, decided = 0, wins = 0, points = 0;
    for (const match of matches) {
      if (match.team_a_score == null || match.team_b_score == null) continue;
      const participant = matchPlayers.find(row => row.match_id === match.id && row.player_id === profile.id);
      if (!participant) continue;
      const team = participant.team.toUpperCase();
      if (team !== 'A' && team !== 'B') continue;
      const ours = team === 'A' ? match.team_a_score : match.team_b_score;
      const theirs = team === 'A' ? match.team_b_score : match.team_a_score;
      played++; points += ours;
      if (ours !== theirs) { decided++; if (ours > theirs) wins++; }
    }
    return { matches: played, wins, winRate: decided ? Math.round(wins * 100 / decided) : 0, avgPoints: played ? points / played : 0 };
  }, [profile, matches, matchPlayers]);

  async function uploadAvatar() {
    if (!profile || avatarUploading) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo Access Needed', 'Allow photo library access to choose a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const photo = result.assets[0];
      if (!photo.base64) throw new Error('Could not read the selected photo.');
      const imageBytes = decode(photo.base64);
      if (imageBytes.byteLength > 5 * 1024 * 1024) {
        throw new Error('Please select an image smaller than 5 MB.');
      }

      setAvatarUploading(true);
      const path = `${profile.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, imageBytes, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = publicData.publicUrl;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', profile.id);
      if (updateError) throw updateError;

      queryClient.setQueryData<typeof account>(queryKey, previous => previous ? ({
        ...previous,
        profile: previous.profile ? { ...previous.profile, avatar_url: avatarUrl } : null,
        members: previous.members.map(member => member.id === profile.id ? { ...member, avatar_url: avatarUrl } : member),
      }) : previous);
      void queryClient.invalidateQueries({ queryKey: ['riverside', 'home'] });
      void queryClient.invalidateQueries({ queryKey: ['riverside', 'matches'] });
      Alert.alert('Photo Updated', 'Your new profile photo is now visible to club members.');
    } catch (err) {
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function saveProfile() {
    if (!profile) return;
    if (!name.trim()) { Alert.alert('Display Name Required', 'Please enter your name.'); return; }
    setSaving(true);
    try {
      const { error: updateError } = await supabase.from('profiles').update({
        display_name: name.trim(), full_name: fullName.trim() || null,
      }).eq('id', profile.id);
      if (updateError) throw updateError;
      if (email.trim() && email.trim() !== (await supabase.auth.getUser()).data.user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: email.trim() });
        if (emailError) throw emailError;
        Alert.alert('Email Confirmation', 'Check your email for a confirmation link. Your email may not change until confirmed.');
      } else Alert.alert('Saved', 'Your profile has been updated.');
      await load();
    } catch (err) { Alert.alert('Save Failed', err instanceof Error ? err.message : 'Please try again.'); }
    finally { setSaving(false); }
  }

  async function updatePreference(key: keyof Preferences, value: boolean | string) {
    const next = { ...prefs, [key]: value } as Preferences;
    setPrefs(next);
    if (!profile) return;
    const column = key === 'matchNotifications' ? 'notifications_enabled' :
      key === 'darkMode' ? 'dark_mode' : key === 'language' ? 'language' : null;
    if (!column) return;
    const { error: saveError } = await supabase.from('profiles').update({ [column]: value }).eq('id', profile.id);
    if (saveError) { setPrefs(prefs); Alert.alert('Save Failed', saveError.message); }
    else void queryClient.invalidateQueries({ queryKey, exact: true });
  }

  function logout() {
    Alert.alert('Log Out', 'Sign out of your Riverside account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) Alert.alert('Sign Out Failed', signOutError.message);
      } },
    ]);
  }

  const currentName = displayName(profile);
  const skill = profile?.skill_level || 'Unrated';
  const item = SECTIONS.flatMap(section => section.items).find(entry => entry.id === selected);
  async function sendContact() {
    if (!message.trim()) { Alert.alert('Message Required', 'Please enter your message.'); return; }
    if (!profile) return;
    setContactSending(true);
    try {
      const { error: sendError } = await supabase.from('club_messages').insert({ sender_id: profile.id, message: message.trim() });
      if (sendError) throw sendError;
      setMessage('');
      Alert.alert('Message Sent', 'Your message has been saved for the club team.');
    } catch (err) { Alert.alert('Unable to Send', err instanceof Error ? err.message : 'Please try again.'); }
    finally { setContactSending(false); }
  }

  function renderDetail() {
    switch (selected) {
      case 'profile': return <View style={s.detailContent}>
        <View style={s.profileModalHeader}>
          <Pressable onPress={() => void uploadAvatar()} disabled={avatarUploading} accessibilityRole="button" accessibilityLabel="Change profile photo" style={{ alignItems: 'center', gap: 7 }}>
            <Avatar name={currentName} url={profile?.avatar_url} size={74} />
            {avatarUploading ? <ActivityIndicator color={C.green} /> : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="camera-outline" size={16} color={C.green} />
                <Text style={{ color: C.green, fontSize: 13, fontWeight: '700' }}>Change Photo</Text>
              </View>
            )}
          </Pressable>
          <SkillBadge skill={skill} />
          <Text style={s.mutedText}>{memberSince(profile?.created_at)}</Text>
        </View>
        <Text style={s.fieldLabel}>Display Name</Text>
        <TextInput style={s.textField} value={name} onChangeText={setName} placeholder="Display name" placeholderTextColor={C.muted} />
        <Text style={s.fieldLabel}>Full Name</Text>
        <TextInput style={s.textField} value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor={C.muted} />
        <Text style={s.fieldLabel}>Email Address</Text>
        <TextInput style={s.textField} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={C.muted} />
        <Text style={s.helperText}>Email changes may require confirmation. Your skill level is read from your club profile.</Text>
        <Pressable style={s.actionButton} onPress={() => void saveProfile()} disabled={saving}>
          <Text style={s.actionButtonText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
        </Pressable>
      </View>;
      case 'skill': return <View style={s.detailContent}>
        <View style={s.skillHero}><Ionicons name="stats-chart-outline" size={35} color={C.blue} />
          <Text style={s.detailLarge}>{skill}</Text><Text style={s.mutedText}>Your current club skill level</Text>
        </View>
        <InfoRow title="Current Level" value={skill} />
        <InfoRow title="Matches Played" value={String(stats.matches)} />
        <InfoRow title="Win Rate" value={`${stats.winRate}%`} />
        <InfoRow title="Avg. Points" value={stats.avgPoints.toFixed(1)} />
        <Text style={s.helperText}>Performance is calculated from your completed matches. Skill level history is not recorded yet.</Text>
      </View>;
      case 'members': return <View style={s.detailContent}>
        <Text style={s.mutedText}>Riverside club players · {members.length} visible</Text>
        {members.length === 0 && <Text style={s.helperText}>No members are visible under your current database permissions.</Text>}
        {members.map(member => <View key={member.id} style={s.memberRow}>
          <Avatar name={displayName(member)} url={member.avatar_url} size={39} />
          <View style={s.memberInfo}><Text style={s.memberName}>{displayName(member)}</Text>
            <Text style={s.memberSkill}>{member.skill_level || 'Unrated'}</Text></View>
          <Ionicons name="person-outline" size={18} color={C.muted} />
        </View>)}
      </View>;
      case 'club': return <View style={s.detailContent}>
        <View style={s.skillHero}><Text style={s.clubEmoji}>🏸</Text>
          <Text style={s.detailLarge}>Riverside Badminton Club</Text>
          <Text style={s.mutedText}>Play. Improve. Connect.</Text></View>
        <InfoRow title="Active Courts" value={String(courtCount)} />
        <InfoRow title="Main Sport" value="Badminton" />
        <InfoRow title="Primary Format" value="Doubles" />
      </View>;
      case 'notifications': return <View style={s.detailContent}>
        <SettingRow icon="tennisball-outline" title="Match Updates" subtitle="Saved notification preference" value={prefs.matchNotifications} onChange={v => void updatePreference('matchNotifications', v)} />
        <SettingRow icon="alarm-outline" title="Session Reminders" subtitle="Preference only; reminders not yet implemented" value={prefs.reminders} onChange={v => void updatePreference('reminders', v)} />
        <SettingRow icon="megaphone-outline" title="Club Announcements" subtitle="Preference only; delivery not yet implemented" value={prefs.clubNews} onChange={v => void updatePreference('clubNews', v)} />
        <Text style={s.helperText}>Match Updates is saved in your Supabase profile. The other switches are local to this screen. Push notifications are not yet configured.</Text>
      </View>;
      case 'appearance': return <View style={s.detailContent}>
        <Text style={s.detailSectionTitle}>Choose Your Theme</Text>
        <Text style={s.helperText}>Personalize Riverside. Your selection is stored for your account and on this device.</Text>
        <View style={[s.themePreview, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={[s.themeSampleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={s.themeSampleTop}>
              <Ionicons name="tennisball-outline" size={23} color={theme.accent} />
              <Text style={[s.themeSampleTitle, { color: theme.text }]}>Riverside</Text>
              <View style={[s.themeSampleDot, { backgroundColor: theme.accent }]} />
            </View>
            <Text style={[s.themeSampleSubtitle, { color: theme.muted }]}>Your next badminton session</Text>
            <View style={[s.themeSampleButton, { backgroundColor: theme.accent }]} />
          </View>
          <Text style={[s.settingTitle, { color: theme.text }]}>{theme.name}</Text>
          <Text style={[s.settingSubtitle, { color: theme.muted }]}>{theme.isDark ? 'Dark appearance' : 'Light appearance'} · Selected theme</Text>
        </View>
        {(Object.keys(THEMES) as ThemeId[]).map(id => {
          const option = THEMES[id];
          const active = id === themeId;
          return <Pressable key={id} disabled={!themeReady || themeSaving}
            onPress={() => void chooseTheme(id)}
            style={({ pressed }) => [s.themeChoice, {
              backgroundColor: active ? theme.tile : C.card,
              borderColor: active ? theme.accent : C.border,
              opacity: pressed ? 0.7 : 1,
            }]}>
            <View style={[s.themeSwatch, { backgroundColor: option.background, borderColor: option.border }]}>
              <View style={[s.themeSwatchAccent, { backgroundColor: option.accent }]} />
            </View>
            <View style={s.settingInfo}>
              <Text style={s.settingTitle}>{option.name}</Text>
              <Text style={s.settingSubtitle}>{option.isDark ? 'Dark' : 'Light'} theme</Text>
            </View>
            <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={23}
              color={active ? theme.accent : C.muted} />
          </Pressable>;
        })}
        {(!themeReady || themeSaving) && <ActivityIndicator color={theme.accent} />}
        <Text style={s.helperText}>The selected theme is saved immediately. Other pages will adopt these colors when we connect their styles in Step 3.</Text>
      </View>;
      case 'language': return <View style={s.detailContent}>
        {['English', 'Nederlands', 'Ελληνικά'].map(option => <Pressable key={option} style={s.choiceRow} onPress={() => void updatePreference('language', option)}>
          <Text style={s.choiceText}>{option}</Text>{prefs.language === option && <Ionicons name="checkmark-circle" size={22} color={C.green} />}
        </Pressable>)}
        <Text style={s.helperText}>Your language choice is saved to Supabase. Translations are not implemented yet.</Text>
      </View>;
      case 'settings': return <View style={s.detailContent}>
        <SettingRow icon="phone-portrait-outline" title="Haptic Feedback" subtitle="Preference only; haptics not yet implemented" value={prefs.vibration} onChange={v => void updatePreference('vibration', v)} />
        <InfoRow title="App Platform" value={Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS} />
        <InfoRow title="App Version" value="1.0.0" /><InfoRow title="Current Theme" value={theme.name} />
        <Text style={s.helperText}>Haptic preference is local to this screen until the app-wide settings system is implemented.</Text>
      </View>;
      case 'help': return <View style={s.detailContent}>
        <Text style={s.detailSectionTitle}>Frequently Asked Questions</Text>
        <Text style={s.faqQuestion}>How do I mark my attendance?</Text><Text style={s.faqAnswer}>Open Matches, select Attendance and choose your attendance status for the club session.</Text>
        <Text style={s.faqQuestion}>Where can I view my results?</Text><Text style={s.faqAnswer}>Open Matches for match results, or Statistics for your performance overview.</Text>
        <Text style={s.faqQuestion}>How do rankings work?</Text><Text style={s.faqAnswer}>Open Leaderboard and select Win Rate, Matches, Points or Form to change the ranking method.</Text>
        <Text style={s.faqQuestion}>How many courts does Riverside have?</Text><Text style={s.faqAnswer}>The club currently has {courtCount} active courts listed in the database.</Text>
      </View>;
      case 'contact': return <View style={s.detailContent}>
        <Text style={s.mutedText}>Send a message to the club team.</Text>
        <TextInput style={[s.textField, s.messageField]} multiline textAlignVertical="top" value={message} onChangeText={setMessage} placeholder="Write your message..." placeholderTextColor={C.muted} />
        <Pressable style={s.actionButton} onPress={() => void sendContact()} disabled={contactSending}>
          <Ionicons name="send-outline" size={17} color={C.white} /><Text style={s.actionButtonText}>{contactSending ? 'Sending...' : 'Send Message'}</Text>
        </Pressable>
      </View>;
      case 'terms': return <View style={s.detailContent}>
        <Text style={s.detailSectionTitle}>Terms & Privacy</Text>
        <Text style={s.bodyText}>Riverside stores your account profile, attendance, match participation and preferences in Supabase.</Text>
        <Text style={s.bodyText}>Club member names and performance may be visible to other authenticated club members, subject to database permissions.</Text>
        <Text style={s.bodyText}>Official Terms of Use and a Privacy Policy must be supplied and approved by the club before production launch. This screen is not a substitute for those documents.</Text>
      </View>;
      case 'version': return <View style={s.detailContent}>
        <View style={s.skillHero}><Ionicons name="information-circle-outline" size={44} color={C.orange} />
          <Text style={s.detailLarge}>Riverside</Text><Text style={s.mutedText}>Badminton Club App</Text></View>
        <InfoRow title="Version" value="1.0.0" />
        <InfoRow title="Platform" value={Platform.OS === 'ios' ? 'iOS' : Platform.OS} />
        <InfoRow title="Build Stage" value="Development" /><InfoRow title="Interface" value="Player App" />
      </View>;
      default: return null;
    }
  }

  return <View style={s.root}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={C.green} onRefresh={() => { void refreshMore(); }} />}>
      <View style={s.content}>
        {loading && <ActivityIndicator color={C.green} />}
        {!!error && <Pressable onPress={() => void load()} style={s.profileCard}><Text style={{ color: C.red }}>{error} · Tap to retry</Text></Pressable>}
        <Pressable onPress={() => setSelected('profile')} style={s.profileCard}>
          <Avatar name={currentName} url={profile?.avatar_url} size={69} />
          <View style={s.profileInfo}><Text style={s.profileName} numberOfLines={1}>{currentName}</Text>
            <SkillBadge skill={skill} /><Text style={s.memberSince}>{memberSince(profile?.created_at)}</Text></View>
          <Ionicons name="chevron-forward" size={23} color={C.white} />
        </Pressable>
        {SECTIONS.map(section => <Section key={section.title} title={section.title} items={section.items} onSelect={setSelected} />)}
        <Pressable onPress={logout} style={s.logoutCard}>
          <Ionicons name="log-out-outline" size={29} color={C.red} />
          <Text style={s.logoutText}>Log Out</Text><Ionicons name="chevron-forward" size={22} color={C.white} />
        </Pressable>
      </View>
    </ScrollView>
    <Modal visible={selected !== null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
      <KeyboardAvoidingView style={s.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} />
        <View style={s.modalCard}>
          <View style={s.modalHeader}><View style={s.modalHeadingGroup}>
            <Ionicons name={item?.icon || 'settings-outline'} size={23} color={item?.color || C.green} />
            <Text style={s.modalTitle}>{item?.title || ''}</Text>
          </View><Pressable onPress={() => setSelected(null)} style={s.closeButton}>
            <Ionicons name="close" size={20} color={C.white} /></Pressable></View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.modalScroll}>
            {renderDetail()}
          </ScrollView>
          <Pressable onPress={() => setSelected(null)} style={s.doneButton}><Text style={s.doneButtonText}>Done</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </View>;
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
        paddingBottom: 28,
    },

    /* HEADER */

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
        ...StyleSheet.absoluteFill,
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
        backgroundColor: C.red,
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

    /* CONTENT */

    content: {
        paddingHorizontal: 12,
        gap: 18,
        marginTop: -3,
    },

    /* PROFILE */

    profileCard: {
        minHeight: 102,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 14,
        backgroundColor: C.card,
        paddingHorizontal: 13,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    profileInfo: {
        flex: 1,
        alignItems: 'flex-start',
        gap: 5,
    },

    profileName: {
        color: C.white,
        fontSize: 19,
        fontWeight: '800',
    },

    skillBadge: {
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#5444D8',
        alignSelf: 'flex-start',
    },

    skillBadgeText: {
        color: C.white,
        fontSize: 11,
        fontWeight: '600',
    },

    memberSince: {
        color: C.muted,
        fontSize: 12,
    },

    /* SECTIONS */

    section: {
        gap: 9,
    },

    sectionTitle: {
        color: C.white,
        fontSize: 17,
        fontWeight: '800',
        paddingHorizontal: 3,
    },

    sectionGrid: {
        flexDirection: 'row',
        gap: 8,
    },

    menuCard: {
        flex: 1,
        minWidth: 0,
        height: 122,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 12,
        backgroundColor: C.card,
        paddingHorizontal: 9,
        paddingTop: 14,
        paddingBottom: 10,
        justifyContent: 'flex-start',
    },

    pressed: {
        backgroundColor: '#103A2F',
    },

    menuIcon: {
        marginBottom: 11,
    },

    menuTitle: {
        color: C.white,
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 8,
    },

    menuSubtitle: {
        color: C.muted,
        fontSize: 9,
        lineHeight: 12,
        paddingRight: 1,
    },

    menuArrow: {
        position: 'absolute',
        right: 5,
        bottom: 7,
    },

    /* LOG OUT */

    logoutCard: {
        height: 58,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#4E3828',
        backgroundColor: '#1A2621',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 16,
        marginTop: 3,
    },

    logoutText: {
        color: C.red,
        fontSize: 17,
        fontWeight: '800',
        flex: 1,
    },

    /* MODAL */

    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },

    modalCard: {
        backgroundColor: '#082A23',
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 18,
        maxHeight: '82%',
        padding: 16,
        gap: 13,
    },

    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    modalHeadingGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        flex: 1,
    },

    modalTitle: {
        color: C.white,
        fontSize: 18,
        fontWeight: '800',
    },

    closeButton: {
        width: 31,
        height: 31,
        borderRadius: 16,
        backgroundColor: C.tile,
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalScroll: {
        paddingBottom: 5,
    },

    detailContent: {
        gap: 13,
    },

    profileModalHeader: {
        alignItems: 'center',
        gap: 9,
        paddingVertical: 9,
    },

    mutedText: {
        color: C.muted,
        fontSize: 12,
        textAlign: 'center',
    },

    fieldLabel: {
        color: C.white,
        fontSize: 12,
        fontWeight: '700',
    },

    textField: {
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 10,
        color: C.white,
        paddingHorizontal: 12,
        paddingVertical: 11,
        fontSize: 14,
    },

    helperText: {
        color: C.muted,
        fontSize: 11,
        lineHeight: 17,
        marginTop: 5,
    },

    skillHero: {
        alignItems: 'center',
        gap: 9,
        paddingVertical: 18,
    },

    detailLarge: {
        color: C.white,
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
    },

    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        paddingVertical: 12,
        gap: 10,
    },

    infoLabel: {
        color: C.muted,
        fontSize: 13,
    },

    infoValue: {
        color: C.white,
        fontSize: 13,
        fontWeight: '700',
    },

    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },

    memberInfo: {
        flex: 1,
        gap: 4,
    },

    memberName: {
        color: C.white,
        fontSize: 14,
        fontWeight: '700',
    },

    memberSkill: {
        color: C.muted,
        fontSize: 11,
    },

    clubEmoji: {
        fontSize: 40,
    },

    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },

    settingInfo: {
        flex: 1,
        gap: 4,
    },

    settingTitle: {
        color: C.white,
        fontSize: 14,
        fontWeight: '700',
    },

    settingSubtitle: {
        color: C.muted,
        fontSize: 11,
    },

    themePreview: {
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 12,
        backgroundColor: C.card,
        alignItems: 'center',
        padding: 20,
        gap: 9,
    },

    themeSampleCard: {
        width: '100%',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        gap: 10,
    },
    themeSampleTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
    },
    themeSampleTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '800',
    },
    themeSampleDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
    },
    themeSampleSubtitle: {
        fontSize: 12,
    },
    themeSampleButton: {
        width: '100%',
        height: 9,
        borderRadius: 6,
    },
    themeChoice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderWidth: 1,
        borderRadius: 12,
    },
    themeSwatch: {
        width: 45,
        height: 45,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    themeSwatchAccent: {
        width: 21,
        height: 21,
        borderRadius: 11,
    },

    choiceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 10,
        backgroundColor: C.card,
    },

    choiceText: {
        color: C.white,
        fontSize: 14,
        fontWeight: '600',
    },

    detailSectionTitle: {
        color: C.white,
        fontSize: 16,
        fontWeight: '800',
    },

    faqQuestion: {
        color: C.white,
        fontSize: 13,
        fontWeight: '700',
    },

    faqAnswer: {
        color: C.muted,
        fontSize: 12,
        lineHeight: 18,
    },

    messageField: {
        minHeight: 125,
    },

    actionButton: {
        backgroundColor: '#00A978',
        borderRadius: 11,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },

    actionButtonText: {
        color: C.white,
        fontSize: 14,
        fontWeight: '700',
    },

    bodyText: {
        color: C.muted,
        fontSize: 13,
        lineHeight: 20,
    },

    doneButton: {
        backgroundColor: '#00A978',
        borderRadius: 11,
        paddingVertical: 13,
        alignItems: 'center',
    },

    doneButtonText: {
        color: C.white,
        fontSize: 14,
        fontWeight: '700',
    },
});
