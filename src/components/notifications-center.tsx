import { useNotifications, type ClubNotification } from '@/hooks/use-notifications';
import { useAppTheme } from '@/providers/theme-provider';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type NotificationsCenterProps = {
  userId: string;
  visible: boolean;
  onClose: () => void;
  onOpenMatches: () => void;
};

function timeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  return 'Please try again.';
}

export default function NotificationsCenter({
  userId,
  visible,
  onClose,
  onOpenMatches,
}: NotificationsCenterProps) {
  const { theme } = useAppTheme();
  const [markingAll, setMarkingAll] = useState(false);
  const { notifications, unreadCount, loading, error, markRead, markAllRead, refresh } =
    useNotifications(userId, visible, false);

  async function openNotification(notification: ClubNotification) {
    try {
      if (!notification.read_at) await markRead(notification.id);
      onClose();
      if (notification.type === 'match_assigned' || notification.type === 'match_result') {
        onOpenMatches();
      }
    } catch (err) {
      Alert.alert('Unable to open notification', errorMessage(err));
    }
  }

  async function clearUnread() {
    setMarkingAll(true);
    try {
      await markAllRead();
    } catch (err) {
      Alert.alert('Unable to update notifications', errorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView
          style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
          edges={['top', 'bottom']}
        >
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                {unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <Pressable onPress={() => void clearUnread()} disabled={markingAll}>
                  <Text style={[styles.markAllText, { color: theme.accent }]}>
                    {markingAll ? 'Saving…' : 'Mark all read'}
                  </Text>
                </Pressable>
              )}
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close notifications">
                <Ionicons name="close" size={25} color={theme.text} />
              </Pressable>
            </View>
          </View>

          {loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={theme.accent} />
              <Text style={[styles.stateText, { color: theme.muted }]}>Loading notifications…</Text>
            </View>
          ) : error ? (
            <View style={styles.state}>
              <Ionicons name="cloud-offline-outline" size={33} color={theme.muted} />
              <Text style={[styles.stateTitle, { color: theme.text }]}>Couldn’t load notifications</Text>
              <Text style={[styles.stateText, { color: theme.muted }]}>
                {errorMessage(error)}
              </Text>
              <Pressable onPress={() => void refresh()} style={[styles.retryButton, { borderColor: theme.border }]}>
                <Text style={[styles.retryText, { color: theme.accent }]}>Try again</Text>
              </Pressable>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.state}>
              <Ionicons name="notifications-outline" size={38} color={theme.accent} />
              <Text style={[styles.stateTitle, { color: theme.text }]}>No notifications yet</Text>
              <Text style={[styles.stateText, { color: theme.muted }]}>
                Match assignments and completed results will appear here.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {notifications.map(notification => {
                const unread = !notification.read_at;
                const icon = notification.type === 'match_result' ? 'trophy-outline' : 'calendar-outline';
                return (
                  <Pressable
                    key={notification.id}
                    onPress={() => void openNotification(notification)}
                    style={({ pressed }) => [
                      styles.notification,
                      {
                        backgroundColor: unread ? theme.tile : theme.surface,
                        borderColor: unread ? theme.accent : theme.border,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: theme.background }]}>
                      <Ionicons name={icon} size={21} color={theme.accent} />
                    </View>
                    <View style={styles.notificationCopy}>
                      <View style={styles.notificationTitleRow}>
                        <Text style={[styles.notificationTitle, { color: theme.text }]} numberOfLines={1}>
                          {notification.title}
                        </Text>
                        {unread && <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />}
                      </View>
                      <Text style={[styles.notificationBody, { color: theme.muted }]}>{notification.body}</Text>
                      <Text style={[styles.time, { color: theme.muted }]}>{timeLabel(notification.created_at)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  sheet: {
    height: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  header: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(166,184,177,0.28)',
  },
  headerTitleGroup: { gap: 3 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 17 },
  markAllText: { fontSize: 12, fontWeight: '700' },
  list: { paddingTop: 13, paddingBottom: 20, gap: 9 },
  notification: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 15,
    padding: 13,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notificationCopy: { flex: 1, gap: 4 },
  notificationTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  notificationTitle: { flex: 1, fontSize: 14, fontWeight: '800' },
  notificationBody: { fontSize: 12, lineHeight: 17 },
  time: { fontSize: 10, marginTop: 2 },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 22 },
  stateTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  stateText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  retryButton: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 18, paddingVertical: 10, marginTop: 4 },
  retryText: { fontSize: 13, fontWeight: '700' },
});
