import { supabase } from '@/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Night = { id: string; title: string | null; starts_at: string; ends_at: string; status: string | null };
type Filter = 'Upcoming' | 'Past' | 'All';
const C = { bg: '#031B16', panel: '#06251E', tile: '#092B24', border: '#145B49', green: '#00D995', white: '#F6FBF8', muted: '#A6B8B1' };
const fmtTime = (date: string) => new Date(date).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false });

function formatCreateError(error: unknown) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const details = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const lines: string[] = [];
    if (typeof details.message === 'string' && details.message.trim()) lines.push(details.message);
    if (typeof details.code === 'string' && details.code.trim()) lines.push('Code: ' + details.code);
    if (typeof details.details === 'string' && details.details.trim()) lines.push(details.details);
    if (typeof details.hint === 'string' && details.hint.trim()) lines.push('Hint: ' + details.hint);
    if (lines.length) return lines.join('\n');
  }
  return 'The request failed without a database error message. Check the connection and permissions.';
}

export default function AdminNightsPage() {
  const [filter, setFilter] = useState<Filter>('Upcoming');
  const [nights, setNights] = useState<Night[]>([]);
  const [attendance, setAttendance] = useState<Record<string, number>>({});
  const [courtCount, setCourtCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [title, setTitle] = useState('Club Night');
  const [day, setDay] = useState(''); // YYYY-MM-DD
  const [start, setStart] = useState('19:00');
  const [end, setEnd] = useState('22:00');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [sessions, courts] = await Promise.all([
        supabase.from('club_sessions').select('id,title,starts_at,ends_at,status').order('starts_at', { ascending: false }).limit(150),
        supabase.from('courts').select('id').eq('is_active', true),
      ]);
      if (sessions.error) throw sessions.error;
      if (courts.error) throw courts.error;
      const rows = (sessions.data ?? []) as Night[];
      setNights(rows);
      setCourtCount(courts.data?.length ?? 0);
      const counts: Record<string, number> = {};
      // Attendance comes from the existing restricted session directory RPC.
      await Promise.all(rows.map(async (night) => {
        const { data, error: directoryError } = await supabase.rpc('riverside_session_players', { p_session_id: night.id });
        if (!directoryError && Array.isArray(data)) {
          counts[night.id] = data.filter((player: { attendance_status?: string }) =>
            ['going', 'attending', 'yes'].includes((player.attendance_status ?? '').toLowerCase())
          ).length;
        }
      }));
      setAttendance(counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load club nights.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const now = Date.now();
  const visible = useMemo(() => nights.filter(n => {
    if (filter === 'All') return true;
    const past = new Date(n.ends_at).getTime() < now;
    return filter === 'Past' ? past : !past;
  }).sort((a, b) => filter === 'Past'
    ? new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
    : new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()), [nights, filter, now]);

  const saveNight = async () => {
    setFormError(null);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
      const message = 'Use YYYY-MM-DD for the date and HH:MM for the times.';
      setFormError(message);
      Alert.alert('Check the date and time', message);
      return;
    }

    const [year, month, dateNumber] = day.split('-').map(Number);
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const startsAt = new Date(year, month - 1, dateNumber, startHour, startMinute, 0, 0);
    const endsAt = new Date(year, month - 1, dateNumber, endHour, endMinute, 0, 0);
    const validLocalDateTime = (value: Date, hour: number, minute: number) =>
      value.getFullYear() === year &&
      value.getMonth() === month - 1 &&
      value.getDate() === dateNumber &&
      value.getHours() === hour &&
      value.getMinutes() === minute;

    if (
      !validLocalDateTime(startsAt, startHour, startMinute) ||
      !validLocalDateTime(endsAt, endHour, endMinute) ||
      endsAt <= startsAt
    ) {
      const message = 'Enter a valid date and make sure the end time is after the start time.';
      setFormError(message);
      Alert.alert('Invalid club night', message);
      return;
    }

    if (!title.trim()) {
      const message = 'Enter a club night title.';
      setFormError(message);
      Alert.alert('Title required', message);
      return;
    }

    setSaving(true);
    try {
      const { error: insertError } = await supabase.from('club_sessions').insert({
        title: title.trim(),
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: 'scheduled',
      });
      if (insertError) throw insertError;
      setCreating(false);
      setFormError(null);
      await load();
      Alert.alert('Club night created', 'Your new club night is now listed.');
    } catch (e) {
      console.error('Unable to create club night:', e);
      setFormError(formatCreateError(e));
    } finally {
      setSaving(false);
    }
  };

  return <View style={s.root}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={C.green} onRefresh={() => { setRefreshing(true); void load(); }} />}>
      <Pressable style={s.create} onPress={() => { setFormError(null); setCreating(true); }}><Ionicons name="add" size={27} color={C.white} /><Text style={s.createText}>Create Club Night</Text></Pressable>
      <View style={s.filters}>{(['Upcoming', 'Past', 'All'] as Filter[]).map(f => <Pressable key={f} onPress={() => setFilter(f)} style={[s.filter, filter === f && s.selectedFilter]}><Text style={[s.filterText, filter === f && { fontWeight: '800' }]}>{f}</Text></Pressable>)}</View>
      {loading && <ActivityIndicator size="large" color={C.green} style={{ marginTop: 24 }} />}
      {!!error && <Pressable style={s.card} onPress={() => void load()}><Text style={s.error}>{error}</Text><Text style={s.muted}>Tap to retry</Text></Pressable>}
      {!loading && !error && visible.length === 0 && <View style={s.card}><Text style={s.cardTitle}>No {filter.toLowerCase()} club nights</Text><Text style={s.muted}>Create a club night or choose another filter.</Text></View>}
      {visible.map(night => {
        const date = new Date(night.starts_at);
        const isLive = date.getTime() <= now && new Date(night.ends_at).getTime() >= now;
        const daysAway = Math.max(0, Math.ceil((date.getTime() - now) / 86400000));
        return <Pressable key={night.id} style={s.card} onPress={() => Alert.alert(night.title || 'Club Night', `${date.toLocaleDateString('en-IE', { dateStyle: 'full' })}\n${fmtTime(night.starts_at)} – ${fmtTime(night.ends_at)}\nStatus: ${night.status ?? 'Scheduled'}\n${attendance[night.id] ?? '–'} signed up`, [{ text: 'Close' }])}>
          <View style={s.dateBox}><Text style={s.dayName}>{date.toLocaleDateString('en-IE', { weekday: 'short' }).toUpperCase()}</Text><Text style={s.dayNumber}>{date.getDate()}</Text><Text style={s.month}>{date.toLocaleDateString('en-IE', { month: 'short' }).toUpperCase()}</Text></View>
          <View style={s.nightInfo}>
            <View style={s.infoLine}><Ionicons name="time-outline" size={18} color={C.white} /><Text style={s.infoText}>{fmtTime(night.starts_at)} – {fmtTime(night.ends_at)}</Text></View>
            <View style={s.infoLine}><Ionicons name="location-outline" size={18} color={C.white} /><Text style={s.infoText} numberOfLines={1}>{night.title || 'Club Night'}</Text></View>
            <View style={s.infoLine}><Ionicons name="grid-outline" size={18} color={C.white} /><Text style={s.infoText}>{courtCount} active courts</Text></View>
            <View style={s.infoLine}><Ionicons name="people-outline" size={18} color={C.white} /><Text style={s.infoText}>{attendance[night.id] ?? '–'} signed up</Text></View>
          </View>
          <View style={s.cardRight}><View style={[s.statusPill, isLive && s.livePill]}><Text style={[s.statusText, isLive && { color: C.green }]}>{isLive ? '● Live Now' : date.getTime() > now ? `In ${daysAway} days` : 'Past'}</Text></View><Ionicons name="chevron-forward" size={24} color={C.white} /></View>
        </Pressable>;
      })}
      <Pressable style={s.recurring} onPress={() => Alert.alert('Recurring Schedule', 'Recurring club-night rules will be added in the next step. No schedule has been changed.')}><Ionicons name="sync" size={35} color={C.green} /><View style={{ flex: 1 }}><Text style={s.cardTitle}>Recurring Schedule</Text><Text style={s.muted}>Set up repeating club nights</Text></View><Ionicons name="chevron-forward" size={22} color={C.white} /></Pressable>
    </ScrollView>
    <Modal
      visible={creating}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (!saving) setCreating(false);
      }}
    >
      <KeyboardAvoidingView
        style={s.modalShade}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={s.modalScroll}
          contentContainerStyle={s.modalScrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.modalBody}>
            <Text style={s.modalTitle}>Create Club Night</Text>
            <Text style={s.muted}>Date and times are entered in your device's local timezone.</Text>

            <Text style={s.inputLabel}>Title</Text>
            <TextInput
              style={s.input}
              value={title}
              onChangeText={value => { setTitle(value); setFormError(null); }}
              placeholder="Club Night"
              placeholderTextColor={C.muted}
              returnKeyType="next"
            />

            <Text style={s.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={s.input}
              value={day}
              onChangeText={value => { setDay(value); setFormError(null); }}
              placeholder="2026-10-22"
              placeholderTextColor={C.muted}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              returnKeyType="next"
            />

            <View style={s.timeFields}>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Starts (HH:MM)</Text>
                <TextInput
                  style={s.input}
                  value={start}
                  onChangeText={value => { setStart(value); setFormError(null); }}
                  placeholder="19:00"
                  placeholderTextColor={C.muted}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="next"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Ends (HH:MM)</Text>
                <TextInput
                  style={s.input}
                  value={end}
                  onChangeText={value => { setEnd(value); setFormError(null); }}
                  placeholder="22:00"
                  placeholderTextColor={C.muted}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                />
              </View>
            </View>

            {formError ? <Text style={s.formError}>{formError}</Text> : null}

            <View style={s.modalActions}>
              <Pressable
                style={s.cancel}
                onPress={() => setCreating(false)}
                disabled={saving}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.confirm, saving && { opacity: 0.6 }]}
                onPress={() => void saveNight()}
                disabled={saving}
              >
                <Text style={s.createText}>{saving ? 'Creating…' : 'Create Night'}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg }, content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24, gap: 12 },
  create: { backgroundColor: '#00AC80', borderRadius: 17, minHeight: 60, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12 }, createText: { color: C.white, fontSize: 17, fontWeight: '800' },
  filters: { flexDirection: 'row', borderWidth: 1, borderColor: C.border, borderRadius: 14, overflow: 'hidden' }, filter: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center' }, selectedFilter: { backgroundColor: '#008D6A', borderRadius: 12, borderWidth: 1, borderColor: C.green }, filterText: { color: C.white, fontSize: 15 },
  card: { borderWidth: 1, borderColor: C.border, backgroundColor: C.panel, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBox: { width: 76, minHeight: 112, borderRadius: 14, backgroundColor: C.tile, alignItems: 'center', justifyContent: 'center', gap: 3 }, dayName: { color: C.white, fontSize: 14, fontWeight: '700' }, dayNumber: { color: C.white, fontSize: 30, fontWeight: '800' }, month: { color: C.green, fontSize: 15 },
  nightInfo: { flex: 1, gap: 10 }, infoLine: { flexDirection: 'row', alignItems: 'center', gap: 8 }, infoText: { color: C.white, fontSize: 12, flexShrink: 1 },
  cardRight: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' }, statusPill: { backgroundColor: C.tile, paddingHorizontal: 9, paddingVertical: 9, borderRadius: 12 }, livePill: { backgroundColor: '#034A39' }, statusText: { color: C.white, fontSize: 10 },
  recurring: { borderWidth: 1, borderColor: C.border, backgroundColor: C.panel, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }, cardTitle: { color: C.white, fontWeight: '800', fontSize: 16 }, muted: { color: C.muted, fontSize: 12, lineHeight: 18 }, error: { color: '#FF9999', fontSize: 13 },
  modalShade: { flex: 1, backgroundColor: '#000B', justifyContent: 'flex-end' },
  modalScroll: { width: '100%', maxHeight: '92%' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modalBody: { backgroundColor: C.panel, padding: 22, paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 10 },
  timeFields: { flexDirection: 'row', gap: 12 },
  formError: { color: '#FF9999', fontSize: 12, lineHeight: 18 }, modalTitle: { color: C.white, fontSize: 24, fontWeight: '800' }, inputLabel: { color: C.white, fontSize: 13, fontWeight: '700', marginTop: 8 }, input: { backgroundColor: C.tile, color: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, fontSize: 16 }, modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 }, cancel: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 15, alignItems: 'center' }, cancelText: { color: C.white, fontWeight: '700' }, confirm: { flex: 1, backgroundColor: '#00AC80', borderRadius: 12, padding: 15, alignItems: 'center' },
});
