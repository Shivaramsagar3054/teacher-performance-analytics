import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { eventsApi, getImageUrl } from '../../../services/api';

export default function EventDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const data = await eventsApi.getById(id!);
        setEvent(data);
      } catch (err) {
        console.error('Failed to load event:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadEvent();
  }, [id]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const parseTimeString = (raw: string): string => {
    if (!raw) return '—';
    let clean = raw.trim();
    if (clean.includes('T')) {
      clean = clean.split('T')[1].split('.')[0].replace('Z', '');
    }
    const isPM = clean.toUpperCase().includes('PM');
    const isAM = clean.toUpperCase().includes('AM');
    const numOnly = clean.replace(/[^\d:]/g, '');
    const parts = numOnly.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (!isNaN(hours) && !isNaN(minutes)) {
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const mm = minutes.toString().padStart(2, '0');
        const hh = displayHours.toString().padStart(2, '0');
        return `${hh}:${mm} ${period}`;
      }
    }
    return raw;
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '—';
    if (!dateStr.includes('T') && !dateStr.includes(':')) return '—';
    return parseTimeString(dateStr);
  };

  const getQrUrl = (text: string) => {
    const encoded = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}&color=0a1930&bgcolor=ffffff&margin=10`;
  };

  const handleRegister = async () => {
    const url = event?.registration_link;
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) Linking.openURL(url);
      else if (Platform.OS === 'web') window.open(url, '_blank');
    } catch (e) {
      console.warn('Cannot open URL:', e);
    }
  };

  const getTypeBadgeColor = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('seminar')) return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
    if (t.includes('workshop')) return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
    if (t.includes('lecture')) return { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' };
    if (t.includes('symposium')) return { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' };
    return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#94a3b8" />
          <Text style={styles.notFoundText}>Event not found.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const badge = getTypeBadgeColor(event.event_type);
  const regLink = event.registration_link;
  const eventImage = event.image_path ? getImageUrl(event.image_path) : null;
  const contentWidth = isLargeScreen ? Math.min(width - 290, 720) : width;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Event Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { alignItems: 'center' }]}
      >
        <View style={{ width: contentWidth, gap: 20, paddingBottom: 60 }}>

          {/* Banner Image */}
          {eventImage ? (
            <Image
              source={{ uri: eventImage }}
              style={styles.bannerImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.bannerImage, styles.bannerPlaceholder]}>
              <Ionicons name="image-outline" size={48} color="#cbd5e1" />
              <Text style={styles.bannerPlaceholderText}>No Banner Image</Text>
            </View>
          )}

          {/* Title Card */}
          <View style={styles.card}>
            <View style={styles.titleRow}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={[styles.typeBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                <Text style={[styles.typeBadgeText, { color: badge.text }]}>{event.event_type || 'Event'}</Text>
              </View>
            </View>
            {event.description ? (
              <Text style={styles.description}>{event.description}</Text>
            ) : null}
          </View>

          {/* Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Event Details</Text>
            <View style={styles.detailsList}>
              <DetailRow icon="calendar-outline" label="Date" value={formatDate(event.start_date)} />
              <DetailRow icon="time-outline" label="Start Time" value={formatTime(event.start_date)} />
              <DetailRow icon="time-outline" label="End Time" value={formatTime(event.end_date)} />
              <DetailRow icon="location-outline" label="Venue" value={event.location || '—'} />
              {event.registration_link && (
                <DetailRow icon="link-outline" label="Registration" value={event.registration_link} isLink />
              )}
            </View>
          </View>

          {/* Register Now Button */}
          {regLink ? (
            <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} activeOpacity={0.85}>
              <Ionicons name="open-outline" size={20} color="#ffffff" />
              <Text style={styles.registerBtnText}>Register Now</Text>
              <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          ) : null}

          {/* QR Code Card */}
          {regLink ? (
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>QR Code — Scan to Register</Text>
              <Text style={styles.qrSubtext}>Share this QR code with students to let them register instantly.</Text>
              <View style={styles.qrContainer}>
                <Image
                  source={{ uri: getQrUrl(regLink) }}
                  style={styles.qrImage}
                  contentFit="contain"
                />
                <View style={styles.qrLinkRow}>
                  <Ionicons name="link-outline" size={13} color="#64748b" />
                  <Text style={styles.qrLinkText} numberOfLines={1}>{regLink}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.noQrBox}>
                <Ionicons name="qr-code-outline" size={36} color="#cbd5e1" />
                <Text style={styles.noQrText}>No registration link added.</Text>
                <Text style={styles.noQrSubtext}>Add a registration URL to generate a QR code.</Text>
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, isLink }: { icon: any; label: string; value: string; isLink?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconBox}>
        <Ionicons name={icon} size={16} color="#3b82f6" />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, isLink && styles.detailValueLink]} numberOfLines={isLink ? 1 : 3}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 14, color: '#64748b', fontWeight: '600', marginTop: 8 },
  notFoundText: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  backBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a', flex: 1, textAlign: 'center' },

  scroll: { padding: 20 },

  bannerImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bannerPlaceholder: {
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  bannerPlaceholderText: { fontSize: 13, color: '#94a3b8' },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  eventTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', flex: 1 },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  description: { fontSize: 14, color: '#475569', lineHeight: 22 },

  cardSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },

  detailsList: { gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  detailContent: { flex: 1, gap: 2 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, color: '#1e293b', fontWeight: '500' },
  detailValueLink: { color: '#3b82f6', textDecorationLine: 'underline' },

  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  registerBtnText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },

  qrSubtext: { fontSize: 13, color: '#64748b', lineHeight: 19 },
  qrContainer: { alignItems: 'center', gap: 14 },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  qrLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxWidth: '100%',
  },
  qrLinkText: { fontSize: 12, color: '#64748b', flex: 1 },

  noQrBox: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  noQrText: { fontSize: 15, fontWeight: '600', color: '#94a3b8' },
  noQrSubtext: { fontSize: 13, color: '#cbd5e1', textAlign: 'center' },
});
