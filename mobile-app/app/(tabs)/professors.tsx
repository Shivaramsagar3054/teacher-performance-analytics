import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { teachersApi, getImageUrl } from '../../services/api';
import { NotificationButton } from '../../components/NotificationButton';
import { APP_NAME, APP_SUBTITLE, APP_LOGO } from '../../constants/config';
import { BrandTitle } from '../../components/BrandTitle';

export default function TeachersScreen() {
  const router = useRouter();
  const [activeDept, setActiveDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [professors, setProfessors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>(['All']);

  useEffect(() => {
    const fetchProfessors = async () => {
      setLoading(true);
      try {
        const params = {
          department: activeDept === 'All' ? '' : activeDept,
          search: searchQuery,
        };
        const data = await teachersApi.getAll(params);
        const results = data.results || (Array.isArray(data) ? data : []);
        setProfessors(results);
        
        // Extract unique departments for chips
        if (activeDept === 'All' && !searchQuery) {
          const depts = new Set<string>();
          results.forEach((p: any) => p.department && depts.add(p.department));
          setDepartments(['All', ...Array.from(depts)]);
        }
      } catch (err) {
        console.error('Failed to fetch teachers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfessors();
  }, [activeDept, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Custom Header */}
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        


        {/* Search & Filter */}
        <View style={styles.searchFilterRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              placeholder="Search professors by name, department or subject..."
              style={styles.searchInput}
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="filter-outline" size={20} color="#0f172a" />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={styles.chipsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {departments.map((dept) => (
              <TouchableOpacity 
                key={dept} 
                style={[styles.chip, activeDept === dept && styles.chipActive]}
                onPress={() => setActiveDept(dept)}
              >
                <Text style={[styles.chipText, activeDept === dept && styles.chipTextActive]}>{dept}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.chipMore}>
              <Text style={styles.chipMoreText}>More</Text>
              <Ionicons name="chevron-down" size={14} color="#0f172a" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Professors List */}
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <View style={styles.listContainer}>
            {professors.length > 0 ? (
              professors.map((teacher) => (
                <TouchableOpacity 
                  key={teacher.id} 
                  style={styles.teacherCard}
                  onPress={() => router.push(`/professor/${teacher.id}`)}
                >
                  <Image source={{ uri: getImageUrl(teacher.profile_image) }} style={styles.avatar} />
                  
                  <View style={styles.teacherInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.teacherName}>{`Dr. ${teacher.first_name} ${teacher.last_name}`}</Text>
                    </View>
                    <Text style={styles.teacherDept}>{teacher.department}</Text>
                    {teacher.avg_pass_percentage > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 }}>
                        <Ionicons name="trending-up" size={10} color="#10b981" style={{ marginRight: 2 }} />
                        <Text style={{ fontSize: 10, color: '#10b981', fontWeight: 'bold' }}>{teacher.avg_pass_percentage}% Pass</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.actionsContainer}>
                    <View style={styles.mailBtn}>
                      <Ionicons name="mail-outline" size={18} color="#3b82f6" />
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: '#64748b' }}>No professors found.</Text>
              </View>
            )}
          </View>
        )}

        {/* Bottom Banner */}
        <View style={styles.bottomBanner}>
          <View style={styles.bottomBannerIconContainer}>
            <Ionicons name="people-outline" size={28} color="#3b82f6" />
          </View>
          <View style={styles.bottomBannerTextContainer}>
            <Text style={styles.bottomBannerTitle}>Dedicated Faculty, Better Future</Text>
            <Text style={styles.bottomBannerDesc}>
              Our faculty members are committed to academic excellence and the holistic development of every student.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 16,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  menuButton: {
    marginRight: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoImage: {
    width: 42,
    height: 42,
  },
  headerTextContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a1930',
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  headerSubTitle: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
    marginTop: -2,
    flexShrink: 1,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  heroIllustrationContainer: {
    width: 120,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIllustration: {
    width: '100%',
    height: '100%',
  },
  searchFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 6,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  chipsWrapper: {
    marginTop: 16,
    marginBottom: 20,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  chipActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#fff',
  },
  chipMore: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 4,
  },
  chipMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  teacherCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  teacherInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  hodBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hodText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  teacherDept: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 6,
    fontWeight: '500',
  },
  teacherSpec: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  specLabel: {
    fontWeight: '600',
    color: '#475569',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 8,
  },
  mailBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  bottomBanner: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  bottomBannerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomBannerTextContainer: {
    flex: 1,
  },
  bottomBannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  bottomBannerDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
});
