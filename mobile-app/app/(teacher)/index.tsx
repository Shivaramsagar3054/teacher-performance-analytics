import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  useWindowDimensions, 
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useNavigation } from 'expo-router';
import { authApi, teachersApi, courseTeachersApi, completedCoursesApi, ratingsApi, getImageUrl } from '../../services/api';
import { NotificationButton } from '../../components/NotificationButton';
import { APP_NAME, APP_LOGO } from '../../constants/config';
import { BrandTitle } from '../../components/BrandTitle';

export default function TeacherDashboard() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const contentWidth = isLargeScreen ? width - 290 : width;
  const router = useRouter();

  // Data States
  const [teacher, setTeacher] = useState<any>(null);
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingPercentages, setRatingPercentages] = useState({ excellent: 54, good: 32, below35: 14 });
  const [selectedCourseIndex, setSelectedCourseIndex] = useState<number>(0);

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    averagePassPercentage: 0,
    coursesCompleted: 0
  });

  // Profile update prompt modal state
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      // 1. Fetch user profile
      const profile = await authApi.getProfile();
      
      // 2. Load teacher profile from cache or traversely across paginated results
      let matchedTeacher = null;
      try {
        const cached = await AsyncStorage.getItem('teacherProfile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.user?.id === profile.id) {
            matchedTeacher = parsed;
          }
        }
      } catch (cErr) {
        console.warn('Failed to read cached profile:', cErr);
      }

      if (!matchedTeacher) {
        matchedTeacher = profile.teacher_profile || null;
        if (!matchedTeacher) {
          const res = await teachersApi.getAll({ user_id: profile.id });
          const results = res.results || (Array.isArray(res) ? res : []);
          matchedTeacher = results.find((t: any) => t.user?.id === profile.id) || results[0] || null;
        }
      }

      if (matchedTeacher) {
        await AsyncStorage.setItem('teacher_id', String(matchedTeacher.id));
        await AsyncStorage.setItem('teacherProfile', JSON.stringify(matchedTeacher));
      }

      if (matchedTeacher) {
        setTeacher(matchedTeacher);
        
        // Check if profile is empty (first name, phone number, or location is empty)
        const isEmptyProfile = 
          !matchedTeacher.first_name?.trim() || 
          !matchedTeacher.phone_number?.trim() || 
          !matchedTeacher.location?.trim();
        if (isEmptyProfile) {
          setIsProfileModalVisible(true);
        }
      } else {
        // If there is no profile record at all, definitely prompt to update
        setIsProfileModalVisible(true);
      }
        
      if (matchedTeacher) {
        // 3. Fetch completed courses directly from API to avoid cached stale results
        let completed = [];
        try {
          const res = await completedCoursesApi.getAll({ teacher_id: matchedTeacher.id });
          completed = res.results || (Array.isArray(res) ? res : []);
        } catch (err) {
          console.warn('Error completed courses API:', err);
        }
        setCompletedCourses(completed);

        // 4. Fetch ongoing courses
        let ongoing = [];
        try {
          const res = await courseTeachersApi.getAll({ teacher_id: matchedTeacher.id, is_current: 'true' });
          ongoing = res.results || (Array.isArray(res) ? res : []);
        } catch (err) {
          console.warn('Error ongoing courses API:', err);
        }

        // Compute true pass rate distribution and average from completed courses
        let excellentCount = 0;
        let goodCount = 0;
        let below75Count = 0;

        if (completed.length > 0) {
          completed.forEach((c: any) => {
            const passVal = parseFloat(c.pass_percentage || 0);
            if (passVal >= 90) {
              excellentCount++;
            } else if (passVal >= 75) {
              goodCount++;
            } else {
              below75Count++;
            }
          });

          const totalCompletedCount = completed.length;
          setRatingPercentages({
            excellent: Math.round((excellentCount / totalCompletedCount) * 100),
            good: Math.round((goodCount / totalCompletedCount) * 100),
            below35: Math.round((below75Count / totalCompletedCount) * 100),
          });
        } else {
          // Set 0% if no completed courses
          setRatingPercentages({ excellent: 0, good: 0, below35: 0 });
        }

        // Calculate stats
        const totalStuds = completed.reduce((sum: number, c: any) => sum + (c.total_students || 0), 0);
        const totalPassPercent = completed.reduce((sum: number, c: any) => sum + parseFloat(c.pass_percentage || 0), 0);
        const avgPassPercent = completed.length > 0 ? Math.round(totalPassPercent / completed.length) : 0;
        
        setStats({
          totalStudents: totalStuds,
          activeCourses: ongoing.length,
          averagePassPercentage: avgPassPercent,
          coursesCompleted: completed.length
        });
      } else {
        // No teacher profile at all
        setStats({
          totalStudents: 0,
          activeCourses: 0,
          averagePassPercentage: 0,
          coursesCompleted: 0
        });
        setRatingPercentages({ excellent: 0, good: 0, below35: 0 });
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard details:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  // Refresh data when screen gains focus (e.g. returning from settings)
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData(false);
    });
    return unsubscribe;
  }, [navigation]);

  const handleGoToSettings = async () => {
    setIsProfileModalVisible(false);
    try {
      await AsyncStorage.setItem('autoOpenEditProfile', 'true');
    } catch (err) {
      console.warn('Failed to set autoOpenEditProfile:', err);
    }
    router.replace('/(teacher)/settings');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Analytics...</Text>
      </View>
    );
  }

  // Bar Chart Data Processing
  // Fallback data if API yields empty array
  const defaultChartData = [
    { code: 'CS101', label: 'CS101', fullName: 'Triple-buffered asymmetric algorithm', value: 78 },
    { code: 'CS204', label: 'CS204', fullName: 'Ameliorated multi-tasking core', value: 85 },
    { code: 'CS302', label: 'CS302', fullName: 'Progressive uniform methodology', value: 90 },
    { code: 'EE104', label: 'EE104', fullName: 'Profit-focused context-sensitive alliance', value: 68 },
    { code: 'CS401', label: 'CS401', fullName: 'Computer Science Fundamental I', value: 96 },
    { code: 'CS402', label: 'CS402', fullName: 'Computer Science Fundamental II', value: 88 },
  ];

  const chartData = completedCourses.length > 0 
    ? completedCourses.map(cc => {
        const fullName = cc.course_full_name || cc.course_details?.course_name || 'Course';
        const code = cc.course_details?.course_code || cc.course_code || cc.slot || fullName.substring(0, 6).toUpperCase();
        return {
          code,
          label: code,
          fullName,
          value: cc.pass_percentage ? Math.round(parseFloat(cc.pass_percentage)) : 75
        };
      })
    : [];

  const selectedCourse = chartData.length > 0 ? (chartData[selectedCourseIndex] || chartData[0]) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Top Header Row matching screenshot */}
      <View style={styles.header}>
        <View style={styles.panelTitleContainer}>
          <Image 
            source={APP_LOGO} 
            style={styles.logoImage} 
            contentFit="contain"
          />
          <BrandTitle size="mini" showTagline={false} />
        </View>
        <View style={styles.headerRight}>
          <NotificationButton iconColor="#64748b" iconSize={22} />
          {!teacher ? (
            <TouchableOpacity 
              style={styles.userSection}
              onPress={async () => {
                try {
                  await AsyncStorage.setItem('autoOpenEditProfile', 'true');
                } catch (err) {}
                router.replace('/(teacher)/settings');
              }}
            >
              <Ionicons name="person-circle" size={32} color="#3b82f6" style={{ marginRight: 6 }} />
              {isLargeScreen && (
                <View>
                  <Text style={styles.userFullName}>Set Up Profile</Text>
                  <Text style={styles.userRoleText}>TEACHER</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.userSection}
              onPress={() => router.push('/(teacher)/profile')}
            >
              <Image 
                source={{ uri: getImageUrl(teacher.profile_image) }} 
                style={styles.headerAvatar} 
              />
              {isLargeScreen && (
                <View>
                  <Text style={styles.userFullName}>{`Dr. ${teacher.first_name} ${teacher.last_name}`}</Text>
                  <Text style={styles.userRoleText}>{teacher.department ? String(teacher.department).toUpperCase() : 'TEACHER'}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.mainWrapper, { width: contentWidth }]}>
          
          {/* Performance Analytics Title */}
          <View style={styles.titleSection}>
            <Text style={styles.dashboardTitle}>Performance Analytics</Text>
            <Text style={styles.dashboardSubtitle}>Real-time overview of your teaching metrics</Text>
          </View>



          {/* Stats Cards Section */}
          <View style={styles.statsGrid}>
            
            {/* CARD 1: Total Students */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statCardLabel}>TOTAL STUDENTS</Text>
                <View style={[styles.statIconContainer, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="people" size={20} color="#3b82f6" />
                </View>
              </View>
              <Text style={styles.statCardValue}>{stats.totalStudents}</Text>
            </View>

            {/* CARD 2: Active Courses */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statCardLabel}>ACTIVE COURSES</Text>
                <View style={[styles.statIconContainer, { backgroundColor: '#fffbeb' }]}>
                  <Ionicons name="book" size={20} color="#f59e0b" />
                </View>
              </View>
              <Text style={styles.statCardValue}>{stats.activeCourses}</Text>
            </View>

            {/* CARD 3: Avg Pass Percentage */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statCardLabel}>AVG PASS PERCENTAGE</Text>
                <View style={[styles.statIconContainer, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="school-outline" size={20} color="#10b981" />
                </View>
              </View>
              <Text style={styles.statCardValue}>{stats.averagePassPercentage}%</Text>
            </View>

            {/* CARD 4: Courses Completed */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statCardLabel}>COURSES COMPLETED</Text>
                <View style={[styles.statIconContainer, { backgroundColor: '#ffe4e6' }]}>
                  <Ionicons name="ribbon-outline" size={20} color="#f43f5e" />
                </View>
              </View>
              <Text style={[styles.statCardValue, { color: '#f43f5e' }]}>{stats.coursesCompleted}</Text>
            </View>

          </View>

          {/* Charts Row */}
          <View style={[styles.chartsRow, isLargeScreen ? styles.rowLayout : styles.columnLayout]}>
            
            {/* Chart 1: Course Pass Percentages */}
            <View style={[styles.chartContainer, isLargeScreen ? { flex: 1.4 } : null]}>
              <Text style={styles.chartTitle}>Course Pass Percentages</Text>
              
              {chartData.length > 0 ? (
                <>
                  {/* Bar Chart Graphics */}
                  <View style={styles.barChartWrapper}>
                    <View style={styles.yAxis}>
                      <Text style={styles.yAxisLabel}>100</Text>
                      <Text style={styles.yAxisLabel}>75</Text>
                      <Text style={styles.yAxisLabel}>50</Text>
                      <Text style={styles.yAxisLabel}>25</Text>
                      <Text style={styles.yAxisLabel}>0</Text>
                    </View>
                    
                    <View style={styles.barsContainer}>
                      {/* Grid Lines */}
                      <View style={styles.gridLinesContainer} pointerEvents="none">
                        <View style={styles.gridLine} />
                        <View style={styles.gridLine} />
                        <View style={styles.gridLine} />
                        <View style={styles.gridLine} />
                        <View style={styles.gridLine} />
                      </View>

                      {/* The Actual Bars with dynamic scroll view */}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ width: '100%', height: '100%' }}
                        contentContainerStyle={{
                          flexGrow: 1,
                          flexDirection: 'row',
                          justifyContent: chartData.length > 6 ? 'flex-start' : 'space-between',
                          alignItems: 'flex-end',
                          zIndex: 2,
                          paddingBottom: 40,
                          gap: chartData.length > 6 ? 16 : 0,
                          minWidth: chartData.length > 6 ? chartData.length * 60 : '100%',
                        }}
                      >
                        {chartData.map((data, index) => {
                          const isSelected = selectedCourseIndex === index;
                          return (
                            <TouchableOpacity 
                              key={index} 
                              style={[
                                styles.barItemColumn,
                                chartData.length > 6 && { width: 50, flex: 0 }
                              ]}
                              activeOpacity={0.7}
                              onPress={() => setSelectedCourseIndex(index)}
                            >
                              <View style={styles.barTrack}>
                                <View 
                                  style={[
                                    styles.barFill, 
                                    { height: `${data.value}%` },
                                    isSelected && styles.barFillSelected
                                  ]} 
                                />
                              </View>
                              <Text 
                                style={[
                                  styles.barLabel,
                                  isSelected && styles.barLabelSelected
                                ]} 
                                numberOfLines={1}
                              >
                                {data.code}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>

                  {/* Selected Course Details Card */}
                  {selectedCourse && (
                    <View style={styles.selectedCourseCard}>
                      <View style={styles.selectedCourseHeader}>
                        <Ionicons name="information-circle" size={16} color="#3b82f6" />
                        <Text style={styles.selectedCourseBadge}>{selectedCourse.code}</Text>
                        <Text style={styles.selectedCoursePassRate}>
                          Pass Rate: <Text style={{ fontWeight: 'bold', color: '#10b981' }}>{selectedCourse.value}%</Text>
                        </Text>
                      </View>
                      <Text style={styles.selectedCourseFullName} numberOfLines={2}>
                        {selectedCourse.fullName}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyChartContainer}>
                  <Ionicons name="bar-chart-outline" size={60} color="#94a3b8" />
                  <Text style={styles.emptyChartTitle}>No Course Data Available</Text>
                  <Text style={styles.emptyChartSub}>Once you have completed courses, your class pass percentage analytics will be displayed here.</Text>
                </View>
              )}
            </View>

            {/* Chart 2: Pass Rate Distribution */}
            <View style={[styles.chartContainer, isLargeScreen ? { flex: 1 } : null]}>
              <Text style={styles.chartTitle}>Pass Rate Distribution</Text>
              
              <View style={styles.donutWrapper}>
                {/* Radial Donut Visualization */}
                <View style={styles.radialRingOuter}>
                  <View style={styles.radialRingMiddle}>
                    <View style={styles.radialRingInner}>
                      <Text style={styles.donutRatingNumber}>{stats.averagePassPercentage}%</Text>
                      <Text style={styles.donutRatingSub}>Average Pass</Text>
                    </View>
                  </View>
                </View>

                {/* Rating Categories Legend List */}
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendIndicator, { backgroundColor: '#0a1930' }]} />
                    <Text style={styles.legendText}>Excellent (90% - 100%)</Text>
                    <Text style={styles.legendPercent}>{ratingPercentages.excellent}%</Text>
                  </View>
                  
                  <View style={styles.legendItem}>
                    <View style={[styles.legendIndicator, { backgroundColor: '#3b82f6' }]} />
                    <Text style={styles.legendText}>Good (75% - 90%)</Text>
                    <Text style={styles.legendPercent}>{ratingPercentages.good}%</Text>
                  </View>

                  <View style={styles.legendItem}>
                    <View style={[styles.legendIndicator, { backgroundColor: '#94a3b8' }]} />
                    <Text style={styles.legendText}>Below 75%</Text>
                    <Text style={styles.legendPercent}>{ratingPercentages.below35}%</Text>
                  </View>
                </View>
              </View>
            </View>

          </View>
          
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Complete Profile Reminder Modal */}
      <Modal
        visible={isProfileModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="person-add-outline" size={40} color="#3b82f6" />
            </View>
            <Text style={styles.modalTitle}>Update Your Profile</Text>
            <Text style={styles.modalDescription}>
              Your profile is currently incomplete. Please update your name, phone number, and location so that students and administrators can contact you.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setIsProfileModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSubmitButton} 
                onPress={handleGoToSettings}
              >
                <Text style={styles.modalSubmitText}>Update Now</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  panelTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  logoImage: {
    width: 42,
    height: 42,
  },
  panelTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  panelTagText: {
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  logoPartBlue: {
    color: '#3b82f6',
    fontWeight: '900',
  },
  logoPartNavy: {
    color: '#0a1930',
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  notiBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  notiBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },
  userFullName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  userRoleText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#3b82f6',
  },
  scrollContainer: {
    padding: 24,
    alignItems: 'center',
  },
  mainWrapper: {
    maxWidth: '100%',
    gap: 24,
  },
  titleSection: {
    gap: 4,
  },
  dashboardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0a1930',
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  semesterFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  semesterFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    flex: 1,
    minWidth: 180,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  statIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  chartsRow: {
    gap: 24,
  },
  rowLayout: {
    flexDirection: 'row',
  },
  columnLayout: {
    flexDirection: 'column',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    minHeight: 380,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a1930',
    marginBottom: 24,
  },
  barChartWrapper: {
    flexDirection: 'row',
    flex: 1,
    minHeight: 240,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingVertical: 14,
    width: 30,
    alignItems: 'flex-start',
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  barsContainer: {
    flex: 1,
    position: 'relative',
    marginLeft: 8,
  },
  gridLinesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 40,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#f1f5f9',
    width: '100%',
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 2,
    paddingBottom: 40,
  },
  barItemColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },
  barTrack: {
    width: 24,
    height: '100%',
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#0a1930', // Cobalt-navy matching image bars
    borderRadius: 4,
  },
  barLabel: {
    position: 'absolute',
    bottom: -36,
    fontSize: 8,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
    width: 48,
  },
  barLabelSelected: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  barFillSelected: {
    backgroundColor: '#3b82f6',
  },
  selectedCourseCard: {
    marginTop: 48,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedCourseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectedCourseBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  selectedCoursePassRate: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 'auto',
  },
  selectedCourseFullName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 18,
    marginTop: 2,
  },
  donutWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  radialRingOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 16,
    borderColor: '#0a1930', // Simulated full ring
  },
  radialRingMiddle: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  radialRingInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  donutRatingNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0a1930',
  },
  donutRatingSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  legendContainer: {
    width: '100%',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 3,
    marginRight: 10,
  },
  legendText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  legendPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a1930',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalSubmitButton: {
    flex: 1.5,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginTop: 16,
  },
  emptyChartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyChartSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
