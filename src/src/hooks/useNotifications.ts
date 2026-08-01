import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types/database';

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresca periódicamente para simular novedades casi en tiempo real
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [userId, refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  };

  return { notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead };
}
