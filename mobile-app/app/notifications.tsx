import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eventsApi, getImageUrl, authApi } from '../services/api';
import { LAST_SEEN_KEY } from '../hooks/useUnreadNotifications';

/** Parse date string into Date object */
const parseEventDate = (str: string): Date | null => {
  if (!str) return null;
  try {
    const datePart = str.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

/** Format date for display */
const formatDate = (str: string): string => {
  if (!str) return 'Date TBD';
  const d = parseEventDate(str);
  if (!d) return str;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function NotificationsScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'new'>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState<string>('student');

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      try {
        const profile = await authApi.getProfile();
        if (profile?.role) setUserRole(profile.role);
      } catch (pErr) {
        console.warn('Failed to load user profile in notifications:', pErr);
      }

      const res = await eventsApi.getAll();
      const rawEvents = res.results || (Array.isArray(res) ? res : []);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Map events to notification items
      const notifs = rawEvents.map((ev: any, index: number) => {
        const evDate = parseEventDate(ev.start_date || ev.date || ev.created_at);
        const isToday =
          evDate &&
          evDate.getFullYear() === today.getFullYear() &&
          evDate.getMonth() === today.getMonth() &&
          evDate.getDate() === today.getDate();

        const isFuture = evDate && evDate >= today;
        const isLive = isToday || ev.is_ongoing || ev.status === 'ongoing';
        const isNew = !isLive && isFuture;

        return {
          id: ev.id || index,
          eventId: ev.id,
          title: ev.title || 'New College Event',
          description: ev.description || 'Check out details for this event on campus.',
          date: ev.start_date || ev.date,
          location: ev.location || 'SIMATS Campus',
          time: ev.time || '10:00 AM',
          organizer: ev.organizer_name || (typeof ev.organizer === 'object' ? ev.organizer?.first_name : 'SIMATS Events'),
          image: (() => {
            if (ev.image_path) return getImageUrl(ev.image_path);
            if (ev.banner) return getImageUrl(ev.banner);
            if (ev.image && typeof ev.image === 'string' && !ev.image.includes('profile') && !ev.image.includes('avatar') && !ev.image.includes('teacher') && !ev.image.includes('user')) {
              return getImageUrl(ev.image);
            }
            return 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=300';
          })(),
          type: isLive ? 'live' : isNew ? 'new' : 'past',
          badgeText: isLive ? '🔴 RUNNING NOW' : isNew ? '✨ NEWLY POSTED' : 'UPCOMING',
          badgeBg: isLive ? '#fef2f2' : isNew ? '#eff6ff' : '#f8fafc',
          badgeColor: isLive ? '#ef4444' : isNew ? '#3b82f6' : '#64748b',
          timestamp: ev.created_at || ev.start_date || new Date().toISOString(),
          read: false,
        };
      });

      // Sort live events first, then newly posted
      notifs.sort((a: any, b: any) => {
        if (a.type === 'live' && b.type !== 'live') return -1;
        if (a.type !== 'live' && b.type === 'live') return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      const clearedTimestampStr = await AsyncStorage.getItem('cleared_notifications_timestamp');
      const clearedTime = clearedTimestampStr ? new Date(clearedTimestampStr).getTime() : 0;

      const activeNotifs = notifs.filter((n: any) => {
        const evTime = new Date(n.timestamp).getTime();
        return evTime > clearedTime;
      });

      setNotifications(activeNotifs);
      setUnreadCount(activeNotifs.filter((n: any) => n.type === 'live' || n.type === 'new').length);
      await AsyncStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    const nowIso = new Date().toISOString();
    setNotifications([]);
    setUnreadCount(0);
    await AsyncStorage.setItem(LAST_SEEN_KEY, nowIso);
    await AsyncStorage.setItem('cleared_notifications_timestamp', nowIso);
  };

  const filteredNotifs = notifications.filter((n) => {
    if (activeFilter === 'live') return n.type === 'live';
    if (activeFilter === 'new') return n.type === 'new';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
            <Text style={styles.markReadText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.activeFilterChip]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'all' && styles.activeFilterChipText]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'live' && styles.activeFilterChip]}
          onPress={() => setActiveFilter('live')}
        >
          <View style={styles.liveDot} />
          <Text style={[styles.filterChipText, activeFilter === 'live' && styles.activeFilterChipText]}>
            Live Events ({notifications.filter((n) => n.type === 'live').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'new' && styles.activeFilterChip]}
          onPress={() => setActiveFilter('new')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'new' && styles.activeFilterChipText]}>
            Newly Posted ({notifications.filter((n) => n.type === 'new').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
      >
        <View style={[styles.responsiveWrapper, { width: isLargeScreen ? 768 : '100%' }]}>
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Fetching recent notifications...</Text>
            </View>
          ) : filteredNotifs.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="notifications-off-outline" size={64} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>You're all caught up! New events and running activities will appear here.</Text>
            </View>
          ) : (
            filteredNotifs.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.notifCard, item.type === 'live' && styles.liveNotifCard]}
                onPress={() => {
                  if (item.eventId) {
                    if (userRole === 'teacher') {
                      router.push(`/(teacher)/event/${item.eventId}`);
                    } else {
                      router.push(`/event-details/${item.eventId}`);
                    }
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.typeBadge, { backgroundColor: item.badgeBg }]}>
                    <Text style={[styles.typeBadgeText, { color: item.badgeColor }]}>{item.badgeText}</Text>
                  </View>
                  <Text style={styles.timeAgo}>{formatDate(item.date)}</Text>
                </View>

                <View style={styles.cardContent}>
                  <Image source={{ uri: item.image }} style={styles.eventImage} />
                  <View style={styles.textContent}>
                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.eventDesc} numberOfLines={2}>
                      {item.description}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color="#64748b" />
                        <Text style={styles.metaText}>{item.time}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color="#64748b" />
                        <Text style={styles.metaText}>{item.location}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {item.type === 'live' && (
                  <View style={styles.liveBanner}>
                    <Ionicons name="play-circle" size={16} color="#ef4444" />
                    <Text style={styles.liveBannerText}>This event is happening now! Tap to join or view details.</Text>
                    <Ionicons name="chevron-forward" size={16} color="#ef4444" />
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  markReadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3b82f6',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    gap: 6,
  },
  activeFilterChip: {
    backgroundColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  responsiveWrapper: {
    maxWidth: '100%',
  },
  centerBox: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  notifCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  liveNotifCard: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffdfd',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  timeAgo: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  cardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  eventImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
  },
  textContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#fecaca',
    gap: 6,
  },
  liveBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
});
