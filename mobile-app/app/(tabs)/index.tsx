import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ImageBackground,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { teachersApi, coursesApi, usersApi, getImageUrl } from '../../services/api';
import { NotificationButton } from '../../components/NotificationButton';
import { APP_NAME, APP_SUBTITLE, APP_LOGO } from '../../constants/config';
import { BrandTitle } from '../../components/BrandTitle';

const actionCards = [
  { title: 'About Portal', sub: 'How it works', icon: 'apps', color: '#3b82f6', bg: '#eff6ff', route: '/about-college' },
  { title: 'Performance', sub: 'Track & Analyze', icon: 'bar-chart', color: '#10b981', bg: '#ecfdf5', route: '/performance-overview' },
];



export default function GreenfieldHome() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const containerWidth = isLargeScreen ? 768 : width;
  const router = useRouter();

  const [topTeachers, setTopTeachers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Dynamic stats state
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [dynamicStats, setDynamicStats] = React.useState([
    { label: 'Students', value: '—', icon: 'people', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Faculty', value: '—', icon: 'person', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Courses', value: '—', icon: 'book', color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Departments', value: '—', icon: 'business', color: '#f59e0b', bg: '#fffbeb' },
  ]);

  React.useEffect(() => {
    const fetchTopTeachers = async () => {
      try {
        const data = await teachersApi.getAll({ limit: 4 });
        const results = data.results || (Array.isArray(data) ? data : []);
        setTopTeachers(results.slice(0, 4));
      } catch (err) {
        console.error('Failed to fetch top teachers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopTeachers();
  }, []);

  React.useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        // Fetch ongoing courses
        const coursesData = await coursesApi.getAll({ status: 'ongoing' });
        const ongoingCourses = coursesData.results || (Array.isArray(coursesData) ? coursesData : []);
        const ongoingCount = coursesData.count ?? ongoingCourses.length;

        // Fetch all courses to count unique departments
        const allCoursesData = await coursesApi.getAll();
        const allCourses = allCoursesData.results || (Array.isArray(allCoursesData) ? allCoursesData : []);
        const deptSet = new Set<string>();
        allCourses.forEach((c: any) => c.department && deptSet.add(c.department));

        // Fetch teacher-role users (role=teacher)
        const teachersData = await usersApi.getAll({ role: 'teacher' });
        const teacherCount = teachersData.count ?? (teachersData.results || (Array.isArray(teachersData) ? teachersData : [])).length;

        // Fetch student-role users (role=student)
        const studentsData = await usersApi.getAll({ role: 'student' });
        const studentCount = studentsData.count ?? (studentsData.results || (Array.isArray(studentsData) ? studentsData : [])).length;

        setDynamicStats([
          { label: 'Students', value: studentCount > 0 ? studentCount.toLocaleString() : '—', icon: 'people', color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Faculty', value: teacherCount > 0 ? teacherCount.toLocaleString() : '—', icon: 'person', color: '#10b981', bg: '#ecfdf5' },
          { label: 'Courses', value: ongoingCount > 0 ? String(ongoingCount) : '—', icon: 'book', color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'Departments', value: deptSet.size > 0 ? String(deptSet.size) : '—', icon: 'business', color: '#f59e0b', bg: '#fffbeb' },
        ]);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);
  
  // Action cards: 2 columns layout
  const numActionCols = 2;
  const actionCardWidth = (containerWidth - 32 - (12 * (numActionCols - 1))) / numActionCols;

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
        <View style={[styles.responsiveWrapper, { width: isLargeScreen ? 768 : '100%' }]}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1200' }}
            style={styles.heroImage}
            imageStyle={{ borderRadius: 20 }}
          >
            <LinearGradient
              colors={['rgba(0, 20, 60, 0.9)', 'rgba(0, 20, 60, 0.4)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroWelcome}>Welcome to</Text>
                <Text style={styles.heroTitle}><Text style={{ color: '#3b82f6' }}>{APP_NAME}</Text>{"\n"}{APP_SUBTITLE}</Text>
                <View style={styles.heroDivider} />
                <Text style={styles.heroDesc}>Empowering minds.{"\n"}Shaping futures.</Text>
              </View>
            </LinearGradient>
            <View style={styles.sliderDots}>
              <View style={[styles.dot, styles.activeDot]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </ImageBackground>
        </View>

        {/* Action Cards Grid */}
        <View style={styles.actionGrid}>
          {actionCards.map((card, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={[styles.actionCard, { width: actionCardWidth }]}
              onPress={() => {
                if (card.route) {
                  router.push(card.route as any);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.actionCardContent}>
                <View style={[styles.actionIconContainer, { backgroundColor: card.bg }]}>
                  <Ionicons name={card.icon as any} size={28} color={card.color} />
                </View>
                <Text style={styles.actionTitle}>{card.title}</Text>
                <Text style={styles.actionSub}>{card.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#3b82f6" style={styles.actionChevron} />
            </TouchableOpacity>
          ))}
        </View>

        {/* At a Glance Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleMain}>At a Glance</Text>
        </View>
        <View style={styles.statsWrapper}>
          <View style={styles.statsContainer}>
            {dynamicStats.map((stat, idx) => (
              <View key={idx} style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: stat.bg }]}>
                  <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                </View>
                {statsLoading ? (
                  <ActivityIndicator size="small" color={stat.color} style={{ marginBottom: 2 }} />
                ) : (
                  <Text style={styles.statValue}>{stat.value}</Text>
                )}
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Teachers Section */}
        <View style={styles.sectionHeaderWithLink}>
          <Text style={styles.sectionTitleMain}>Top Teachers</Text>
          <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/professors')}>
            <Text style={styles.viewAllLink}>View All</Text>
            <Ionicons name="chevron-forward" size={12} color="#3b82f6" />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.teachersScroll}>
          {loading ? (
            <View style={{ width: '100%', alignItems: 'center', padding: 20 }}>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : topTeachers.length > 0 ? (
            topTeachers.map((teacher) => (
              <TouchableOpacity 
                key={teacher.id} 
                style={styles.teacherCard}
                onPress={() => router.push(`/professor/${teacher.id}`)}
              >
                <View style={styles.teacherImageWrapper}>
                  <Image source={{ uri: getImageUrl(teacher.profile_image) }} style={styles.teacherImage} />
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={10} color="#eab308" />
                    <Text style={styles.ratingText}>{teacher.avg_pass_percentage > 0 ? (teacher.avg_pass_percentage / 20).toFixed(1) : '4.5'}</Text>
                  </View>
                </View>
                <Text style={styles.teacherName}>{`Dr. ${teacher.first_name} ${teacher.last_name}`}</Text>
                <Text style={styles.teacherDept}>{teacher.department}</Text>
                <TouchableOpacity style={styles.mailBtn}>
                  <Ionicons name="mail-outline" size={18} color="#3b82f6" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ padding: 20 }}>
              <Text style={{ color: '#64748b' }}>No teachers found.</Text>
            </View>
          )}
        </ScrollView>


        <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc', // Light background matching image
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
  heroContainer: {
    padding: 16,
  },
  heroImage: {
    height: 240,
    width: '100%',
    borderRadius: 20,
  },
  heroGradient: {
    flex: 1,
    borderRadius: 20,
  },
  heroContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  heroWelcome: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    lineHeight: 22,
    width: '90%',
  },
  heroDivider: {
    width: 36,
    height: 4,
    backgroundColor: '#f59e0b',
    marginBottom: 16,
    borderRadius: 2,
  },
  heroDesc: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    opacity: 0.95,
  },
  sliderDots: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    width: 20,
    backgroundColor: '#fff',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  actionCardContent: {
    alignItems: 'center',
    width: '100%',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  actionChevron: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 28,
    marginBottom: 16,
  },
  sectionTitleMain: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statsWrapper: {
    paddingHorizontal: 16,
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  sectionHeaderWithLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 32,
    marginBottom: 16,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllLink: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '700',
  },
  teachersScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  teacherCard: {
    backgroundColor: '#fff',
    width: 160,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  teacherImageWrapper: {
    marginBottom: 16,
  },
  teacherImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f8fafc',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 2,
    color: '#0f172a',
  },
  teacherName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  teacherDept: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  teacherSub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  mailBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

});
