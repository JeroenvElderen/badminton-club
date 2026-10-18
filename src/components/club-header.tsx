import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/providers/theme-provider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const HEADER_IMAGE = require('../../assets/images/shuttleheader.png');

type ClubHeaderProps = {
  title: string;
  subtitle: string;
  highlight?: string;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
  avatarSource?: ImageSourcePropType;
};

export default function ClubHeader({
  title,
  subtitle,
  highlight,
  onNotificationsPress,
  onProfilePress,
  avatarSource,
}: ClubHeaderProps) {
  const { theme } = useAppTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const loadAvatar = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', id)
      .maybeSingle();
    if (!error) setAvatarUrl(data?.avatar_url ?? null);
  }, []);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUserId(data.user?.id ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (!session?.user) setAvatarUrl(null);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    void loadAvatar(userId);
    const channel = supabase
      .channel(`riverside-header-avatar-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => { void loadAvatar(userId); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, loadAvatar]);

  const rgb = [
    parseInt(theme.background.slice(1, 3), 16),
    parseInt(theme.background.slice(3, 5), 16),
    parseInt(theme.background.slice(5, 7), 16),
  ].join(', ');

  const fade = (opacity: number) => `rgba(${rgb}, ${opacity})`;
  const displayAvatar: ImageSourcePropType | null = avatarSource ?? (avatarUrl ? { uri: avatarUrl } : null);

  function renderTitle() {
    if (!highlight) return title;
    const position = title.toLowerCase().lastIndexOf(highlight.toLowerCase());
    if (position === -1) return title;
    const before = title.slice(0, position);
    const colored = title.slice(position, position + highlight.length);
    const after = title.slice(position + highlight.length);
    return <>{before}<Text style={[styles.highlight, { color: theme.accentSoft }]}>{colored}</Text>{after}</>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image source={HEADER_IMAGE} resizeMode="cover" style={styles.backgroundImage} />
      <View pointerEvents="none" style={[styles.colorTint, { backgroundColor: fade(0.14) }]} />
      <LinearGradient
        colors={[fade(0.48), fade(0.12), fade(0.18), fade(0.58), fade(0.88), theme.background]}
        locations={[0, 0.2, 0.4, 0.62, 0.82, 1]}
        style={styles.gradient}
      >
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <Text style={styles.shuttlecock}>🏸</Text>
            <View>
              <Text style={[styles.brandName, { color: theme.text }]}>Riverside</Text>
              <Text style={[styles.brandName, { color: theme.text }]}>Badminton Club</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={styles.notificationButton}
              onPress={onNotificationsPress}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={24} color={theme.text} />
              <View style={styles.notificationDot} />
            </Pressable>
            <Pressable
              onPress={onProfilePress}
              accessibilityRole="button"
              accessibilityLabel="My profile"
              style={[styles.avatar, { backgroundColor: theme.tile, borderColor: theme.border }]}
            >
              {displayAvatar ? (
                <Image source={displayAvatar} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person-outline" size={23} color={theme.accent} />
              )}
            </Pressable>
          </View>
        </View>
        <View style={styles.heading}>
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {renderTitle()}
          </Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: 224, backgroundColor: '#031B16', overflow: 'hidden' },
  backgroundImage: { position: 'absolute', width: '150%', height: '105%', top: 1, right: -40, opacity: 1 },
  colorTint: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,42,32,0.14)' },
  gradient: { flex: 1, paddingHorizontal: 19, justifyContent: 'space-between' },
  topBar: { paddingTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shuttlecock: { fontSize: 29, width: 36, textAlign: 'center' },
  brandName: { color: '#F6FBF8', fontSize: 14, fontWeight: '700', lineHeight: 19, letterSpacing: 0.1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 17 },
  notificationButton: { position: 'relative', padding: 4 },
  notificationDot: { position: 'absolute', right: 2, top: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4C59' },
  avatar: { width: 43, height: 43, borderRadius: 21.5, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  heading: { paddingBottom: 45 },
  title: { color: '#F6FBF8', fontSize: 34, fontWeight: '800', letterSpacing: -1, lineHeight: 42 },
  highlight: { color: '#78DCC0' },
  subtitle: { color: '#F6FBF8', fontSize: 18, fontWeight: '500', marginTop: 3 },
});
