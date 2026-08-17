import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { coursesApi, completedCoursesApi } from '../../services/api';
import { NotificationButton } from '../../components/NotificationButton';
import { APP_NAME, APP_SUBTITLE, APP_LOGO } from '../../constants/config';
import { BrandTitle } from '../../components/BrandTitle';

export default function CoursesScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [allAvailableCourses, setAllAvailableCourses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);

  // 1. Initial Load: Fetch master courses list and completed course records ONLY ONCE on mount
  React.useEffect(() => {
    const loadCoursesData = async () => {
      setLoading(true);
      try {
        // Fetch completed courses list (handling pagination)
        let completedCourseIds = new Set<number>();
        let completedPage = 1;
        while (true) {
          const completedRes = await completedCoursesApi.getAll({ page: completedPage });
          const completedData = completedRes.results || (Array.isArray(completedRes) ? completedRes : []);
          if (completedData.length === 0) break;
          
          completedData.forEach((cc: any) => {
            if (cc.course) {
              const cId = typeof cc.course === 'object' ? cc.course.id : cc.course;
              if (cId) completedCourseIds.add(Number(cId));
            }
          });

          if (!completedRes.next) break;
          completedPage++;
        }

        // Fetch all master courses (unfiltered from backend)
        const data = await coursesApi.getAll();
        const results = data.results || (Array.isArray(data) ? data : []);

        // Filter out completed courses to show only available ones
        const available = results.filter((c: any) => !completedCourseIds.has(Number(c.id)));
        setAllAvailableCourses(available);

        // Update the department categories dynamically based on the master list
        const depts = new Set<string>();
        available.forEach((c: any) => c.department && depts.add(c.department));
        setCategories(['All', ...Array.from(depts)]);
      } catch (err) {
        console.error('Failed to load courses data', err);
      } finally {
        setLoading(false);
      }
    };
    loadCoursesData();
  }, []);

  // 2. Instant In-Memory Filter: Apply category chips and search keystrokes with 0ms delay!
  React.useEffect(() => {
    const filtered = allAvailableCourses.filter((course: any) => {
      // Category/Department Filter
      const matchesCategory = activeCategory === 'All' || 
        (course.department && course.department.toLowerCase() === activeCategory.toLowerCase());
        
      // Search Query Filter (matches Course Name or Course Code)
      const matchesSearch = !searchQuery.trim() || 
        (course.name && course.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
        (course.course_code && course.course_code.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      return matchesCategory && matchesSearch;
    });

    setCourses(filtered);
  }, [allAvailableCourses, activeCategory, searchQuery]);

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.responsiveWrapper, { width: isLargeScreen ? 768 : '100%' }]}>
          


          {/* Search Bar & Filter */}
          <View style={styles.searchFilterContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#94a3b8" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search courses by name or code..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterBtn}>
              <Ionicons name="filter-outline" size={20} color="#1e293b" />
              <Text style={styles.filterText}>Filter</Text>
            </TouchableOpacity>
          </View>

          {/* Categories */}
          <View style={styles.categoriesWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
              {categories.map((cat, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.categoryChip}>
                <Text style={styles.categoryText}>More</Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Courses List */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Available Courses</Text>
            {loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : (
              <View style={styles.departmentsList}>
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <TouchableOpacity 
                      key={course.id} 
                      style={styles.deptCard}
                      onPress={() => router.push(`/course/${course.id}`)}
                    >
                      <View style={[styles.deptIconContainer, { backgroundColor: '#eff6ff' }]}>
                        <Ionicons name="library-outline" size={28} color="#3b82f6" />
                      </View>
                      <View style={styles.deptContent}>
                        <Text style={styles.deptTitle}>{course.name}</Text>
                        <View style={styles.deptBadgeWrapper}>
                            <View style={[styles.deptBadge, { backgroundColor: '#f1f5f9' }]}>
                            <Text style={[styles.deptBadgeText, { color: '#64748b' }]}>{course.course_code}</Text>
                            </View>
                            <View style={[styles.deptBadge, { backgroundColor: '#ecfdf5', marginLeft: 8 }]}>
                            <Text style={[styles.deptBadgeText, { color: '#10b981' }]}>{course.credits} Credits</Text>
                            </View>
                        </View>
                        <Text style={styles.deptDesc}>{course.description || 'No description available.'}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" style={styles.deptChevron} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: '#64748b' }}>No courses found.</Text>
                  </View>
                )}
              </View>
            )}
          </View>



          <View style={{ height: 100 }} />
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
    alignItems: 'center',
  },
  responsiveWrapper: {
    maxWidth: '100%',
  },
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  heroTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '500',
  },
  heroImageWrapper: {
    width: 120,
    height: 100,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  categoriesWrapper: {
    marginBottom: 24,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 36,
  },
  categoryChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  categoryTextActive: {
    color: '#fff',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  departmentsList: {
    gap: 12,
  },
  deptCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'flex-start',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deptIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deptContent: {
    flex: 1,
  },
  deptTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  deptBadgeWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  deptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deptBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deptDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  deptChevron: {
    alignSelf: 'center',
    marginLeft: 8,
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  bannerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerContent: {
    flex: 1,
    marginRight: 12,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bannerBtnText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '700',
    marginRight: 2,
  },
});
