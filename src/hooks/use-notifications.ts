import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

export type ClubNotification = {
  id: string;
  user_id: string;
  type: 'match_assigned' | 'match_result' | string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
};

export const notificationsQueryKey = (userId: string | null) =>
  ['riverside', 'notifications', userId] as const;

export function useNotifications(userId: string | null, enabled = true, subscribe = true) {
  const queryClient = useQueryClient();
  const queryKey = notificationsQueryKey(userId);

  const query = useQuery({
    queryKey,
    enabled: Boolean(userId) && enabled,
    staleTime: 30_000,
    queryFn: async () => {
      if (!userId) return [] as ClubNotification[];
      const { data, error } = await supabase
        .from('notifications')
        .select('id,user_id,type,title,body,data,created_at,read_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ClubNotification[];
    },
  });

  useEffect(() => {
    if (!userId || !enabled || !subscribe) return;
    const channel = supabase
      .channel(`riverside-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: notificationsQueryKey(userId), exact: true });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient, subscribe, userId]);

  const markRead = useCallback(async (notificationId: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: notificationsQueryKey(userId), exact: true });
  }, [queryClient, userId]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: notificationsQueryKey(userId), exact: true });
  }, [queryClient, userId]);

  const notifications = query.data ?? [];
  return {
    notifications,
    unreadCount: notifications.reduce((count, item) => count + (item.read_at ? 0 : 1), 0),
    loading: query.isPending,
    error: query.error,
    markRead,
    markAllRead,
    refresh: query.refetch,
  };
}
