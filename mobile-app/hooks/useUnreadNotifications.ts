import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eventsApi } from '../services/api';

export const LAST_SEEN_KEY = 'last_seen_notifications_time';

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      const lastSeen = await AsyncStorage.getItem(LAST_SEEN_KEY);
      const clearedTimeStr = await AsyncStorage.getItem('cleared_notifications_timestamp');
      
      const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
      const clearedTime = clearedTimeStr ? new Date(clearedTimeStr).getTime() : 0;
      const thresholdTime = Math.max(lastSeenTime, clearedTime);

      const res = await eventsApi.getAll();
      const rawEvents = res.results || (Array.isArray(res) ? res : []);

      // Count events created or starting after thresholdTime
      const unseenEvents = rawEvents.filter((ev: any) => {
        const evTime = new Date(ev.created_at || ev.start_date || ev.date || Date.now()).getTime();
        return evTime > thresholdTime;
      });

      setUnreadCount(unseenEvents.length);
    } catch (err) {
      console.warn('Failed to calculate unread notifications count:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsSeen = useCallback(async () => {
    try {
      const nowIso = new Date().toISOString();
      await AsyncStorage.setItem(LAST_SEEN_KEY, nowIso);
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark notifications as seen:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return { unreadCount, markAsSeen, refreshUnread: fetchUnreadCount, loading };
}
