import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  TextInput,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { eventsApi, getImageUrl, authApi, commentsApi } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationButton } from '../../components/NotificationButton';
import { APP_NAME, APP_SUBTITLE, APP_LOGO } from '../../constants/config';
import { BrandTitle } from '../../components/BrandTitle';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Parse a date string safely as LOCAL time (avoids UTC off-by-one for date-only strings). */
const parseLocalDate = (str: string): Date | null => {
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

/** Format a date string to a readable form. */
const formatDisplayDate = (str: string): string => {
  if (!str) return '—';
  const d = parseLocalDate(str);
  if (!d) return str;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Component ──────────────────────────────────────────────────────────────

const TABS = ['Upcoming', 'Ongoing', 'Past'] as const;
type TabType = (typeof TABS)[number];

export default function EventsScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('Upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Live notification helper ──────────────────────────────────────────────
  const triggerLiveEventNotifications = async (allEvents: any[]) => {
    try {
      let profile: any = null;
      try { profile = await authApi.getProfile(); } catch { return; }
      if (!profile) return;

      const today = new Date();
      const ongoingTodayEvents = allEvents.filter((ev: any) => {
        const d = parseLocalDate(ev.start_date || ev.date);
        if (!d) return false;
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        );
      });

      for (const ev of ongoingTodayEvents) {
        const teacherId = typeof ev.organizer === 'object' ? ev.organizer?.id : ev.organizer;
        if (!teacherId) continue;
        const sentKey = `sent_live_msg_${ev.id}_${profile.id}`;
        const alreadySent = await AsyncStorage.getItem(sentKey);
        if (alreadySent === 'true') continue;
        const payload = {
          teacher: Number(teacherId),
          user: profile.id,
          content: `Your event "${ev.title}" is on live or ongoing!`,
          is_anonymous: false,
        };
        try {
          await commentsApi.create(payload);
          await AsyncStorage.setItem(sentKey, 'true');
        } catch (sendErr) {
          console.error(`Failed to send live notification for event ${ev.title}:`, sendErr);
        }
      }
    } catch (err) {
      console.error('Failed in live event notifications automation:', err);
    }
  };

  // ── Fetch events ──────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      let allEvents: any[] = [];
      let page = 1;

      while (true) {
        const params: Record<string, any> = { page };
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const res = await eventsApi.getAll(params);

        // Handle both paginated { results, next } and plain array responses
        const pageResults: any[] = res?.results ?? (Array.isArray(res) ? res : []);
        allEvents = allEvents.concat(pageResults);

        if (!res?.next || pageResults.length === 0) break;
        page++;
      }

      // Deduplicate by id
      const seenIds = new Set<number>();
      const unique = allEvents.filter((ev: any) => {
        if (!ev.id) return true;
        const n = Number(ev.id);
        if (seenIds.has(n)) return false;
        seenIds.add(n);
        return true;
      });

      setEvents(unique);
      triggerLiveEventNotifications(unique);
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      setError(err?.message || 'Failed to load events. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Tab filter ────────────────────────────────────────────────────────────
  const todayVal = new Date();
  todayVal.setHours(0, 0, 0, 0);

  const getEventStatus = (ev: any, todayVal: Date): TabType => {
    const startDate = parseLocalDate(ev.start_date || ev.date);
    const endDate = parseLocalDate(ev.end_date || ev.start_date || ev.date);

    if (!startDate) return 'Upcoming'; // Default fallback

    const todayTime = todayVal.getTime();
    const startDateTime = startDate.getTime();
    const endDateTime = endDate ? endDate.getTime() : startDateTime;

    if (endDateTime < todayTime) {
      return 'Past';
    } else if (startDateTime <= todayTime) {
      return 'Ongoing';
    } else {
      return 'Upcoming';
    }
  };

  const filteredEvents = events.filter((ev: any) => {
    return getEventStatus(ev, todayVal) === activeTab;
  });

  const getTabCount = (tab: TabType) => {
    const countTodayVal = new Date();
    countTodayVal.setHours(0, 0, 0, 0);
    return events.filter((ev: any) => getEventStatus(ev, countTodayVal) === tab).length;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={APP_LOGO}
            style={styles.logoImage}
            contentFit="contain"
          />
          <BrandTitle size="mini" showTagline={false} />
        </View>
        <NotificationButton />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchEvents(true)}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
      >
        <View style={[styles.responsiveWrapper, { width: isLargeScreen ? 768 : '100%' }]}>



          {/* Search Bar */}
          <View style={styles.searchFilterContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search events by name or keyword..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.filterBtn} onPress={() => fetchEvents()}>
              <Ionicons name="refresh-outline" size={20} color="#1e293b" />
              <Text style={styles.filterText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {TABS.map((tab) => {
              const count = getTabCount(tab);
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
                      <Text style={[styles.tabBadgeText, activeTab === tab && styles.tabBadgeTextActive]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.centerStateText}>Loading events...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <View style={styles.errorIcon}>
                <Ionicons name="cloud-offline-outline" size={40} color="#ef4444" />
              </View>
              <Text style={styles.errorTitle}>Could not load events</Text>
              <Text style={styles.errorMsg}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchEvents()}>
                <Ionicons name="refresh-outline" size={16} color="#fff" />
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : filteredEvents.length > 0 ? (
            <View style={styles.eventsList}>
              {filteredEvents.map((event, index) => {
                const rawDate = event.start_date || event.date;
                const dateObj = parseLocalDate(rawDate);
                const isValidDate = dateObj && !isNaN(dateObj.getTime());
                const month = isValidDate
                  ? dateObj!.toLocaleString('default', { month: 'short' }).toUpperCase()
                  : '—';
                const day = isValidDate ? dateObj!.getDate().toString().padStart(2, '0') : '—';
                const displayDate = rawDate ? formatDisplayDate(rawDate) : '—';
                const eventImage =
                  event.image_path
                    ? getImageUrl(event.image_path)
                    : event.image
                    ? getImageUrl(event.image)
                    : null;

                // Determine if event is today
                const isToday = isValidDate &&
                  dateObj!.getFullYear() === todayVal.getFullYear() &&
                  dateObj!.getMonth() === todayVal.getMonth() &&
                  dateObj!.getDate() === todayVal.getDate();

                return (
                  <TouchableOpacity
                    key={`event-${event.id ?? index}`}
                    style={[styles.eventCard, isToday && styles.eventCardToday]}
                    onPress={() => router.push(`/event-details/${event.id}` as any)}
                    activeOpacity={0.85}
                  >
                    {/* Date sidebar */}
                    <View style={[styles.dateSidebar, isToday && styles.dateSidebarToday]}>
                      <Text style={[styles.dateMonth, isToday && styles.dateMonthToday]}>{month}</Text>
                      <Text style={[styles.dateDay, isToday && styles.dateDayToday]}>{day}</Text>
                      {isToday && (
                        <View style={styles.liveIndicator}>
                          <View style={styles.liveDot} />
                          <Text style={styles.liveText}>Today</Text>
                        </View>
                      )}
                    </View>

                    {/* Event image */}
                    {eventImage ? (
                      <Image source={{ uri: eventImage }} style={styles.eventImage} contentFit="cover" />
                    ) : (
                      <View style={[styles.eventImage, styles.eventImagePlaceholder]}>
                        <Ionicons name="calendar-outline" size={22} color="#3b82f6" />
                      </View>
                    )}

                    {/* Event info */}
                    <View style={styles.eventContent}>
                      <View style={styles.eventHeader}>
                        <Text style={styles.eventTitle} numberOfLines={2}>{event.title || 'Untitled Event'}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                      </View>

                      <View style={styles.eventMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="calendar-outline" size={11} color="#64748b" />
                          <Text style={styles.metaText}>{displayDate}</Text>
                        </View>
                        {(event.time || (rawDate && rawDate.includes('T'))) && (
                          <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={11} color="#64748b" />
                            <Text style={styles.metaText}>
                              {event.time
                                ? event.time
                                : new Date(rawDate).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={11} color="#64748b" />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {event.location || event.venue || 'Venue TBD'}
                        </Text>
                      </View>

                      <View style={styles.cardBadge}>
                        <Text style={styles.cardBadgeText}>{event.event_type || 'Event'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.centerState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={40} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'Ongoing'
                  ? 'No ongoing events'
                  : activeTab === 'Upcoming'
                  ? 'No upcoming events'
                  : 'No past events'}
              </Text>
              <Text style={styles.emptyMsg}>
                {activeTab === 'Ongoing'
                  ? 'There are no events running currently.'
                  : activeTab === 'Upcoming'
                  ? 'Check back later for upcoming events.'
                  : 'There are no past events listed.'}
              </Text>
              {activeTab !== 'Upcoming' && (
                <TouchableOpacity style={styles.switchTabBtn} onPress={() => setActiveTab('Upcoming')}>
                  <Text style={styles.switchTabBtnText}>View Upcoming Events</Text>
                </TouchableOpacity>
              )}
            </View>
          )}



          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  logoImage: { width: 42, height: 42 },
  headerTextContainer: { justifyContent: 'center', flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0a1930', letterSpacing: -0.5, flexShrink: 1 },
  headerSubTitle: { fontSize: 9, color: '#64748b', fontWeight: '600', marginTop: -2, flexShrink: 1 },
  notificationBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  badge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: '#ef4444', width: 18, height: 18,
    borderRadius: 9, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  scrollContent: { paddingBottom: 20, alignItems: 'center' },
  responsiveWrapper: { maxWidth: '100%' },

  heroSection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16,
  },
  heroTextContainer: { flex: 1, paddingRight: 16 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 6, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 14, color: '#475569', lineHeight: 20, fontWeight: '500' },
  eventCountPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 10, alignSelf: 'flex-start',
    backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#bfdbfe',
  },
  eventCountText: { fontSize: 11, color: '#3b82f6', fontWeight: '700' },
  heroImageWrapper: { width: 110, height: 90, justifyContent: 'center', alignItems: 'flex-end' },
  heroImage: { width: '100%', height: '100%', opacity: 0.9 },

  searchFilterContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 48,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#0f172a' },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  filterText: { fontSize: 13, fontWeight: '600', color: '#1e293b' },

  tabsContainer: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14,
    marginHorizontal: 16, marginBottom: 20, padding: 4,
  },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: 10, flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  tabActive: { backgroundColor: '#0f172a' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  tabTextActive: { color: '#fff' },
  tabBadge: {
    backgroundColor: '#e2e8f0', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
    minWidth: 20, alignItems: 'center',
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  tabBadgeTextActive: { color: '#fff' },

  eventsList: { paddingHorizontal: 16, gap: 14, marginBottom: 24 },

  eventCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    overflow: 'hidden',
  },
  eventCardToday: { borderColor: '#bfdbfe', borderWidth: 1.5 },

  dateSidebar: {
    width: 52, backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: 12, paddingBottom: 8,
    borderRightWidth: 1, borderRightColor: '#f1f5f9',
  },
  dateSidebarToday: { backgroundColor: '#eff6ff', borderRightColor: '#bfdbfe' },
  dateMonth: { fontSize: 9, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateMonthToday: { color: '#3b82f6' },
  dateDay: { fontSize: 22, fontWeight: '900', color: '#94a3b8', marginTop: -2 },
  dateDayToday: { color: '#3b82f6' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#22c55e' },
  liveText: { fontSize: 7, fontWeight: '800', color: '#22c55e', textTransform: 'uppercase' },

  eventImage: { width: 80, height: 'auto', minHeight: 80 },
  eventImagePlaceholder: { backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', width: 80, minHeight: 80 },

  eventContent: { flex: 1, padding: 12 },
  eventHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 6,
  },
  eventTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a', flex: 1, paddingRight: 6, lineHeight: 18 },

  eventMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10, color: '#64748b', fontWeight: '500' },

  cardBadge: {
    alignSelf: 'flex-start', backgroundColor: '#eff6ff',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6,
  },
  cardBadgeText: { fontSize: 10, fontWeight: '700', color: '#3b82f6' },

  // States
  centerState: { padding: 40, alignItems: 'center', gap: 10 },
  centerStateText: { fontSize: 14, color: '#64748b', fontWeight: '500' },

  errorIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  errorMsg: { fontSize: 13, color: '#ef4444', textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, marginTop: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  emptyMsg: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  switchTabBtn: {
    backgroundColor: '#0f172a', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, marginTop: 8,
  },
  switchTabBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  bannerContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc',
    marginHorizontal: 16, padding: 16, borderRadius: 20,
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20,
  },
  bannerIconContainer: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  bannerContent: { flex: 1, marginRight: 10 },
  bannerTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 3 },
  bannerDesc: { fontSize: 11, color: '#64748b', lineHeight: 16 },
  bannerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: '#0f172a', borderRadius: 12,
  },
  bannerBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
});
